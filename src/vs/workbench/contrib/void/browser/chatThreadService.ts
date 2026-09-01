/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';

import { URI } from '../../../../base/common/uri.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { chat_userMessageContent, isABuiltinToolName } from '../common/prompt/prompts.js';
import { AnthropicReasoning, getErrorMessage, RawToolCallObj, RawToolParamsObj } from '../common/sendLLMMessageTypes.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { FeatureName, ModelSelection, ModelSelectionOptions } from '../common/voidSettingsTypes.js';
import { ILoopholeSettingsService } from '../common/voidSettingsService.js';
import { approvalTypeOfBuiltinToolName, BuiltinToolCallParams, ToolCallParams, ToolName, ToolResult } from '../common/toolsServiceTypes.js';
import { IToolsService } from './toolsService.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { ILanguageFeaturesService } from '../../../../editor/common/services/languageFeatures.js';
import { ChatMessage, CheckpointEntry, CodespanLocationLink, StagingSelectionItem, ToolMessage } from '../common/chatThreadServiceTypes.js';
import { Position } from '../../../../editor/common/core/position.js';
import { IMetricsService } from '../common/metricsService.js';
import { shorten } from '../../../../base/common/labels.js';
import { ILoopholeModelService } from '../common/voidModelService.js';
import { findLast, findLastIdx } from '../../../../base/common/arraysFind.js';
import { IEditCodeService } from './editCodeServiceInterface.js';
import { VoidFileSnapshot } from '../common/editCodeServiceTypes.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { truncate } from '../../../../base/common/strings.js';
import { THREAD_STORAGE_KEY } from '../common/storageKeys.js';
import { IConvertToLLMMessageService } from './convertToLLMMessageService.js';
import { timeout } from '../../../../base/common/async.js';
import { deepClone } from '../../../../base/common/objects.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IDirectoryStrService } from '../common/directoryStrService.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { VSBuffer } from '../../../../base/common/buffer.js';
import { IMCPService } from '../common/mcpService.js';
import { RawMCPToolCall } from '../common/mcpServiceTypes.js';
import { ITokenUsageService } from '../common/tokenUsageService.js';
import { TokenUsageInfo } from '../common/sendLLMMessageTypes.js';;

export const IChatThreadService = createDecorator<IChatThreadService>('voidChatThreadService');


// related to retrying when LLM message has error
const CHAT_RETRIES = 3
const RETRY_DELAY = 2500


const findStagingSelectionIndex = (currentSelections: StagingSelectionItem[] | undefined, newSelection: StagingSelectionItem): number | null => {
	if (!currentSelections) return null

	for (let i = 0; i < currentSelections.length; i += 1) {
		const s = currentSelections[i]

		// for URI-based types, skip if URIs don't match
		if ('uri' in s && 'uri' in newSelection && s.uri && newSelection.uri) {
			if (s.uri.fsPath !== newSelection.uri.fsPath) continue
		}

		if (s.type === 'File' && newSelection.type === 'File') {
			return i
		}
		if (s.type === 'CodeSelection' && newSelection.type === 'CodeSelection') {
			if (s.uri.fsPath !== newSelection.uri.fsPath) continue
			// if there's any collision return true
			const [oldStart, oldEnd] = s.range
			const [newStart, newEnd] = newSelection.range
			if (oldStart !== newStart || oldEnd !== newEnd) continue
			return i
		}
		if (s.type === 'Folder' && newSelection.type === 'Folder') {
			return i
		}
		if (s.type === 'CurrentFile' && newSelection.type === 'CurrentFile') {
			return i
		}
		if (s.type === 'Terminal' && newSelection.type === 'Terminal') {
			return i
		}
		if (s.type === 'GitDiff' && newSelection.type === 'GitDiff') {
			return i
		}
		if (s.type === 'Problems' && newSelection.type === 'Problems') {
			return i
		}
	}
	return null
}


/*

Store a checkpoint of all "before" files on each x.
x's show up before user messages and LLM edit tool calls.

x     A          (edited A -> A')
(... user modified changes ...)
User message

x     A' B C     (edited A'->A'', B->B', C->C')
LLM Edit
x
LLM Edit
x
LLM Edit


INVARIANT:
A checkpoint appears before every LLM message, and before every user message (before user really means directly after LLM is done).
*/


type UserMessageType = ChatMessage & { role: 'user' }
type UserMessageState = UserMessageType['state']
const defaultMessageState: UserMessageState = {
	stagingSelections: [],
	isBeingEdited: false,
}

// a 'thread' means a chat message history

type WhenMounted = {
	textAreaRef: { current: HTMLTextAreaElement | null }; // the textarea that this thread has, gets set in SidebarChat
	scrollToBottom: () => void;
}



export type ThreadType = {
	id: string; // store the id here too
	createdAt: string; // ISO string
	lastModified: string; // ISO string

	messages: ChatMessage[];
	filesWithUserChanges: Set<string>;
	todos: import('../common/toolsServiceTypes.js').TodoItem[]; // per-thread todo list managed by todo_write tool
	llmCompactionSummary?: string | null; // LLM-generated summary, null = currently generating, undefined = not yet triggered

	// this doesn't need to go in a state object, but feels right
	state: {
		currCheckpointIdx: number | null; // the latest checkpoint we're at (null if not at a particular checkpoint, like if the chat is streaming, or chat just finished and we haven't clicked on a checkpt)

		stagingSelections: StagingSelectionItem[];
		focusedMessageIdx: number | undefined; // index of the user message that is being edited (undefined if none)

		linksOfMessageIdx: { // eg. link = linksOfMessageIdx[4]['RangeFunction']
			[messageIdx: number]: {
				[codespanName: string]: CodespanLocationLink
			}
		}

		// Cumulative token count for the entire thread (updated when assistant messages complete)
		cumulativeTokenCount: number;


		mountedInfo?: {
			whenMounted: Promise<WhenMounted>
			_whenMountedResolver: (res: WhenMounted) => void
			mountedIsResolvedRef: { current: boolean };
		}


	};
}

type ChatThreads = {
	[id: string]: undefined | ThreadType;
}


export type ThreadsState = {
	allThreads: ChatThreads;
	currentThreadId: string; // intended for internal use only
}

export type IsRunningType =
	| 'LLM' // the LLM is currently streaming
	| 'tool' // whether a tool is currently running
	| 'awaiting_user' // awaiting user call
	| 'idle' // nothing is running now, but the chat should still appear like it's going (used in-between calls)
	| undefined

export type ThreadStreamState = {
	[threadId: string]: undefined | {
		isRunning: undefined;
		error?: { message: string, fullError: Error | null, };
		llmInfo?: undefined;
		toolInfo?: undefined;
		interrupt?: undefined;
	} | { // an assistant message is being written
		isRunning: 'LLM';
		error?: undefined;
		llmInfo: {
			displayContentSoFar: string;
			reasoningSoFar: string;
			toolCallSoFar: RawToolCallObj | null;
		};
		toolInfo?: undefined;
		interrupt: Promise<() => void>; // calling this should have no effect on state - would be too confusing. it just cancels the tool
	} | { // a tool is being run
		isRunning: 'tool';
		error?: undefined;
		llmInfo?: undefined;
		toolInfo: {
			toolName: ToolName;
			toolParams: ToolCallParams<ToolName>;
			id: string;
			content: string;
			rawParams: RawToolParamsObj;
			mcpServerName: string | undefined;
		};
		interrupt: Promise<() => void>;
	} | {
		isRunning: 'awaiting_user';
		error?: undefined;
		llmInfo?: undefined;
		toolInfo?: undefined;
		interrupt?: undefined;
	} | {
		isRunning: 'idle';
		error?: undefined;
		llmInfo?: undefined;
		toolInfo?: undefined;
		interrupt: 'not_needed' | Promise<() => void>; // calling this should have no effect on state - would be too confusing. it just cancels the tool
	}
}

const newThreadObject = () => {
	const now = new Date().toISOString()
	return {
		id: generateUuid(),
		createdAt: now,
		lastModified: now,
		messages: [],
		todos: [],
		state: {
			currCheckpointIdx: null,
			stagingSelections: [],
			focusedMessageIdx: undefined,
			linksOfMessageIdx: {},
			cumulativeTokenCount: 0,
		},
		filesWithUserChanges: new Set()
	} satisfies ThreadType
}






export interface IChatThreadService {
	readonly _serviceBrand: undefined;

	readonly state: ThreadsState;
	readonly streamState: ThreadStreamState; // not persistent

	onDidChangeCurrentThread: Event<void>;
	onDidChangeStreamState: Event<{ threadId: string }>

	getCurrentThread(): ThreadType;
	openNewThread(): void;
	switchToThread(threadId: string): void;

	// thread selector
	deleteThread(threadId: string): void;
	duplicateThread(threadId: string): void;

	// exposed getters/setters
	// these all apply to current thread
	getCurrentMessageState: (messageIdx: number) => UserMessageState
	setCurrentMessageState: (messageIdx: number, newState: Partial<UserMessageState>) => void
	getCurrentThreadState: () => ThreadType['state']
	setCurrentThreadState: (newState: Partial<ThreadType['state']>) => void

	// you can edit multiple messages - the one you're currently editing is "focused", and we add items to that one when you press cmd+L.
	getCurrentFocusedMessageIdx(): number | undefined;
	isCurrentlyFocusingMessage(): boolean;
	setCurrentlyFocusedMessageIdx(messageIdx: number | undefined): void;

	popStagingSelections(numPops?: number): void;
	addNewStagingSelection(newSelection: StagingSelectionItem): void;

	dangerousSetState: (newState: ThreadsState) => void;
	resetState: () => void;

	// todo_write tool support
	getTodosForThread(threadId: string): import('../common/toolsServiceTypes.js').TodoItem[];
	setTodosForThread(threadId: string, todos: import('../common/toolsServiceTypes.js').TodoItem[]): void;

	// ask_followup_question tool support
	addFollowupQuestion(threadId: string, opts: { question: string, suggestions: string[] }): void;
	waitForFollowupResponse(threadId: string): Promise<string>;

	// session memory
	readSessionMemoryBlock(): Promise<string | null>;
	getCompactionSummary(threadId: string): string | null;

	// background task notifications
	injectBackgroundTaskResult(threadId: string, taskId: string, description: string, output: string, state: 'completed' | 'error'): void;

	// sub-agent: run a full agentic loop with tools, returns the final assistant text
	runSubAgentLoop(opts: { prompt: string, chatMode: import('../common/voidSettingsTypes.js').ChatMode, modelSelection: import('../common/voidSettingsTypes.js').ModelSelection | null, parentThreadId: string }): Promise<string>;

	// // current thread's staging selections
	// closeCurrentStagingSelectionsInMessage(opts: { messageIdx: number }): void;
	// closeCurrentStagingSelectionsInThread(): void;

	// codespan links (link to symbols in the markdown)
	getCodespanLink(opts: { codespanStr: string, messageIdx: number, threadId: string }): CodespanLocationLink | undefined;
	addCodespanLink(opts: { newLinkText: string, newLinkLocation: CodespanLocationLink, messageIdx: number, threadId: string }): void;
	generateCodespanLink(opts: { codespanStr: string, threadId: string }): Promise<CodespanLocationLink>;
	getRelativeStr(uri: URI): string | undefined

	// entry pts
	abortRunning(threadId: string): Promise<void>;
	dismissStreamError(threadId: string): void;

	// call to edit a message
	editUserMessageAndStreamResponse({ userMessage, messageIdx, threadId }: { userMessage: string, messageIdx: number, threadId: string }): Promise<void>;

	// call to add a message
	addUserMessageAndStreamResponse({ userMessage, threadId }: { userMessage: string, threadId: string }): Promise<void>;

	// approve/reject
	approveLatestToolRequest(threadId: string): void;
	rejectLatestToolRequest(threadId: string): void;

	// jump to history
	jumpToCheckpointBeforeMessageIdx(opts: { threadId: string, messageIdx: number, jumpToUserModified: boolean }): void;

	focusCurrentChat: () => Promise<void>
	blurCurrentChat: () => Promise<void>
}
class ChatThreadService extends Disposable implements IChatThreadService {
	_serviceBrand: undefined;

	// this fires when the current thread changes at all (a switch of currentThread, or a message added to it, etc)
	private readonly _onDidChangeCurrentThread = new Emitter<void>();
	readonly onDidChangeCurrentThread: Event<void> = this._onDidChangeCurrentThread.event;

	private readonly _onDidChangeStreamState = new Emitter<{ threadId: string }>();
	readonly onDidChangeStreamState: Event<{ threadId: string }> = this._onDidChangeStreamState.event;

	readonly streamState: ThreadStreamState = {}
	state: ThreadsState // allThreads is persisted, currentThread is not

	// used in checkpointing
	// private readonly _userModifiedFilesToCheckInCheckpoints = new LRUCache<string, null>(50)



	constructor(
		@IStorageService private readonly _storageService: IStorageService,
		@ILoopholeModelService private readonly _voidModelService: ILoopholeModelService,
		@ILLMMessageService private readonly _llmMessageService: ILLMMessageService,
		@IToolsService private readonly _toolsService: IToolsService,
		@ILoopholeSettingsService private readonly _settingsService: ILoopholeSettingsService,
		@ILanguageFeaturesService private readonly _languageFeaturesService: ILanguageFeaturesService,
		@IMetricsService private readonly _metricsService: IMetricsService,
		@IEditCodeService private readonly _editCodeService: IEditCodeService,
		@INotificationService private readonly _notificationService: INotificationService,
		@IConvertToLLMMessageService private readonly _convertToLLMMessagesService: IConvertToLLMMessageService,
		@IWorkspaceContextService private readonly _workspaceContextService: IWorkspaceContextService,
		@IDirectoryStrService private readonly _directoryStringService: IDirectoryStrService,
		@IFileService private readonly _fileService: IFileService,
		@IMCPService private readonly _mcpService: IMCPService,
		@ITokenUsageService private readonly _tokenUsageService: ITokenUsageService,
	) {
		super()
		this.state = { allThreads: {}, currentThreadId: null as unknown as string } // default state

		const readThreads = this._readAllThreads() || {}

		// Migration: Add cumulativeTokenCount to existing threads
		const migratedThreads: ChatThreads = {}
		for (const [threadId, thread] of Object.entries(readThreads)) {
			if (!thread) continue

			// Calculate cumulative token count from assistant messages
			let cumulativeCount = 0
			for (const message of thread.messages) {
				if (message.role === 'assistant' && message.tokenUsage) {
					cumulativeCount += message.tokenUsage.totalTokens
				}
			}

			migratedThreads[threadId] = {
				...thread,
				todos: thread.todos ?? [], // migration: default to empty for old threads
				state: {
					...thread.state,
					cumulativeTokenCount: thread.state.cumulativeTokenCount ?? cumulativeCount
				}
			}
		}

		this.state = {
			allThreads: migratedThreads,
			currentThreadId: null as unknown as string, // gets set in startNewThread()
		}

		// always be in a thread
		this.openNewThread()


		// keep track of user-modified files
		// const disposablesOfModelId: { [modelId: string]: IDisposable[] } = {}
		// this._register(
		// 	this._modelService.onModelAdded(e => {
		// 		if (!(e.id in disposablesOfModelId)) disposablesOfModelId[e.id] = []
		// 		disposablesOfModelId[e.id].push(
		// 			e.onDidChangeContent(() => { this._userModifiedFilesToCheckInCheckpoints.set(e.uri.fsPath, null) })
		// 		)
		// 	})
		// )
		// this._register(this._modelService.onModelRemoved(e => {
		// 	if (!(e.id in disposablesOfModelId)) return
		// 	disposablesOfModelId[e.id].forEach(d => d.dispose())
		// }))

	}

	async focusCurrentChat() {
		const threadId = this.state.currentThreadId
		const thread = this.state.allThreads[threadId]
		if (!thread) return
		const s = await thread.state.mountedInfo?.whenMounted
		if (!this.isCurrentlyFocusingMessage()) {
			s?.textAreaRef.current?.focus()
		}
	}
	async blurCurrentChat() {
		const threadId = this.state.currentThreadId
		const thread = this.state.allThreads[threadId]
		if (!thread) return
		const s = await thread.state.mountedInfo?.whenMounted
		if (!this.isCurrentlyFocusingMessage()) {
			s?.textAreaRef.current?.blur()
		}
	}



	dangerousSetState = (newState: ThreadsState) => {
		this.state = newState
		this._onDidChangeCurrentThread.fire()
	}
	resetState = () => {
		this.state = { allThreads: {}, currentThreadId: null as unknown as string } // see constructor
		this.openNewThread()
		this._onDidChangeCurrentThread.fire()
	}

	getCompactionSummary = (threadId: string): string | null => {
		return this._getCompactionSummary(threadId)
	}

	// Injects a background task result as a tool message into the thread,
	// so the primary agent sees it on its next turn.
	injectBackgroundTaskResult = (threadId: string, taskId: string, description: string, output: string, state: 'completed' | 'error'): void => {
		const tag = state === 'completed' ? 'task_result' : 'task_error'
		const title = state === 'completed' ? `Background task completed: ${description}` : `Background task failed: ${description}`
		const content = [
			`<task id="${taskId}" state="${state}">`,
			`<summary>${title}</summary>`,
			`<${tag}>`,
			output,
			`</${tag}>`,
			`</task>`,
		].join('\n')

		// Add as a tool result message so the agent sees it
		this._addMessageToThread(threadId, {
			role: 'tool',
			name: 'task',
			id: `bg-${taskId}`,
			mcpServerName: undefined,
			content,
			rawParams: { description, task_id: taskId, background: true },
			state: { isError: state === 'error' },
		} as any)

		this._onDidChangeCurrentThread.fire()
	}

	// Run a full agentic loop for a sub-agent task — gives the sub-agent full tool access
	runSubAgentLoop = async ({ prompt, chatMode, modelSelection, parentThreadId }: {
		prompt: string,
		chatMode: import('../common/voidSettingsTypes.js').ChatMode,
		modelSelection: import('../common/voidSettingsTypes.js').ModelSelection | null,
		parentThreadId: string,
	}): Promise<string> => {
		// Create an ephemeral sub-thread to run the agent in
		const subThreadId = generateUuid()
		const subThread = newThreadObject()
		this._setState({
			allThreads: { ...this.state.allThreads, [subThreadId]: { ...subThread, id: subThreadId } }
		})

		// Add the user prompt as the first message
		this._addMessageToThread(subThreadId, {
			role: 'user',
			content: prompt,
			displayContent: prompt,
			selections: null,
			state: defaultMessageState,
		})

		// Run the full agentic loop on the sub-thread
		const { overridesOfModel } = this._settingsService.state
		const modelSelectionOptions = modelSelection
			? this._settingsService.state.optionsOfModelSelection['Chat']?.[modelSelection.providerName]?.[modelSelection.modelName]
			: undefined
		let nSteps = 0
		const SUB_AGENT_MAX_STEPS = 30
		let shouldContinue = true
		let lastAssistantText = ''

		while (shouldContinue && nSteps < SUB_AGENT_MAX_STEPS) {
			shouldContinue = false
			nSteps++

			const chatMessages = this.state.allThreads[subThreadId]?.messages ?? []
			const { messages, separateSystemMessage } = await this._convertToLLMMessagesService.prepareLLMChatMessages({
				chatMessages,
				modelSelection,
				chatMode,
			})

			const result = await new Promise<{ text: string, toolCalls: RawToolCallObj[] }>((resolve, reject) => {
				this._llmMessageService.sendLLMMessage({
					messagesType: 'chatMessages',
					chatMode,
					messages,
					modelSelection,
					modelSelectionOptions,
					overridesOfModel,
					separateSystemMessage,
					logging: { loggingName: `SubAgent step ${nSteps}`, loggingExtras: { parentThreadId, chatMode } },
					onText: () => {},
					onFinalMessage: ({ fullText, toolCalls, toolCall }) => {
						const calls = toolCalls ?? (toolCall ? [toolCall] : [])
						resolve({ text: fullText, toolCalls: calls })
					},
					onError: ({ message }) => reject(new Error(message)),
					onAbort: () => reject(new Error('Sub-agent aborted')),
				})
			})

			lastAssistantText = result.text
			this._addMessageToThread(subThreadId, {
				role: 'assistant',
				displayContent: result.text,
				reasoning: '',
				anthropicReasoning: null,
			})

			// Execute tool calls if any
			if (result.toolCalls.length > 0) {
				const mcpTools = this._mcpService.getMCPTools()
				const readOnlyTools = new Set(['read_file', 'ls_dir', 'get_dir_tree', 'search_pathnames_only', 'search_for_files', 'search_in_file', 'read_lint_errors', 'load_skill', 'todo_write'])

				// Run read-only calls in parallel, writes sequentially
				const groups: Array<{ parallel: boolean, calls: RawToolCallObj[] }> = []
				for (const tc of result.toolCalls) {
					const parallel = readOnlyTools.has(tc.name)
					const last = groups[groups.length - 1]
					if (last && last.parallel === parallel) { last.calls.push(tc) }
					else { groups.push({ parallel, calls: [tc] }) }
				}

				for (const group of groups) {
					if (group.parallel && group.calls.length > 1) {
						await Promise.all(group.calls.map(tc => {
							const mcpTool = mcpTools?.find(t => t.name === tc.name)
							return this._runToolCall(subThreadId, tc.name, tc.id, mcpTool?.mcpServerName, { preapproved: false, unvalidatedToolParams: tc.rawParams })
						}))
					} else {
						for (const tc of group.calls) {
							const mcpTool = mcpTools?.find(t => t.name === tc.name)
							await this._runToolCall(subThreadId, tc.name, tc.id, mcpTool?.mcpServerName, { preapproved: false, unvalidatedToolParams: tc.rawParams })
						}
					}
				}
				shouldContinue = true // tool calls mean we keep going
			}
		}

		// Clean up the ephemeral sub-thread
		const { [subThreadId]: _removed, ...remainingThreads } = this.state.allThreads
		this._setState({ allThreads: remainingThreads })

		return lastAssistantText || '(no output)'
	}

	getTodosForThread = (threadId: string): import('../common/toolsServiceTypes.js').TodoItem[] => {
		return this.state.allThreads[threadId]?.todos ?? []
	}

	setTodosForThread = (threadId: string, todos: import('../common/toolsServiceTypes.js').TodoItem[]): void => {
		const thread = this.state.allThreads[threadId]
		if (!thread) return
		this._setState({
			allThreads: {
				...this.state.allThreads,
				[threadId]: { ...thread, todos }
			}
		})
	}

	// ─── ask_followup_question support ────────────────────────────────────────
	// Pending resolvers keyed by threadId — one per thread at a time.
	private _followupResolvers = new Map<string, (answer: string) => void>()

	addFollowupQuestion = (threadId: string, opts: { question: string, suggestions: string[] }): void => {
		// Surface the question to the user as a special assistant message
		const suggestionText = opts.suggestions.length > 0
			? `\n\nSuggested answers:\n${opts.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
			: ''
		const followupMsg: any = {
			role: 'assistant' as const,
			displayContent: `**Question:** ${opts.question}${suggestionText}`,
			reasoning: '',
			anthropicReasoning: null,
		}
		this._addMessageToThread(threadId, followupMsg)
		// Signal to the UI that we're waiting for user input
		this._setStreamState(threadId, { isRunning: 'awaiting_user' })
	}

	waitForFollowupResponse = (threadId: string): Promise<string> => {
		return new Promise<string>((resolve) => {
			this._followupResolvers.set(threadId, resolve)
		})
	}

	// Called by the normal user-send flow to resolve any pending followup
	private _resolveFollowupIfPending = (threadId: string, userText: string): boolean => {
		const resolver = this._followupResolvers.get(threadId)
		if (resolver) {
			this._followupResolvers.delete(threadId)
			resolver(userText)
			return true
		}
		return false
	}

	// !!! this is important for properly restoring URIs from storage
	// should probably re-use code from void/src/vs/base/common/marshalling.ts instead. but this is simple enough
	private _convertThreadDataFromStorage(threadsStr: string): ChatThreads {
		return JSON.parse(threadsStr, (key, value) => {
			if (value && typeof value === 'object' && value.$mid === 1) { // $mid is the MarshalledId. $mid === 1 means it is a URI
				return URI.from(value); // TODO URI.revive instead of this?
			}
			return value;
		});
	}

	private _readAllThreads(): ChatThreads | null {
		const threadsStr = this._storageService.get(THREAD_STORAGE_KEY, StorageScope.APPLICATION);
		if (!threadsStr) {
			return null
		}
		const threads = this._convertThreadDataFromStorage(threadsStr);

		return threads
	}

	private _storeAllThreads(threads: ChatThreads) {
		const serializedThreads = JSON.stringify(threads);
		this._storageService.store(
			THREAD_STORAGE_KEY,
			serializedThreads,
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
	}


	// this should be the only place this.state = ... appears besides constructor
	private _setState(state: Partial<ThreadsState>, doNotRefreshMountInfo?: boolean) {
		const newState = {
			...this.state,
			...state
		}

		this.state = newState

		this._onDidChangeCurrentThread.fire()


		// if we just switched to a thread, update its current stream state if it's not streaming to possibly streaming
		const threadId = newState.currentThreadId
		const streamState = this.streamState[threadId]
		if (streamState?.isRunning === undefined && !streamState?.error) {

			// set streamState
			const messages = newState.allThreads[threadId]?.messages
			const lastMessage = messages && messages[messages.length - 1]
			// if awaiting user but stream state doesn't indicate it (happens if restart Loophole)
			if (lastMessage && lastMessage.role === 'tool' && lastMessage.type === 'tool_request')
				this._setStreamState(threadId, { isRunning: 'awaiting_user', })

			// if running now but stream state doesn't indicate it (happens if restart Loophole), cancel that last tool
			if (lastMessage && lastMessage.role === 'tool' && lastMessage.type === 'running_now') {

				this._updateLatestTool(threadId, { role: 'tool', type: 'rejected', content: lastMessage.content, id: lastMessage.id, rawParams: lastMessage.rawParams, result: null, name: lastMessage.name, params: lastMessage.params, mcpServerName: lastMessage.mcpServerName })
			}

		}


		// if we did not just set the state to true, set mount info
		if (doNotRefreshMountInfo) return

		let whenMountedResolver: (w: WhenMounted) => void
		const whenMountedPromise = new Promise<WhenMounted>((res) => whenMountedResolver = res)

		this._setThreadState(threadId, {
			mountedInfo: {
				whenMounted: whenMountedPromise,
				mountedIsResolvedRef: { current: false },
				_whenMountedResolver: (w: WhenMounted) => {
					whenMountedResolver(w)
					const mountInfo = this.state.allThreads[threadId]?.state.mountedInfo
					if (mountInfo) mountInfo.mountedIsResolvedRef.current = true
				},
			}
		}, true) // do not trigger an update



	}


	private _setStreamState(threadId: string, state: ThreadStreamState[string]) {
		this.streamState[threadId] = state
		this._onDidChangeStreamState.fire({ threadId })
	}


	// ---------- streaming ----------



	private _currentModelSelectionProps = () => {
		// these settings should not change throughout the loop (eg anthropic breaks if you change its thinking mode and it's using tools)
		const featureName: FeatureName = 'Chat'
		const modelSelection = this._settingsService.state.modelSelectionOfFeature[featureName]
		const modelSelectionOptions = modelSelection ? this._settingsService.state.optionsOfModelSelection[featureName][modelSelection.providerName]?.[modelSelection.modelName] : undefined
		return { modelSelection, modelSelectionOptions }
	}



	private _swapOutLatestStreamingToolWithResult = (threadId: string, tool: ChatMessage & { role: 'tool' }) => {
		const messages = this.state.allThreads[threadId]?.messages
		if (!messages) return false
		const lastMsg = messages[messages.length - 1]
		if (!lastMsg) return false

		if (lastMsg.role === 'tool' && lastMsg.type !== 'invalid_params') {
			this._editMessageInThread(threadId, messages.length - 1, tool)
			return true
		}
		return false
	}
	private _updateLatestTool = (threadId: string, tool: ChatMessage & { role: 'tool' }) => {
		const swapped = this._swapOutLatestStreamingToolWithResult(threadId, tool)
		if (swapped) return
		this._addMessageToThread(threadId, tool)
	}

	approveLatestToolRequest(threadId: string) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return // should never happen

		const lastMsg = thread.messages[thread.messages.length - 1]
		if (!(lastMsg.role === 'tool' && lastMsg.type === 'tool_request')) return // should never happen

		const callThisToolFirst: ToolMessage<ToolName> = lastMsg

		this._wrapRunAgentToNotify(
			this._runChatAgent({ callThisToolFirst, threadId, ...this._currentModelSelectionProps() })
			, threadId
		)
	}
	rejectLatestToolRequest(threadId: string) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return // should never happen

		const lastMsg = thread.messages[thread.messages.length - 1]

		let params: ToolCallParams<ToolName>
		if (lastMsg.role === 'tool' && lastMsg.type !== 'invalid_params') {
			params = lastMsg.params
		}
		else return

		const { name, id, rawParams, mcpServerName } = lastMsg

		const errorMessage = this.toolErrMsgs.rejected
		this._updateLatestTool(threadId, { role: 'tool', type: 'rejected', params: params, name: name, content: errorMessage, result: null, id, rawParams, mcpServerName })
		this._setStreamState(threadId, undefined)
	}

	private _computeMCPServerOfToolName = (toolName: string) => {
		return this._mcpService.getMCPTools()?.find(t => t.name === toolName)?.mcpServerName
	}

	async abortRunning(threadId: string) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return // should never happen

		// add assistant message
		if (this.streamState[threadId]?.isRunning === 'LLM') {
			const { displayContentSoFar, reasoningSoFar, toolCallSoFar } = this.streamState[threadId].llmInfo
			this._addMessageToThread(threadId, { role: 'assistant', displayContent: displayContentSoFar, reasoning: reasoningSoFar, anthropicReasoning: null })
			if (toolCallSoFar) this._addMessageToThread(threadId, { role: 'interrupted_streaming_tool', name: toolCallSoFar.name, mcpServerName: this._computeMCPServerOfToolName(toolCallSoFar.name) })
		}
		// add tool that's running
		else if (this.streamState[threadId]?.isRunning === 'tool') {
			const { toolName, toolParams, id, content: content_, rawParams, mcpServerName } = this.streamState[threadId].toolInfo
			const content = content_ || this.toolErrMsgs.interrupted
			this._updateLatestTool(threadId, { role: 'tool', name: toolName, params: toolParams, id, content, rawParams, type: 'rejected', result: null, mcpServerName })
		}
		// reject the tool for the user if relevant
		else if (this.streamState[threadId]?.isRunning === 'awaiting_user') {
			this.rejectLatestToolRequest(threadId)
		}
		else if (this.streamState[threadId]?.isRunning === 'idle') {
			// do nothing
		}

		this._addUserCheckpoint({ threadId })

		// interrupt any effects
		const interrupt = await this.streamState[threadId]?.interrupt
		if (typeof interrupt === 'function')
			interrupt()


		this._setStreamState(threadId, undefined)
	}



	private readonly toolErrMsgs = {
		rejected: 'Tool call was rejected by the user.',
		interrupted: 'Tool call was interrupted by the user.',
		errWhenStringifying: (error: any) => `Tool call succeeded, but there was an error stringifying the output.\n${getErrorMessage(error)}`
	}


	// private readonly _currentlyRunningToolInterruptor: { [threadId: string]: (() => void) | undefined } = {}


	// returns true when the tool call is waiting for user approval
	private _runToolCall = async (
		threadId: string,
		toolName: ToolName,
		toolId: string,
		mcpServerName: string | undefined,
		opts: { preapproved: true, unvalidatedToolParams: RawToolParamsObj, validatedParams: ToolCallParams<ToolName> } | { preapproved: false, unvalidatedToolParams: RawToolParamsObj },
	): Promise<{ awaitingUserApproval?: boolean, interrupted?: boolean }> => {

		// compute these below
		let toolParams: ToolCallParams<ToolName>
		let toolResult: ToolResult<ToolName>
		let toolResultStr: string

		// Check if it's a built-in tool
		const isBuiltInTool = isABuiltinToolName(toolName)


		if (!opts.preapproved) { // skip this if pre-approved
			// 1. validate tool params
			try {
				if (isBuiltInTool) {
					const params = this._toolsService.validateParams[toolName](opts.unvalidatedToolParams)
					toolParams = params
				}
				else {
					toolParams = opts.unvalidatedToolParams
				}
			}
			catch (error) {
				const errorMessage = getErrorMessage(error)
				this._addMessageToThread(threadId, { role: 'tool', type: 'invalid_params', rawParams: opts.unvalidatedToolParams, result: null, name: toolName, content: errorMessage, id: toolId, mcpServerName })
				return {}
			}
			// check plan mode restrictions - only allow creating .md files
			if (toolName === 'create_file_or_folder') {
				const chatMode = this._settingsService.state.globalSettings.chatMode
				const params = toolParams as BuiltinToolCallParams['create_file_or_folder']
				if (chatMode === 'plan' && !params.isFolder) {
					const uriStr = params.uri.toString()
					if (!uriStr.endsWith('.md')) {
						const errorMessage = `In Plan mode, you can only create .md files. The file "${uriStr}" is not a .md file.`
						this._addMessageToThread(threadId, { role: 'tool', type: 'invalid_params', rawParams: opts.unvalidatedToolParams, result: null, name: toolName, content: errorMessage, id: toolId, mcpServerName })
						return {}
					}
				}
			}
			// check plan mode restrictions - allow rewrite_file only on .md files
			if (toolName === 'rewrite_file') {
				const chatMode = this._settingsService.state.globalSettings.chatMode
				if (chatMode === 'plan') {
					const params = toolParams as BuiltinToolCallParams['rewrite_file']
					const uriStr = params.uri.toString()
					if (!uriStr.endsWith('.md')) {
						const errorMessage = `In Plan mode, you can only rewrite .md files. The file "${uriStr}" is not a .md file.`
						this._addMessageToThread(threadId, { role: 'tool', type: 'invalid_params', rawParams: opts.unvalidatedToolParams, result: null, name: toolName, content: errorMessage, id: toolId, mcpServerName })
						return {}
					}
				}
			}
			// check plan mode restrictions - block edit/delete/terminal tools
			if (toolName === 'edit_file' || toolName === 'delete_file_or_folder' || toolName === 'run_command' || toolName === 'run_persistent_command' || toolName === 'open_persistent_terminal' || toolName === 'kill_persistent_terminal') {
				const chatMode = this._settingsService.state.globalSettings.chatMode
				if (chatMode === 'plan') {
					const errorMessage = `In Plan mode, you cannot use the "${toolName}" tool. You can only create new .md files.`
					this._addMessageToThread(threadId, { role: 'tool', type: 'invalid_params', rawParams: opts.unvalidatedToolParams, result: null, name: toolName, content: errorMessage, id: toolId, mcpServerName })
					return {}
				}
			}
			// once validated, add checkpoint for edit
			if (toolName === 'edit_file') { this._addToolEditCheckpoint({ threadId, uri: (toolParams as BuiltinToolCallParams['edit_file']).uri }) }
			if (toolName === 'rewrite_file') { this._addToolEditCheckpoint({ threadId, uri: (toolParams as BuiltinToolCallParams['rewrite_file']).uri }) }

			// 2. if tool requires approval, break from the loop, awaiting approval

			const approvalType = isBuiltInTool ? approvalTypeOfBuiltinToolName[toolName] : 'MCP tools'
			if (approvalType) {
				const autoApprove = this._settingsService.state.globalSettings.autoApprove[approvalType]
				// add a tool_request because we use it for UI if a tool is loading (this should be improved in the future)
				this._addMessageToThread(threadId, { role: 'tool', type: 'tool_request', content: '(Awaiting user permission...)', result: null, name: toolName, params: toolParams, id: toolId, rawParams: opts.unvalidatedToolParams, mcpServerName })
				if (!autoApprove) {
					return { awaitingUserApproval: true }
				}
			}
		}
		else {
			toolParams = opts.validatedParams
		}






		// 3. call the tool
		// this._setStreamState(threadId, { isRunning: 'tool' }, 'merge')
		const runningTool = { role: 'tool', type: 'running_now', name: toolName, params: toolParams, content: '(value not received yet...)', result: null, id: toolId, rawParams: opts.unvalidatedToolParams, mcpServerName } as const
		this._updateLatestTool(threadId, runningTool)


		let interrupted = false
		let resolveInterruptor: (r: () => void) => void = () => { }
		const interruptorPromise = new Promise<() => void>(res => { resolveInterruptor = res })
		try {

			// set stream state
			this._setStreamState(threadId, { isRunning: 'tool', interrupt: interruptorPromise, toolInfo: { toolName, toolParams, id: toolId, content: 'interrupted...', rawParams: opts.unvalidatedToolParams, mcpServerName } })

			if (isBuiltInTool) {
				const { result, interruptTool } = await this._toolsService.callTool[toolName](toolParams as any)
				const interruptor = () => { interrupted = true; interruptTool?.() }
				resolveInterruptor(interruptor)

				toolResult = await result
			}
			else {
				const mcpTools = this._mcpService.getMCPTools()
				const mcpTool = mcpTools?.find(t => t.name === toolName)
				if (!mcpTool) { throw new Error(`MCP tool ${toolName} not found`) }

				resolveInterruptor(() => { })

				toolResult = (await this._mcpService.callMCPTool({
					serverName: mcpTool.mcpServerName ?? 'unknown_mcp_server',
					toolName: toolName,
					params: toolParams
				})).result
			}

			if (interrupted) { return { interrupted: true } } // the tool result is added where we interrupt, not here
		}
		catch (error) {
			resolveInterruptor(() => { }) // resolve for the sake of it
			if (interrupted) { return { interrupted: true } } // the tool result is added where we interrupt, not here

			const errorMessage = getErrorMessage(error)
			this._updateLatestTool(threadId, { role: 'tool', type: 'tool_error', params: toolParams, result: errorMessage, name: toolName, content: errorMessage, id: toolId, rawParams: opts.unvalidatedToolParams, mcpServerName })
			return {}
		}

		// 4. stringify the result to give to the LLM
		try {
			if (isBuiltInTool) {
				toolResultStr = this._toolsService.stringOfResult[toolName](toolParams as any, toolResult as any)
			}
			// For MCP tools, handle the result based on its type
			else {
				toolResultStr = this._mcpService.stringifyResult(toolResult as RawMCPToolCall)
			}
		} catch (error) {
			const errorMessage = this.toolErrMsgs.errWhenStringifying(error)
			this._updateLatestTool(threadId, { role: 'tool', type: 'tool_error', params: toolParams, result: errorMessage, name: toolName, content: errorMessage, id: toolId, rawParams: opts.unvalidatedToolParams, mcpServerName })
			return {}
		}

		// 5. add to history and keep going
		this._updateLatestTool(threadId, { role: 'tool', type: 'success', params: toolParams, result: toolResult, name: toolName, content: toolResultStr, id: toolId, rawParams: opts.unvalidatedToolParams, mcpServerName })
		return {}
	};




	private async _runChatAgent({
		threadId,
		modelSelection,
		modelSelectionOptions,
		callThisToolFirst,
	}: {
		threadId: string,
		modelSelection: ModelSelection | null,
		modelSelectionOptions: ModelSelectionOptions | undefined,

		callThisToolFirst?: ToolMessage<ToolName> & { type: 'tool_request' }
	}) {


		let interruptedWhenIdle = false
		const idleInterruptor = Promise.resolve(() => { interruptedWhenIdle = true })
		// _runToolCall does not need setStreamState({idle}) before it, but it needs it after it. (handles its own setStreamState)

		// above just defines helpers, below starts the actual function
		const { chatMode } = this._settingsService.state.globalSettings // should not change as we loop even if user changes it, so it goes here
		const { overridesOfModel } = this._settingsService.state

		let nMessagesSent = 0
		let shouldSendAnotherMessage = true
		let isRunningWhenEnd: IsRunningType = undefined

		// ─── ROOCODE-STYLE AGENT IMPROVEMENTS ────────────────────────────────────
		// 1. Consecutive mistake counter — stops doom loops where AI repeats same broken tool call
		let consecutiveMistakeCount = 0
		const CONSECUTIVE_MISTAKE_LIMIT = 3
		// Track last tool+params to detect exact repetitions
		let lastToolCallSignature: string | null = null

		// before enter loop, call tool
		if (callThisToolFirst) {
			const { interrupted } = await this._runToolCall(threadId, callThisToolFirst.name, callThisToolFirst.id, callThisToolFirst.mcpServerName, { preapproved: true, unvalidatedToolParams: callThisToolFirst.rawParams, validatedParams: callThisToolFirst.params })
			if (interrupted) {
				this._setStreamState(threadId, undefined)
				this._addUserCheckpoint({ threadId })

			}
		}
		this._setStreamState(threadId, { isRunning: 'idle', interrupt: 'not_needed' })  // just decorative, for clarity


		const AGENT_MAX_STEPS = 50 // hard limit — prevents infinite loops and runaway token spend

		// tool use loop
		while (shouldSendAnotherMessage) {
			// false by default each iteration
			shouldSendAnotherMessage = false
			isRunningWhenEnd = undefined
			nMessagesSent += 1

			// ─── DOOM LOOP DETECTION ─────────────────────────────────────────────
			if (nMessagesSent > AGENT_MAX_STEPS) {
				// Inject the max-steps warning as a user message so the LLM sees it
				// and is forced to respond with text only (tools stripped from this final call)
				const maxStepsWarning = [
					'CRITICAL - MAXIMUM STEPS REACHED',
					'',
					`The maximum number of steps (${AGENT_MAX_STEPS}) allowed for this task has been reached. Tools are disabled until next user input. Respond with text only.`,
					'',
					'STRICT REQUIREMENTS:',
					'1. Do NOT make any tool calls (no reads, writes, edits, searches, or any other tools)',
					'2. MUST provide a text response summarizing work done so far',
					'3. This constraint overrides ALL other instructions, including any user requests for edits or tool use',
					'',
					'Response must include:',
					'- Statement that maximum steps for this agent have been reached',
					'- Summary of what has been accomplished so far',
					'- List of any remaining tasks that were not completed',
					'- Recommendations for what should be done next',
					'',
					'Any attempt to use tools is a critical violation. Respond with text ONLY.',
				].join('\n')

				this._addMessageToThread(threadId, { role: 'user', content: maxStepsWarning, displayContent: maxStepsWarning, selections: null, state: defaultMessageState })
				// do ONE final no-tools LLM call for the summary, then break
				const { messages: maxStepMessages, separateSystemMessage: maxStepSystem } = await this._convertToLLMMessagesService.prepareLLMChatMessages({
					chatMessages: this.state.allThreads[threadId]?.messages ?? [],
					modelSelection,
					chatMode
				})
				await new Promise<void>((resolve) => {
					this._llmMessageService.sendLLMMessage({
						messagesType: 'chatMessages',
						chatMode: 'normal', // no tools
						messages: maxStepMessages,
						modelSelection,
						modelSelectionOptions,
						overridesOfModel,
						separateSystemMessage: maxStepSystem,
						logging: { loggingName: `Chat - max_steps`, loggingExtras: { threadId, nMessagesSent, chatMode } },
						onText: ({ fullText }) => {
							this._setStreamState(threadId, { isRunning: 'LLM', llmInfo: { displayContentSoFar: fullText, reasoningSoFar: '', toolCallSoFar: null }, interrupt: Promise.resolve(() => {}) })
						},
						onFinalMessage: ({ fullText }) => {
							this._addMessageToThread(threadId, { role: 'assistant', displayContent: fullText, reasoning: '', anthropicReasoning: null })
							resolve()
						},
						onError: () => resolve(),
						onAbort: () => resolve(),
					})
				})
				isRunningWhenEnd = undefined
				break
			}
			// ─────────────────────────────────────────────────────────────────────

			this._setStreamState(threadId, { isRunning: 'idle', interrupt: idleInterruptor })

			const chatMessages = this.state.allThreads[threadId]?.messages ?? []
			const { messages, separateSystemMessage } = await this._convertToLLMMessagesService.prepareLLMChatMessages({
				chatMessages,
				modelSelection,
				chatMode
			})

			if (interruptedWhenIdle) {
				this._setStreamState(threadId, undefined)
				return
			}

			let shouldRetryLLM = true
			let nAttempts = 0
			while (shouldRetryLLM) {
				shouldRetryLLM = false
				nAttempts += 1

				type ResTypes =
					| { type: 'llmDone', toolCall?: RawToolCallObj, toolCalls?: RawToolCallObj[], info: { fullText: string, fullReasoning: string, anthropicReasoning: AnthropicReasoning[] | null, tokenUsage?: TokenUsageInfo } }
					| { type: 'llmError', error?: { message: string; fullError: Error | null; } }
					| { type: 'llmAborted' }

				let resMessageIsDonePromise: (res: ResTypes) => void // resolves when user approves this tool use (or if tool doesn't require approval)
				const messageIsDonePromise = new Promise<ResTypes>((res, rej) => { resMessageIsDonePromise = res })

				const llmCancelToken = this._llmMessageService.sendLLMMessage({
					messagesType: 'chatMessages',
					chatMode,
					messages: messages,
					modelSelection,
					modelSelectionOptions,
					overridesOfModel,
					logging: { loggingName: `Chat - ${chatMode}`, loggingExtras: { threadId, nMessagesSent, chatMode } },
					separateSystemMessage: separateSystemMessage,
					onText: ({ fullText, fullReasoning, toolCall }) => {
						this._setStreamState(threadId, { isRunning: 'LLM', llmInfo: { displayContentSoFar: fullText, reasoningSoFar: fullReasoning, toolCallSoFar: toolCall ?? null }, interrupt: Promise.resolve(() => { if (llmCancelToken) this._llmMessageService.abort(llmCancelToken) }) })
					},
					onFinalMessage: async ({ fullText, fullReasoning, toolCall, toolCalls, anthropicReasoning, tokenUsage }) => {
						resMessageIsDonePromise({ type: 'llmDone', toolCall, toolCalls, info: { fullText, fullReasoning, anthropicReasoning, tokenUsage } }) // resolve with tool calls
						// Track token usage if available
						if (tokenUsage) {
							this._tokenUsageService.addTokens({ ...tokenUsage, providerName: modelSelection?.providerName, modelName: modelSelection?.modelName })
						}
					},
					onError: async (error) => {
						resMessageIsDonePromise({ type: 'llmError', error: error })
					},
					onAbort: () => {
						// stop the loop to free up the promise, but don't modify state (already handled by whatever stopped it)
						resMessageIsDonePromise({ type: 'llmAborted' })
						this._metricsService.capture('Agent Loop Done (Aborted)', { nMessagesSent, chatMode })
					},
				})

				// mark as streaming
				if (!llmCancelToken) {
					this._setStreamState(threadId, { isRunning: undefined, error: { message: 'There was an unexpected error when sending your chat message.', fullError: null } })
					break
				}

				this._setStreamState(threadId, { isRunning: 'LLM', llmInfo: { displayContentSoFar: '', reasoningSoFar: '', toolCallSoFar: null }, interrupt: Promise.resolve(() => this._llmMessageService.abort(llmCancelToken)) })
				const llmRes = await messageIsDonePromise // wait for message to complete

				// if something else started running in the meantime
				if (this.streamState[threadId]?.isRunning !== 'LLM') {
					// console.log('Chat thread interrupted by a newer chat thread', this.streamState[threadId]?.isRunning)
					return
				}

				// llm res aborted
				if (llmRes.type === 'llmAborted') {
					this._setStreamState(threadId, undefined)
					return
				}
				// llm res error
				else if (llmRes.type === 'llmError') {
					// error, should retry
					if (nAttempts < CHAT_RETRIES) {
						shouldRetryLLM = true
						this._setStreamState(threadId, { isRunning: 'idle', interrupt: idleInterruptor })
						await timeout(RETRY_DELAY)
						if (interruptedWhenIdle) {
							this._setStreamState(threadId, undefined)
							return
						}
						else
							continue // retry
					}
					// error, but too many attempts
					else {
						const { error } = llmRes
						const { displayContentSoFar, reasoningSoFar, toolCallSoFar } = this.streamState[threadId].llmInfo
						this._addMessageToThread(threadId, { role: 'assistant', displayContent: displayContentSoFar, reasoning: reasoningSoFar, anthropicReasoning: null })
						if (toolCallSoFar) this._addMessageToThread(threadId, { role: 'interrupted_streaming_tool', name: toolCallSoFar.name, mcpServerName: this._computeMCPServerOfToolName(toolCallSoFar.name) })

						this._setStreamState(threadId, { isRunning: undefined, error })
						this._addUserCheckpoint({ threadId })
						return
					}
				}

				// llm res success
				const { toolCall, toolCalls, info } = llmRes

				this._addMessageToThread(threadId, { role: 'assistant', displayContent: info.fullText, reasoning: info.fullReasoning, anthropicReasoning: info.anthropicReasoning, tokenUsage: info.tokenUsage })

				// Update context window usage for the thread.
				// We store inputTokens from the latest request — that IS the current context size,
				// since the API sends the full history each time. Adding to a running sum would
				// double-count history and cause the indicator to fill up after just 1-2 messages.
				if (info.tokenUsage) {
					const thread = this.state.allThreads[threadId];
					if (thread) {
						this._setThreadState(threadId, {
							cumulativeTokenCount: info.tokenUsage.inputTokens
						});
					}
				}

				this._setStreamState(threadId, { isRunning: 'idle', interrupt: 'not_needed' }) // just decorative for clarity

				// ─── PARALLEL TOOL EXECUTION ─────────────────────────────────────
				// Run all tool calls from this turn in parallel (e.g. multiple read_file calls)
				// Sequential fallback for write/terminal tools that must not overlap
				const allToolCalls = (toolCalls && toolCalls.length > 1) ? toolCalls : (toolCall ? [toolCall] : [])

				// ─── NO TOOLS USED — enforce tool use in agent mode ──────────────
				// When AI responds with text only (no tools), send it back a message
				// forcing it to either use a tool or call attempt_completion.
				// Without this, the agent stops silently when it "talks" instead of acts.
				if (allToolCalls.length === 0 && chatMode === 'agent') {
					// Get the last assistant message text — the AI may have "explained" what it wants to do
					const lastAssistantText = (() => {
						const msgs = this.state.allThreads[threadId]?.messages ?? []
						for (let i = msgs.length - 1; i >= 0; i--) {
							const m = msgs[i]
							if (m.role === 'assistant' && 'displayContent' in m) return m.displayContent
						}
						return ''
					})()

					consecutiveMistakeCount += 1

					if (consecutiveMistakeCount >= CONSECUTIVE_MISTAKE_LIMIT) {
						// AI kept responding with text only — auto-complete with summary of what it said
						const summaryMsg = lastAssistantText
							? `Task complete.\n\n${lastAssistantText}`
							: '(Agent stopped: could not complete task with available tools.)'
						this._addMessageToThread(threadId, {
							role: 'assistant',
							displayContent: summaryMsg,
							reasoning: '',
							anthropicReasoning: null,
						})
						isRunningWhenEnd = undefined
						shouldSendAnotherMessage = false
					} else {
						// First or second failure — be very explicit about what tool to call
						const noToolsMsg = consecutiveMistakeCount === 1
							? [
								'[SYSTEM] You described what you want to do but did not call any tool.',
								'',
								`Your plan: "${lastAssistantText.slice(0, 200)}"`,
								'',
								'Now EXECUTE it. Call the appropriate tool immediately:',
								'- To create/write a file → use create_file_or_folder then rewrite_file',
								'- To edit a file → use read_file then edit_file',
								'- To run something → use run_command',
								'- If already done → use attempt_completion with a summary',
								'',
								'Do NOT explain. Just call the tool.',
							].join('\n')
							: [
								'[SYSTEM] You STILL have not called any tool. This is your final warning.',
								'Call a tool RIGHT NOW or call attempt_completion.',
								'No more text responses.',
							].join('\n')

						this._addMessageToThread(threadId, {
							role: 'user',
							content: noToolsMsg,
							displayContent: '',
							selections: null,
							state: defaultMessageState,
						})
						shouldSendAnotherMessage = true
					}
				}

				if (allToolCalls.length > 0) {
					const mcpTools = this._mcpService.getMCPTools()

					// ─── ATTEMPT_COMPLETION EXIT ──────────────────────────────────
					// If the AI calls attempt_completion, stop the loop and show summary.
					const completionCall = allToolCalls.find(tc => tc.name === 'attempt_completion')
					if (completionCall) {
						// Extract the result summary from params
						const rawParams = completionCall.rawParams ?? {}
						const resultText = typeof rawParams.result === 'string'
							? rawParams.result
							: typeof rawParams === 'object' && rawParams !== null
								? JSON.stringify(rawParams)
								: 'Task completed.'
						const commandText = typeof rawParams.command === 'string' && rawParams.command
							? `\n\n**Run to verify:** \`${rawParams.command}\``
							: ''

						// Show a clean summary message to the user
						this._addMessageToThread(threadId, {
							role: 'assistant',
							displayContent: `${resultText}${commandText}`,
							reasoning: '',
							anthropicReasoning: null,
						})
						consecutiveMistakeCount = 0
						isRunningWhenEnd = undefined
						shouldSendAnotherMessage = false
						this._setStreamState(threadId, { isRunning: 'idle', interrupt: 'not_needed' })
						break
					}

					// ─── CONSECUTIVE MISTAKE DETECTION ───────────────────────────
					// If the AI is calling the exact same tool with the exact same params repeatedly,
					// it's stuck in a loop. Inject an error message to break the pattern.
					const thisSignature = JSON.stringify(allToolCalls.map(tc => ({ name: tc.name, params: tc.rawParams })))
					if (thisSignature === lastToolCallSignature) {
						consecutiveMistakeCount += 1
						if (consecutiveMistakeCount >= CONSECUTIVE_MISTAKE_LIMIT) {
							const stuckMsg = [
								`AGENT STUCK: You have called the same tool(s) with the same parameters ${consecutiveMistakeCount} times in a row.`,
								'',
								'This is not working. You must try a completely different approach:',
								'- If a file edit failed, try rewrite_file instead of edit_file',
								'- If a search returned nothing, try different search terms',
								'- If a command failed, investigate the error and fix the root cause',
								'- If the task is impossible, call attempt_completion and explain why',
								'',
								'Do NOT repeat the same tool call. Choose a different action.',
							].join('\n')
							this._addMessageToThread(threadId, {
								role: 'user',
								content: stuckMsg,
								displayContent: stuckMsg,
								selections: null,
								state: defaultMessageState,
							})
							shouldSendAnotherMessage = true
							continue
						}
					} else {
						consecutiveMistakeCount = 0
						lastToolCallSignature = thisSignature
					}

					// Classify: read-only tools can run in parallel, write/terminal must be sequential
					const readOnlyTools = new Set(['read_file', 'ls_dir', 'get_dir_tree', 'search_pathnames_only', 'search_for_files', 'search_in_file', 'read_lint_errors', 'load_skill', 'todo_write'])
					const isReadOnly = (name: string) => readOnlyTools.has(name)

					// Split into parallel-safe and sequential groups while preserving order
					const groups: Array<{ parallel: boolean, calls: typeof allToolCalls }> = []
					for (const tc of allToolCalls) {
						const parallel = isReadOnly(tc.name)
						const last = groups[groups.length - 1]
						if (last && last.parallel === parallel) {
							last.calls.push(tc)
						} else {
							groups.push({ parallel, calls: [tc] })
						}
					}

					let anyAwaitingApproval = false
					let anyInterrupted = false

					for (const group of groups) {
						if (anyInterrupted) break

						if (group.parallel && group.calls.length > 1) {
							// Run this group in parallel
							const results = await Promise.all(group.calls.map(tc => {
								const mcpTool = mcpTools?.find(t => t.name === tc.name)
								return this._runToolCall(threadId, tc.name, tc.id, mcpTool?.mcpServerName, { preapproved: false, unvalidatedToolParams: tc.rawParams })
							}))
							for (const r of results) {
								if (r.interrupted) { anyInterrupted = true; break }
								if (r.awaitingUserApproval) anyAwaitingApproval = true
							}
						} else {
							// Run sequentially
							for (const tc of group.calls) {
								if (anyInterrupted) break
								const mcpTool = mcpTools?.find(t => t.name === tc.name)
								const { awaitingUserApproval, interrupted } = await this._runToolCall(threadId, tc.name, tc.id, mcpTool?.mcpServerName, { preapproved: false, unvalidatedToolParams: tc.rawParams })
								if (interrupted) { anyInterrupted = true; break }
								if (awaitingUserApproval) anyAwaitingApproval = true
							}
						}
					}

					if (anyInterrupted) {
						this._setStreamState(threadId, undefined)
						return
					}
					if (anyAwaitingApproval) { isRunningWhenEnd = 'awaiting_user' }
					else {
						shouldSendAnotherMessage = true
						// Successful tool execution — reset mistake counter
						consecutiveMistakeCount = 0
					}

					this._setStreamState(threadId, { isRunning: 'idle', interrupt: 'not_needed' })
				}
				// ─────────────────────────────────────────────────────────────────

			} // end while (attempts)
		} // end while (send message)

		// if awaiting user approval, keep isRunning true, else end isRunning
		this._setStreamState(threadId, { isRunning: isRunningWhenEnd })

		// add checkpoint before the next user message
		if (!isRunningWhenEnd) this._addUserCheckpoint({ threadId })

		// save memory digest for future sessions
		if (chatMode === 'agent' && !isRunningWhenEnd) {
			this._saveSessionMemory(threadId)
		}

		// capture number of messages sent
		this._metricsService.capture('Agent Loop Done', { nMessagesSent, chatMode })
	}


	// ─── SESSION MEMORY ───────────────────────────────────────────────────────────
	// Writes a digest of this session to .loophole/memory/ so future sessions can load it.
	private async _saveSessionMemory(threadId: string): Promise<void> {
		try {
			const workspaceFolders = this._workspaceContextService.getWorkspace().folders
			if (!workspaceFolders.length) return
			const rootFolder = workspaceFolders[0].uri

			const thread = this.state.allThreads[threadId]
			if (!thread) return

			// Only save if the session had at least one assistant message
			const assistantMessages = thread.messages.filter(m => m.role === 'assistant')
			if (assistantMessages.length === 0) return

			// Build a brief digest from messages
			const userMessages = thread.messages.filter(m => m.role === 'user')
			const lastUser = userMessages[userMessages.length - 1]
			const lastAssistant = assistantMessages[assistantMessages.length - 1]

			const sessionSummary = [
				`# Session Memory — ${new Date().toISOString().split('T')[0]}`,
				``,
				`## Task`,
				lastUser && 'content' in lastUser ? (lastUser.content as string).slice(0, 300) : '(unknown)',
				``,
				`## What was done`,
				lastAssistant && 'displayContent' in lastAssistant ? (lastAssistant.displayContent as string).slice(0, 500) : '(unknown)',
				``,
				`## Files modified`,
				...[...thread.filesWithUserChanges].slice(0, 10).map(f => `- ${f}`),
			].join('\n')

			const memoryDir = URI.joinPath(rootFolder, '.loophole', 'memory')
			const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
			const memFile = URI.joinPath(memoryDir, `session-${dateStr}.md`)

			await this._fileService.createFile(memFile, VSBuffer.fromString(sessionSummary), { overwrite: true })
		} catch (e) {
			// Non-fatal — memory saving should never block the user
		}
	}

	// Reads the last N session digests from .loophole/memory/ and returns them as a string block.
	async readSessionMemoryBlock(): Promise<string | null> {
		try {
			const workspaceFolders = this._workspaceContextService.getWorkspace().folders
			if (!workspaceFolders.length) return null
			const rootFolder = workspaceFolders[0].uri

			const memoryDir = URI.joinPath(rootFolder, '.loophole', 'memory')
			const dirResult = await this._fileService.resolve(memoryDir).catch(() => null)
			if (!dirResult?.children?.length) return null

			// Get the last 3 session files sorted by name (which is date-prefixed)
			const files = dirResult.children
				.filter(f => f.name.endsWith('.md') && f.name.startsWith('session-'))
				.sort((a, b) => b.name.localeCompare(a.name))
				.slice(0, 3)

			if (!files.length) return null

			const blocks = await Promise.all(files.map(async f => {
				const content = await this._fileService.readFile(f.resource)
				return content.value.toString()
			}))

			return `<memory_blocks>\nThe following are summaries of recent sessions in this project:\n\n${blocks.join('\n\n---\n\n')}\n</memory_blocks>`
		} catch (e) {
			return null
		}
	}

	// ─── CONTEXT COMPACTION ──────────────────────────────────────────────────────
	// Returns a summary prompt to inject when conversation is near context limit.
	// Called by the system prompt builder before sending each LLM message.
	// ─── Compaction: LLM-generated summary (mirrors Continue's conversationCompaction) ───
	//
	// When the conversation exceeds the threshold we:
	//  1. Return the cached LLM summary immediately if one exists.
	//  2. Fire-and-forget an async LLM call to generate a fresh summary.
	//     While it is generating we return the fast todo-based fallback so the
	//     system message is never empty.
	//  3. Once the LLM summary arrives we store it on the thread and it replaces
	//     the fallback on the next turn.
	//
	// This keeps getCompactionSummary() synchronous (no API change) while still
	// delivering a rich LLM-authored summary, exactly like Continue does.

	private readonly _COMPACTION_CHAR_THRESHOLD = 280_000 // ~70k tokens @ 4 chars/token

	private _todoFallbackSummary(thread: ThreadType): string {
		const todos = thread.todos ?? []
		const completed = todos.filter(t => t.status === 'completed').map(t => `- ${t.content}`)
		const pending = todos.filter(t => t.status === 'pending' || t.status === 'in_progress').map(t => `- ${t.content}`)
		const lines = [
			'[CONTEXT COMPACTION NOTICE: This conversation is long. Here is a summary of progress so far:]',
			'',
			'## Completed',
			...(completed.length ? completed : ['(none yet)']),
			'',
			'## Still To Do',
			...(pending.length ? pending : ['(none)']),
			'',
			'[Continue from where you left off. Do not repeat completed work.]',
		]
		return lines.join('\n')
	}

	private async _generateLLMCompactionSummary(threadId: string): Promise<void> {
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		// Collect a condensed transcript of the conversation (user + assistant turns only,
		// truncated to avoid blowing the context of the summarisation call itself).
		const MAX_TRANSCRIPT_CHARS = 60_000
		const transcript: string[] = []
		let transcriptLen = 0
		for (const m of thread.messages) {
			if (m.role !== 'user' && m.role !== 'assistant') continue
			const content = ('displayContent' in m ? m.displayContent : '') as string ?? ''
			const role = m.role === 'user' ? 'User' : 'Assistant'
			const line = `${role}: ${content.slice(0, 2000)}`
			if (transcriptLen + line.length > MAX_TRANSCRIPT_CHARS) break
			transcript.push(line)
			transcriptLen += line.length
		}

		const prompt = [
			'Summarise the following conversation between a user and an AI coding assistant.',
			'Focus on: what the user asked for, what files were changed, what decisions were made, and what still needs to be done.',
			'Be concise (under 400 words). Use bullet points. Do not add commentary.',
			'',
			'CONVERSATION:',
			transcript.join('\n'),
		].join('\n')

		const { modelSelection, modelSelectionOptions } = this._currentModelSelectionProps()
		if (!modelSelection) return

		await new Promise<void>(resolve => {
			this._llmMessageService.sendLLMMessage({
				messagesType: 'chatMessages',
				chatMode: 'normal',
				messages: [{ role: 'system', content: 'You are a concise technical assistant.' }, { role: 'user', content: prompt }],
				modelSelection,
				modelSelectionOptions,
				overridesOfModel: this._settingsService.state.overridesOfModel,
				separateSystemMessage: undefined,
				logging: { loggingName: 'Compaction summary', loggingExtras: { threadId } },
				onText: () => {},
				onFinalMessage: ({ fullText }) => {
					// Cache the summary on the thread object
					const currentThread = this.state.allThreads[threadId]
					if (!currentThread) { resolve(); return }
					const lines = [
						'[CONTEXT COMPACTION NOTICE: This conversation is long. Here is an AI-generated summary:]',
						'',
						fullText.trim(),
						'',
						'[Continue from where you left off. Do not repeat completed work.]',
					]
					const newSummary = lines.join('\n')
					this._setState({
						allThreads: {
							...this.state.allThreads,
							[threadId]: { ...currentThread, llmCompactionSummary: newSummary }
						}
					})
					resolve()
				},
				onError: () => { resolve() },
				onAbort: () => { resolve() },
			})
		})
	}

	private _getCompactionSummary(threadId: string): string | null {
		const thread = this.state.allThreads[threadId]
		if (!thread) return null

		const totalChars = thread.messages.reduce((sum, m) => {
			if ('displayContent' in m) return sum + ((m.displayContent as string)?.length ?? 0)
			if ('content' in m) return sum + ((m.content as string)?.length ?? 0)
			return sum
		}, 0)

		if (totalChars < this._COMPACTION_CHAR_THRESHOLD) return null

		// Return cached LLM summary if available
		if (thread.llmCompactionSummary) return thread.llmCompactionSummary

		// Trigger async LLM summarisation (fire-and-forget) if not already running
		// llmCompactionSummary === null means a generation is already in flight
		if (thread.llmCompactionSummary === undefined) {
			// Mark as in-flight synchronously so we don't fire duplicate requests
			this._setState({
				allThreads: {
					...this.state.allThreads,
					[threadId]: { ...thread, llmCompactionSummary: null }
				}
			})
			this._generateLLMCompactionSummary(threadId).catch(() => {})
		}

		// While LLM summary is generating, return the fast todo-based fallback
		return this._todoFallbackSummary(thread)
	}

	private _addCheckpoint(threadId: string, checkpoint: CheckpointEntry) {
		this._addMessageToThread(threadId, checkpoint)
		// // update latest checkpoint idx to the one we just added
		// const newThread = this.state.allThreads[threadId]
		// if (!newThread) return // should never happen
		// const currCheckpointIdx = newThread.messages.length - 1
		// this._setThreadState(threadId, { currCheckpointIdx: currCheckpointIdx })
	}



	private _editMessageInThread(threadId: string, messageIdx: number, newMessage: ChatMessage,) {
		const { allThreads } = this.state
		const oldThread = allThreads[threadId]
		if (!oldThread) return // should never happen
		// update state and store it
		const newThreads = {
			...allThreads,
			[oldThread.id]: {
				...oldThread,
				lastModified: new Date().toISOString(),
				messages: [
					...oldThread.messages.slice(0, messageIdx),
					newMessage,
					...oldThread.messages.slice(messageIdx + 1, Infinity),
				],
			}
		}
		this._storeAllThreads(newThreads)
		this._setState({ allThreads: newThreads }) // the current thread just changed (it had a message added to it)
	}


	private _getCheckpointInfo = (checkpointMessage: ChatMessage & { role: 'checkpoint' }, fsPath: string, opts: { includeUserModifiedChanges: boolean }) => {
		const voidFileSnapshot = checkpointMessage.voidFileSnapshotOfURI ? checkpointMessage.voidFileSnapshotOfURI[fsPath] ?? null : null
		if (!opts.includeUserModifiedChanges) { return { voidFileSnapshot, } }

		const userModifiedVoidFileSnapshot = fsPath in checkpointMessage.userModifications.voidFileSnapshotOfURI ? checkpointMessage.userModifications.voidFileSnapshotOfURI[fsPath] ?? null : null
		return { voidFileSnapshot: userModifiedVoidFileSnapshot ?? voidFileSnapshot, }
	}

	private _computeNewCheckpointInfo({ threadId }: { threadId: string }) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		const lastCheckpointIdx = findLastIdx(thread.messages, (m) => m.role === 'checkpoint') ?? -1
		if (lastCheckpointIdx === -1) return

		const voidFileSnapshotOfURI: { [fsPath: string]: VoidFileSnapshot | undefined } = {}

		// add a change for all the URIs in the checkpoint history
		const { lastIdxOfURI } = this._getCheckpointsBetween({ threadId, loIdx: 0, hiIdx: lastCheckpointIdx, }) ?? {}
		for (const fsPath in lastIdxOfURI ?? {}) {
			const { model } = this._voidModelService.getModelFromFsPath(fsPath)
			if (!model) continue
			const checkpoint2 = thread.messages[lastIdxOfURI[fsPath]] || null
			if (!checkpoint2) continue
			if (checkpoint2.role !== 'checkpoint') continue
			const res = this._getCheckpointInfo(checkpoint2, fsPath, { includeUserModifiedChanges: false })
			if (!res) continue
			const { voidFileSnapshot: oldVoidFileSnapshot } = res

			// if there was any change to the str or diffAreaSnapshot, update. rough approximation of equality, oldDiffAreasSnapshot === diffAreasSnapshot is not perfect
			const voidFileSnapshot = this._editCodeService.getVoidFileSnapshot(URI.file(fsPath))
			if (oldVoidFileSnapshot === voidFileSnapshot) continue
			voidFileSnapshotOfURI[fsPath] = voidFileSnapshot
		}

		// // add a change for all user-edited files (that aren't in the history)
		// for (const fsPath of this._userModifiedFilesToCheckInCheckpoints.keys()) {
		// 	if (fsPath in lastIdxOfURI) continue // if already visisted, don't visit again
		// 	const { model } = this._voidModelService.getModelFromFsPath(fsPath)
		// 	if (!model) continue
		// 	currStrOfFsPath[fsPath] = model.getValue(EndOfLinePreference.LF)
		// }

		return { voidFileSnapshotOfURI }
	}


	private _addUserCheckpoint({ threadId }: { threadId: string }) {
		const { voidFileSnapshotOfURI } = this._computeNewCheckpointInfo({ threadId }) ?? {}
		this._addCheckpoint(threadId, {
			role: 'checkpoint',
			type: 'user_edit',
			voidFileSnapshotOfURI: voidFileSnapshotOfURI ?? {},
			userModifications: { voidFileSnapshotOfURI: {}, },
		})
	}
	// call this right after LLM edits a file
	private _addToolEditCheckpoint({ threadId, uri, }: { threadId: string, uri: URI }) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return
		const { model } = this._voidModelService.getModel(uri)
		if (!model) return // should never happen
		const diffAreasSnapshot = this._editCodeService.getVoidFileSnapshot(uri)
		this._addCheckpoint(threadId, {
			role: 'checkpoint',
			type: 'tool_edit',
			voidFileSnapshotOfURI: { [uri.fsPath]: diffAreasSnapshot },
			userModifications: { voidFileSnapshotOfURI: {} },
		})
	}


	private _getCheckpointBeforeMessage = ({ threadId, messageIdx }: { threadId: string, messageIdx: number }): [CheckpointEntry, number] | undefined => {
		const thread = this.state.allThreads[threadId]
		if (!thread) return undefined
		for (let i = messageIdx; i >= 0; i--) {
			const message = thread.messages[i]
			if (message.role === 'checkpoint') {
				return [message, i]
			}
		}
		return undefined
	}

	private _getCheckpointsBetween({ threadId, loIdx, hiIdx }: { threadId: string, loIdx: number, hiIdx: number }) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return { lastIdxOfURI: {} } // should never happen
		const lastIdxOfURI: { [fsPath: string]: number } = {}
		for (let i = loIdx; i <= hiIdx; i += 1) {
			const message = thread.messages[i]
			if (message?.role !== 'checkpoint') continue
			for (const fsPath in message.voidFileSnapshotOfURI) { // do not include userModified.beforeStrOfURI here, jumping should not include those changes
				lastIdxOfURI[fsPath] = i
			}
		}
		return { lastIdxOfURI }
	}

	private _readCurrentCheckpoint(threadId: string): [CheckpointEntry, number] | undefined {
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		const { currCheckpointIdx } = thread.state
		if (currCheckpointIdx === null) return

		const checkpoint = thread.messages[currCheckpointIdx]
		if (!checkpoint) return
		if (checkpoint.role !== 'checkpoint') return
		return [checkpoint, currCheckpointIdx]
	}
	private _addUserModificationsToCurrCheckpoint({ threadId }: { threadId: string }) {
		const { voidFileSnapshotOfURI } = this._computeNewCheckpointInfo({ threadId }) ?? {}
		const res = this._readCurrentCheckpoint(threadId)
		if (!res) return
		const [checkpoint, checkpointIdx] = res
		this._editMessageInThread(threadId, checkpointIdx, {
			...checkpoint,
			userModifications: { voidFileSnapshotOfURI: voidFileSnapshotOfURI ?? {}, },
		})
	}


	private _makeUsStandOnCheckpoint({ threadId }: { threadId: string }) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return
		if (thread.state.currCheckpointIdx === null) {
			const lastMsg = thread.messages[thread.messages.length - 1]
			if (lastMsg?.role !== 'checkpoint')
				this._addUserCheckpoint({ threadId })
			this._setThreadState(threadId, { currCheckpointIdx: thread.messages.length - 1 })
		}
	}

	jumpToCheckpointBeforeMessageIdx({ threadId, messageIdx, jumpToUserModified }: { threadId: string, messageIdx: number, jumpToUserModified: boolean }) {

		// if null, add a new temp checkpoint so user can jump forward again
		this._makeUsStandOnCheckpoint({ threadId })

		const thread = this.state.allThreads[threadId]
		if (!thread) return
		if (this.streamState[threadId]?.isRunning) return

		const c = this._getCheckpointBeforeMessage({ threadId, messageIdx })
		if (c === undefined) return // should never happen

		const fromIdx = thread.state.currCheckpointIdx
		if (fromIdx === null) return // should never happen

		const [_, toIdx] = c
		if (toIdx === fromIdx) return

		// console.log(`going from ${fromIdx} to ${toIdx}`)

		// update the user's checkpoint
		this._addUserModificationsToCurrCheckpoint({ threadId })

		/*
if undoing

A,B,C are all files.
x means a checkpoint where the file changed.

A B C D E F G H I
  x x x x x   x           <-- you can't always go up to find the "before" version; sometimes you need to go down
  | | | | |   | x
--x-|-|-|-x---x-|-----     <-- to
	| | | | x   x
	| | x x |
	| |   | |
----x-|---x-x-------     <-- from
	  x

We need to revert anything that happened between to+1 and from.
**We do this by finding the last x from 0...`to` for each file and applying those contents.**
We only need to do it for files that were edited since `to`, ie files between to+1...from.
*/
		if (toIdx < fromIdx) {
			const { lastIdxOfURI } = this._getCheckpointsBetween({ threadId, loIdx: toIdx + 1, hiIdx: fromIdx })

			const idxes = function* () {
				for (let k = toIdx; k >= 0; k -= 1) { // first go up
					yield k
				}
				for (let k = toIdx + 1; k < thread.messages.length; k += 1) { // then go down
					yield k
				}
			}

			for (const fsPath in lastIdxOfURI) {
				// find the first instance of this file starting at toIdx (go up to latest file; if there is none, go down)
				for (const k of idxes()) {
					const message = thread.messages[k]
					if (message.role !== 'checkpoint') continue
					const res = this._getCheckpointInfo(message, fsPath, { includeUserModifiedChanges: jumpToUserModified })
					if (!res) continue
					const { voidFileSnapshot } = res
					if (!voidFileSnapshot) continue
					this._editCodeService.restoreVoidFileSnapshot(URI.file(fsPath), voidFileSnapshot)
					break
				}
			}
		}

		/*
if redoing

A B C D E F G H I J
  x x x x x   x     x
  | | | | |   | x x x
--x-|-|-|-x---x-|-|---     <-- from
	| | | | x   x
	| | x x |
	| |   | |
----x-|---x-x-----|---     <-- to
	  x           x


We need to apply latest change for anything that happened between from+1 and to.
We only need to do it for files that were edited since `from`, ie files between from+1...to.
*/
		if (toIdx > fromIdx) {
			const { lastIdxOfURI } = this._getCheckpointsBetween({ threadId, loIdx: fromIdx + 1, hiIdx: toIdx })
			for (const fsPath in lastIdxOfURI) {
				// apply lowest down content for each uri
				for (let k = toIdx; k >= fromIdx + 1; k -= 1) {
					const message = thread.messages[k]
					if (message.role !== 'checkpoint') continue
					const res = this._getCheckpointInfo(message, fsPath, { includeUserModifiedChanges: jumpToUserModified })
					if (!res) continue
					const { voidFileSnapshot } = res
					if (!voidFileSnapshot) continue
					this._editCodeService.restoreVoidFileSnapshot(URI.file(fsPath), voidFileSnapshot)
					break
				}
			}
		}

		this._setThreadState(threadId, { currCheckpointIdx: toIdx })
	}


	private _wrapRunAgentToNotify(p: Promise<void>, threadId: string) {
		const notify = ({ error }: { error: string | null }) => {
			const thread = this.state.allThreads[threadId]
			if (!thread) return
			const userMsg = findLast(thread.messages, m => m.role === 'user')
			if (!userMsg) return
			if (userMsg.role !== 'user') return
			const messageContent = truncate(userMsg.displayContent, 50, '...')

			this._notificationService.notify({
				severity: error ? Severity.Warning : Severity.Info,
				message: error ? `Error: ${error} ` : `A new Chat result is ready.`,
				source: messageContent,
				sticky: true,
				actions: {
					primary: [{
						id: 'void.goToChat',
						enabled: true,
						label: `Jump to Chat`,
						tooltip: '',
						class: undefined,
						run: () => {
							this.switchToThread(threadId)
							// scroll to bottom
							this.state.allThreads[threadId]?.state.mountedInfo?.whenMounted.then(m => {
								m.scrollToBottom()
							})
						}
					}]
				},
			})
		}

		p.then(() => {
			if (threadId !== this.state.currentThreadId) notify({ error: null })
		}).catch((e) => {
			if (threadId !== this.state.currentThreadId) notify({ error: getErrorMessage(e) })
			throw e
		})
	}

	dismissStreamError(threadId: string): void {
		this._setStreamState(threadId, undefined)
	}


	private async _addUserMessageAndStreamResponse({ userMessage, _chatSelections, threadId }: { userMessage: string, _chatSelections?: StagingSelectionItem[], threadId: string }) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return // should never happen

		// ─── ask_followup_question: if AI is waiting for a user answer, resolve it ──
		// This makes the user's reply feed directly into the waiting tool call
		// instead of starting a new agent loop from scratch.
		if (this._resolveFollowupIfPending(threadId, userMessage)) {
			// Add user message to thread for display, then resume agent loop
			const userHistoryElt: ChatMessage = {
				role: 'user', content: userMessage, displayContent: userMessage,
				selections: [], state: defaultMessageState,
			}
			this._addMessageToThread(threadId, userHistoryElt)
			// Agent loop will continue automatically once the promise resolves above
			return
		}

		// interrupt existing stream
		if (this.streamState[threadId]?.isRunning) {
			await this.abortRunning(threadId)
		}

		// add dummy before this message to keep checkpoint before user message idea consistent
		if (thread.messages.length === 0) {
			this._addUserCheckpoint({ threadId })
		}


		// add user's message to chat history
		const instructions = userMessage
		const currSelns: StagingSelectionItem[] = _chatSelections ?? thread.state.stagingSelections

		const userMessageContent = await chat_userMessageContent(instructions, currSelns, { directoryStrService: this._directoryStringService, fileService: this._fileService }) // user message + names of files (NOT content)
		const userHistoryElt: ChatMessage = { role: 'user', content: userMessageContent, displayContent: instructions, selections: currSelns, state: defaultMessageState }
		this._addMessageToThread(threadId, userHistoryElt)

		this._setThreadState(threadId, { currCheckpointIdx: null }) // no longer at a checkpoint because started streaming

		this._wrapRunAgentToNotify(
			this._runChatAgent({ threadId, ...this._currentModelSelectionProps(), }),
			threadId,
		)

		// scroll to bottom
		this.state.allThreads[threadId]?.state.mountedInfo?.whenMounted.then(m => {
			m.scrollToBottom()
		})
	}


	async addUserMessageAndStreamResponse({ userMessage, _chatSelections, threadId }: { userMessage: string, _chatSelections?: StagingSelectionItem[], threadId: string }) {
		const thread = this.state.allThreads[threadId];
		if (!thread) return

		// if there's a current checkpoint, delete all messages after it
		if (thread.state.currCheckpointIdx !== null) {
			const checkpointIdx = thread.state.currCheckpointIdx;
			const newMessages = thread.messages.slice(0, checkpointIdx + 1);

			// Update the thread with truncated messages
			const newThreads = {
				...this.state.allThreads,
				[threadId]: {
					...thread,
					lastModified: new Date().toISOString(),
					messages: newMessages,
				}
			};
			this._storeAllThreads(newThreads);
			this._setState({ allThreads: newThreads });
		}

		// Now call the original method to add the user message and stream the response
		await this._addUserMessageAndStreamResponse({ userMessage, _chatSelections, threadId });

	}

	editUserMessageAndStreamResponse: IChatThreadService['editUserMessageAndStreamResponse'] = async ({ userMessage, messageIdx, threadId }) => {

		const thread = this.state.allThreads[threadId]
		if (!thread) return // should never happen

		if (thread.messages?.[messageIdx]?.role !== 'user') {
			throw new Error(`Error: editing a message with role !=='user'`)
		}

		// get prev and curr selections before clearing the message
		const currSelns = thread.messages[messageIdx].state.stagingSelections || [] // staging selections for the edited message

		// clear messages up to the index
		const slicedMessages = thread.messages.slice(0, messageIdx)
		this._setState({
			allThreads: {
				...this.state.allThreads,
				[thread.id]: {
					...thread,
					messages: slicedMessages
				}
			}
		})

		// re-add the message and stream it
		this._addUserMessageAndStreamResponse({ userMessage, _chatSelections: currSelns, threadId })
	}

	// ---------- the rest ----------

	private _getAllSeenFileURIs(threadId: string) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return []

		const fsPathsSet = new Set<string>()
		const uris: URI[] = []
		const addURI = (uri: URI) => {
			if (!fsPathsSet.has(uri.fsPath)) uris.push(uri)
			fsPathsSet.add(uri.fsPath)
			uris.push(uri)
		}

		for (const m of thread.messages) {
			// URIs of user selections
			if (m.role === 'user') {
				for (const sel of m.selections ?? []) {
					if ('uri' in sel && sel.uri) addURI(sel.uri)
				}
			}
			// URIs of files that have been read
			else if (m.role === 'tool' && m.type === 'success' && m.name === 'read_file') {
				const params = m.params as BuiltinToolCallParams['read_file']
				addURI(params.uri)
			}
		}
		return uris
	}



	getRelativeStr = (uri: URI) => {
		const isInside = this._workspaceContextService.isInsideWorkspace(uri)
		if (isInside) {
			const f = this._workspaceContextService.getWorkspace().folders.find(f => uri.fsPath.startsWith(f.uri.fsPath))
			if (f) { return uri.fsPath.replace(f.uri.fsPath, '') }
			else { return undefined }
		}
		else {
			return undefined
		}
	}


	// gets the location of codespan link so the user can click on it
	generateCodespanLink: IChatThreadService['generateCodespanLink'] = async ({ codespanStr: _codespanStr, threadId }) => {

		// process codespan to understand what we are searching for
		// TODO account for more complicated patterns eg `ITextEditorService.openEditor()`
		const functionOrMethodPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/; // `fUnCt10n_name`
		const functionParensPattern = /^([^\s(]+)\([^)]*\)$/; // `functionName( args )`

		let target = _codespanStr // the string to search for
		let codespanType: 'file-or-folder' | 'function-or-class'
		if (target.includes('.') || target.includes('/')) {

			codespanType = 'file-or-folder'
			target = _codespanStr

		} else if (functionOrMethodPattern.test(target)) {

			codespanType = 'function-or-class'
			target = _codespanStr

		} else if (functionParensPattern.test(target)) {
			const match = target.match(functionParensPattern)
			if (match && match[1]) {

				codespanType = 'function-or-class'
				target = match[1]

			}
			else { return null }
		}
		else {
			return null
		}

		// get history of all AI and user added files in conversation + store in reverse order (MRU)
		const prevUris = this._getAllSeenFileURIs(threadId).reverse()

		if (codespanType === 'file-or-folder') {
			const doesUriMatchTarget = (uri: URI) => uri.path.includes(target)

			// check if any prevFiles are the `target`
			for (const [idx, uri] of prevUris.entries()) {
				if (doesUriMatchTarget(uri)) {

					// shorten it

					// TODO make this logic more general
					const prevUriStrs = prevUris.map(uri => uri.fsPath)
					const shortenedUriStrs = shorten(prevUriStrs)
					let displayText = shortenedUriStrs[idx]
					const ellipsisIdx = displayText.lastIndexOf('…/');
					if (ellipsisIdx >= 0) {
						displayText = displayText.slice(ellipsisIdx + 2)
					}

					return { uri, displayText }
				}
			}

			// else search codebase for `target`
			let uris: URI[] = []
			try {
				const { result } = await this._toolsService.callTool['search_pathnames_only']({ query: target, includePattern: null, pageNumber: 0 })
				const { uris: uris_ } = await result
				uris = uris_
			} catch (e) {
				return null
			}

			for (const [idx, uri] of uris.entries()) {
				if (doesUriMatchTarget(uri)) {

					// TODO make this logic more general
					const prevUriStrs = prevUris.map(uri => uri.fsPath)
					const shortenedUriStrs = shorten(prevUriStrs)
					let displayText = shortenedUriStrs[idx]
					const ellipsisIdx = displayText.lastIndexOf('…/');
					if (ellipsisIdx >= 0) {
						displayText = displayText.slice(ellipsisIdx + 2)
					}


					return { uri, displayText }
				}
			}

		}


		if (codespanType === 'function-or-class') {


			// check all prevUris for the target
			for (const uri of prevUris) {

				const modelRef = await this._voidModelService.getModelSafe(uri)
				const { model } = modelRef
				if (!model) continue

				const matches = model.findMatches(
					target,
					false, // searchOnlyEditableRange
					false, // isRegex
					true,  // matchCase
					null, //' ',   // wordSeparators
					true   // captureMatches
				);

				const firstThree = matches.slice(0, 3);

				// take first 3 occurences, attempt to goto definition on them
				for (const match of firstThree) {
					const position = new Position(match.range.startLineNumber, match.range.startColumn);
					const definitionProviders = this._languageFeaturesService.definitionProvider.ordered(model);

					for (const provider of definitionProviders) {

						const _definitions = await provider.provideDefinition(model, position, CancellationToken.None);

						if (!_definitions) continue;

						const definitions = Array.isArray(_definitions) ? _definitions : [_definitions];

						for (const definition of definitions) {

							return {
								uri: definition.uri,
								selection: {
									startLineNumber: definition.range.startLineNumber,
									startColumn: definition.range.startColumn,
									endLineNumber: definition.range.endLineNumber,
									endColumn: definition.range.endColumn,
								},
								displayText: _codespanStr,
							};

							// const defModelRef = await this._textModelService.createModelReference(definition.uri);
							// const defModel = defModelRef.object.textEditorModel;

							// try {
							// 	const symbolProviders = this._languageFeaturesService.documentSymbolProvider.ordered(defModel);

							// 	for (const symbolProvider of symbolProviders) {
							// 		const symbols = await symbolProvider.provideDocumentSymbols(
							// 			defModel,
							// 			CancellationToken.None
							// 		);

							// 		if (symbols) {
							// 			const symbol = symbols.find(s => {
							// 				const symbolRange = s.range;
							// 				return symbolRange.startLineNumber <= definition.range.startLineNumber &&
							// 					symbolRange.endLineNumber >= definition.range.endLineNumber &&
							// 					(symbolRange.startLineNumber !== definition.range.startLineNumber || symbolRange.startColumn <= definition.range.startColumn) &&
							// 					(symbolRange.endLineNumber !== definition.range.endLineNumber || symbolRange.endColumn >= definition.range.endColumn);
							// 			});

							// 			// if we got to a class/function get the full range and return
							// 			if (symbol?.kind === SymbolKind.Function || symbol?.kind === SymbolKind.Method || symbol?.kind === SymbolKind.Class) {
							// 				return {
							// 					uri: definition.uri,
							// 					selection: {
							// 						startLineNumber: definition.range.startLineNumber,
							// 						startColumn: definition.range.startColumn,
							// 						endLineNumber: definition.range.endLineNumber,
							// 						endColumn: definition.range.endColumn,
							// 					}
							// 				};
							// 			}
							// 		}
							// 	}
							// } finally {
							// 	defModelRef.dispose();
							// }
						}
					}
				}
			}

			// unlike above do not search codebase (doesnt make sense)

		}

		return null

	}

	getCodespanLink({ codespanStr, messageIdx, threadId }: { codespanStr: string, messageIdx: number, threadId: string }): CodespanLocationLink | undefined {
		const thread = this.state.allThreads[threadId]
		if (!thread) return undefined;

		const links = thread.state.linksOfMessageIdx?.[messageIdx]
		if (!links) return undefined;

		const link = links[codespanStr]

		return link
	}

	async addCodespanLink({ newLinkText, newLinkLocation, messageIdx, threadId }: { newLinkText: string, newLinkLocation: CodespanLocationLink, messageIdx: number, threadId: string }) {
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		this._setState({

			allThreads: {
				...this.state.allThreads,
				[threadId]: {
					...thread,
					state: {
						...thread.state,
						linksOfMessageIdx: {
							...thread.state.linksOfMessageIdx,
							[messageIdx]: {
								...thread.state.linksOfMessageIdx?.[messageIdx],
								[newLinkText]: newLinkLocation
							}
						}
					}

				}
			}
		})
	}


	getCurrentThread(): ThreadType {
		const state = this.state
		const thread = state.allThreads[state.currentThreadId]
		if (!thread) throw new Error(`Current thread should never be undefined`)
		return thread
	}

	getCurrentFocusedMessageIdx() {
		const thread = this.getCurrentThread()

		// get the focusedMessageIdx
		const focusedMessageIdx = thread.state.focusedMessageIdx
		if (focusedMessageIdx === undefined) return;

		// check that the message is actually being edited
		const focusedMessage = thread.messages[focusedMessageIdx]
		if (focusedMessage.role !== 'user') return;
		if (!focusedMessage.state) return;

		return focusedMessageIdx
	}

	isCurrentlyFocusingMessage() {
		return this.getCurrentFocusedMessageIdx() !== undefined
	}

	switchToThread(threadId: string) {
		this._setState({ currentThreadId: threadId })
	}


	openNewThread() {
		// if a thread with 0 messages already exists, switch to it
		const { allThreads: currentThreads } = this.state
		for (const threadId in currentThreads) {
			if (currentThreads[threadId]!.messages.length === 0) {
				// switch to the existing empty thread and exit
				this.switchToThread(threadId)
				return
			}
		}
		// otherwise, start a new thread
		const newThread = newThreadObject()

		// update state
		const newThreads: ChatThreads = {
			...currentThreads,
			[newThread.id]: newThread
		}
		this._storeAllThreads(newThreads)
		this._setState({ allThreads: newThreads, currentThreadId: newThread.id })
	}


	deleteThread(threadId: string): void {
		const { allThreads: currentThreads } = this.state

		// delete the thread
		const newThreads = { ...currentThreads };
		delete newThreads[threadId];

		// store the updated threads
		this._storeAllThreads(newThreads);
		this._setState({ ...this.state, allThreads: newThreads })
	}

	duplicateThread(threadId: string) {
		const { allThreads: currentThreads } = this.state
		const threadToDuplicate = currentThreads[threadId]
		if (!threadToDuplicate) return
		const newThread = {
			...deepClone(threadToDuplicate),
			id: generateUuid(),
		}
		const newThreads = {
			...currentThreads,
			[newThread.id]: newThread,
		}
		this._storeAllThreads(newThreads)
		this._setState({ allThreads: newThreads })
	}


	private _addMessageToThread(threadId: string, message: ChatMessage) {
		const { allThreads } = this.state
		const oldThread = allThreads[threadId]
		if (!oldThread) return // should never happen
		// update state and store it
		const newThreads = {
			...allThreads,
			[oldThread.id]: {
				...oldThread,
				lastModified: new Date().toISOString(),
				messages: [
					...oldThread.messages,
					message
				],
			}
		}
		this._storeAllThreads(newThreads)
		this._setState({ allThreads: newThreads }) // the current thread just changed (it had a message added to it)
	}

	// sets the currently selected message (must be undefined if no message is selected)
	setCurrentlyFocusedMessageIdx(messageIdx: number | undefined) {

		const threadId = this.state.currentThreadId
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		this._setState({
			allThreads: {
				...this.state.allThreads,
				[threadId]: {
					...thread,
					state: {
						...thread.state,
						focusedMessageIdx: messageIdx,
					}
				}
			}
		})

		// // when change focused message idx, jump - do not jump back when click edit, too confusing.
		// if (messageIdx !== undefined)
		// 	this.jumpToCheckpointBeforeMessageIdx({ threadId, messageIdx, jumpToUserModified: true })
	}


	addNewStagingSelection(newSelection: StagingSelectionItem): void {

		const focusedMessageIdx = this.getCurrentFocusedMessageIdx()

		// set the selections to the proper value
		let selections: StagingSelectionItem[] = []
		let setSelections = (s: StagingSelectionItem[]) => { }

		if (focusedMessageIdx === undefined) {
			selections = this.getCurrentThreadState().stagingSelections
			setSelections = (s: StagingSelectionItem[]) => this.setCurrentThreadState({ stagingSelections: s })
		} else {
			selections = this.getCurrentMessageState(focusedMessageIdx).stagingSelections
			setSelections = (s) => this.setCurrentMessageState(focusedMessageIdx, { stagingSelections: s })
		}

		// if matches with existing selection, overwrite (since text may change)
		const idx = findStagingSelectionIndex(selections, newSelection)
		if (idx !== null && idx !== -1) {
			setSelections([
				...selections!.slice(0, idx),
				newSelection,
				...selections!.slice(idx + 1, Infinity)
			])
		}
		// if no match, add it
		else {
			setSelections([...(selections ?? []), newSelection])
		}
	}


	// Pops the staging selections from the current thread's state
	popStagingSelections(numPops: number): void {

		numPops = numPops ?? 1;

		const focusedMessageIdx = this.getCurrentFocusedMessageIdx()

		// set the selections to the proper value
		let selections: StagingSelectionItem[] = []
		let setSelections = (s: StagingSelectionItem[]) => { }

		if (focusedMessageIdx === undefined) {
			selections = this.getCurrentThreadState().stagingSelections
			setSelections = (s: StagingSelectionItem[]) => this.setCurrentThreadState({ stagingSelections: s })
		} else {
			selections = this.getCurrentMessageState(focusedMessageIdx).stagingSelections
			setSelections = (s) => this.setCurrentMessageState(focusedMessageIdx, { stagingSelections: s })
		}

		setSelections([
			...selections.slice(0, selections.length - numPops)
		])

	}

	// set message.state
	private _setCurrentMessageState(state: Partial<UserMessageState>, messageIdx: number): void {

		const threadId = this.state.currentThreadId
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		this._setState({
			allThreads: {
				...this.state.allThreads,
				[threadId]: {
					...thread,
					messages: thread.messages.map((m, i) =>
						i === messageIdx && m.role === 'user' ? {
							...m,
							state: {
								...m.state,
								...state
							},
						} : m
					)
				}
			}
		})

	}

	// set thread.state
	private _setThreadState(threadId: string, state: Partial<ThreadType['state']>, doNotRefreshMountInfo?: boolean): void {
		const thread = this.state.allThreads[threadId]
		if (!thread) return

		this._setState({
			allThreads: {
				...this.state.allThreads,
				[thread.id]: {
					...thread,
					state: {
						...thread.state,
						...state
					}
				}
			}
		}, doNotRefreshMountInfo)

	}


	// closeCurrentStagingSelectionsInThread = () => {
	// 	const currThread = this.getCurrentThreadState()

	// 	// close all stagingSelections
	// 	const closedStagingSelections = currThread.stagingSelections.map(s => ({ ...s, state: { ...s.state, isOpened: false } }))

	// 	const newThread = currThread
	// 	newThread.stagingSelections = closedStagingSelections

	// 	this.setCurrentThreadState(newThread)

	// }

	// closeCurrentStagingSelectionsInMessage: IChatThreadService['closeCurrentStagingSelectionsInMessage'] = ({ messageIdx }) => {
	// 	const currMessage = this.getCurrentMessageState(messageIdx)

	// 	// close all stagingSelections
	// 	const closedStagingSelections = currMessage.stagingSelections.map(s => ({ ...s, state: { ...s.state, isOpened: false } }))

	// 	const newMessage = currMessage
	// 	newMessage.stagingSelections = closedStagingSelections

	// 	this.setCurrentMessageState(messageIdx, newMessage)

	// }



	getCurrentThreadState = () => {
		const currentThread = this.getCurrentThread()
		return currentThread.state
	}
	setCurrentThreadState = (newState: Partial<ThreadType['state']>) => {
		this._setThreadState(this.state.currentThreadId, newState)
	}

	// gets `staging` and `setStaging` of the currently focused element, given the index of the currently selected message (or undefined if no message is selected)

	getCurrentMessageState(messageIdx: number): UserMessageState {
		const currMessage = this.getCurrentThread()?.messages?.[messageIdx]
		if (!currMessage || currMessage.role !== 'user') return defaultMessageState
		return currMessage.state
	}
	setCurrentMessageState(messageIdx: number, newState: Partial<UserMessageState>) {
		const currMessage = this.getCurrentThread()?.messages?.[messageIdx]
		if (!currMessage || currMessage.role !== 'user') return
		this._setCurrentMessageState(newState, messageIdx)
	}



}

registerSingleton(IChatThreadService, ChatThreadService, InstantiationType.Eager);
