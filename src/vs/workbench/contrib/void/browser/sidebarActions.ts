/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';


import { Action2, MenuId, MenuRegistry, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';

import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';

import { ICodeEditorService } from '../../../../editor/browser/services/codeEditorService.js';
import { IRange } from '../../../../editor/common/core/range.js';
import { LOOPHOLE_VIEW_CONTAINER_ID, LOOPHOLE_VIEW_ID } from './sidebarPane.js';
import { IMetricsService } from '../common/metricsService.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { LOOPHOLE_TOGGLE_SETTINGS_ACTION_ID } from './voidSettingsPane.js';
import { LOOPHOLE_CTRL_L_ACTION_ID } from './actionIDs.js';
import { localize, localize2 } from '../../../../nls.js';
import { IChatThreadService } from './chatThreadService.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { ITokenUsageService } from '../common/tokenUsageService.js';
import { IQuickInputService, IQuickPickItem } from '../../../../platform/quickinput/common/quickInput.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { Codicon } from '../../../../base/common/codicons.js';

// Register Loophole sidebar icon - using custom CSS class for image-based icon
const loopholeSidebarIcon = registerIcon('loophole-sidebar-toggle', Codicon.symbolMethod, localize('loopholeSidebarToggle', "Toggle Loophole AI Sidebar"));
// CSS class for custom icon: .loophole-custom-icon (defined in titlebarpart.css)

// ---------- Toggle Sidebar Action ----------

export const TOGGLE_LOOPHOLE_SIDEBAR_ACTION_ID = 'loophole.sidebar.toggle';

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: TOGGLE_LOOPHOLE_SIDEBAR_ACTION_ID,
			title: localize2('toggleLoopholeSidebar', 'Toggle Loophole AI Sidebar'),
			icon: loopholeSidebarIcon,
			category: { value: localize('loopholeCategory', 'Loophole'), original: 'Loophole' },
			f1: true,
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewsService = accessor.get(IViewsService);
		const isVisible = viewsService.isViewContainerVisible(LOOPHOLE_VIEW_CONTAINER_ID);

		if (isVisible) {
			viewsService.closeViewContainer(LOOPHOLE_VIEW_CONTAINER_ID);
		} else {
			viewsService.openViewContainer(LOOPHOLE_VIEW_CONTAINER_ID);
		}
	}
});

// Add toggle button to Command Center (right side of search box)
MenuRegistry.appendMenuItem(MenuId.CommandCenter, {
	command: {
		id: TOGGLE_LOOPHOLE_SIDEBAR_ACTION_ID,
		title: localize('toggleLoopholeSidebar', 'Toggle Loophole AI Sidebar'),
		icon: loopholeSidebarIcon,
	},
	order: 102,
	group: 'navigation',
});

// ---------- Register commands and keybindings ----------


export const roundRangeToLines = (range: IRange | null | undefined, options: { emptySelectionBehavior: 'null' | 'line' }) => {
	if (!range)
		return null

	// treat as no selection if selection is empty
	if (range.endColumn === range.startColumn && range.endLineNumber === range.startLineNumber) {
		if (options.emptySelectionBehavior === 'null')
			return null
		else if (options.emptySelectionBehavior === 'line')
			return { startLineNumber: range.startLineNumber, startColumn: 1, endLineNumber: range.startLineNumber, endColumn: 1 }
	}

	// IRange is 1-indexed
	const endLine = range.endColumn === 1 ? range.endLineNumber - 1 : range.endLineNumber // e.g. if the user triple clicks, it selects column=0, line=line -> column=0, line=line+1
	const newRange: IRange = {
		startLineNumber: range.startLineNumber,
		startColumn: 1,
		endLineNumber: endLine,
		endColumn: Number.MAX_SAFE_INTEGER
	}
	return newRange
}

// const getContentInRange = (model: ITextModel, range: IRange | null) => {
// 	if (!range)
// 		return null
// 	const content = model.getValueInRange(range)
// 	const trimmedContent = content
// 		.replace(/^\s*\n/g, '') // trim pure whitespace lines from start
// 		.replace(/\n\s*$/g, '') // trim pure whitespace lines from end
// 	return trimmedContent
// }



const LOOPHOLE_OPEN_SIDEBAR_ACTION_ID = 'loophole.sidebar.open'
registerAction2(class extends Action2 {
	constructor() {
		super({ id: LOOPHOLE_OPEN_SIDEBAR_ACTION_ID, title: localize2('loopholeOpenSidebar', 'Loophole: Open Sidebar'), f1: true });
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const viewsService = accessor.get(IViewsService)
		const chatThreadsService = accessor.get(IChatThreadService)
		viewsService.openViewContainer(LOOPHOLE_VIEW_CONTAINER_ID)
		await chatThreadsService.focusCurrentChat()
	}
})


// cmd L
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: LOOPHOLE_CTRL_L_ACTION_ID,
			f1: true,
			title: localize2('loopholeCmdL', 'Loophole: Add Selection to Chat'),
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyCode.KeyL,
				weight: KeybindingWeight.LoopholeExtension
			}
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		// Get services
		const commandService = accessor.get(ICommandService)
		const viewsService = accessor.get(IViewsService)
		const metricsService = accessor.get(IMetricsService)
		const editorService = accessor.get(ICodeEditorService)
		const chatThreadService = accessor.get(IChatThreadService)

		metricsService.capture('Ctrl+L', {})

		// capture selection and model before opening the chat panel
		const editor = editorService.getActiveCodeEditor()
		const model = editor?.getModel()
		if (!model) return

		const selectionRange = roundRangeToLines(editor?.getSelection(), { emptySelectionBehavior: 'null' })

		// open panel
		const wasAlreadyOpen = viewsService.isViewContainerVisible(LOOPHOLE_VIEW_CONTAINER_ID)
		if (!wasAlreadyOpen) {
			await commandService.executeCommand(LOOPHOLE_OPEN_SIDEBAR_ACTION_ID)
		}

		// Add selection to chat
		// add line selection
		if (selectionRange) {
			editor?.setSelection({
				startLineNumber: selectionRange.startLineNumber,
				endLineNumber: selectionRange.endLineNumber,
				startColumn: 1,
				endColumn: Number.MAX_SAFE_INTEGER
			})
			chatThreadService.addNewStagingSelection({
				type: 'CodeSelection',
				uri: model.uri,
				language: model.getLanguageId(),
				range: [selectionRange.startLineNumber, selectionRange.endLineNumber],
				state: { wasAddedAsCurrentFile: false },
			})
		}
		// add file
		else {
			chatThreadService.addNewStagingSelection({
				type: 'File',
				uri: model.uri,
				language: model.getLanguageId(),
				state: { wasAddedAsCurrentFile: false },
			})
		}

		await chatThreadService.focusCurrentChat()
	}
})


// New chat keybind + menu button
const LOOPHOLE_CMD_SHIFT_L_ACTION_ID = 'loophole.cmdShiftL'
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: LOOPHOLE_CMD_SHIFT_L_ACTION_ID,
			title: 'New Chat',
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyL,
				weight: KeybindingWeight.LoopholeExtension,
			},
			icon: { id: 'add' },
			menu: [{ id: MenuId.ViewTitle, group: 'navigation', when: ContextKeyExpr.equals('view', LOOPHOLE_VIEW_ID), }],
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {

		const metricsService = accessor.get(IMetricsService)
		const chatThreadsService = accessor.get(IChatThreadService)
		const editorService = accessor.get(ICodeEditorService)
		metricsService.capture('Chat Navigation', { type: 'Start New Chat' })

		// get current selections and value to transfer
		const oldThreadId = chatThreadsService.state.currentThreadId
		const oldThread = chatThreadsService.state.allThreads[oldThreadId]

		const oldUI = await oldThread?.state.mountedInfo?.whenMounted

		const oldSelns = oldThread?.state.stagingSelections
		const oldVal = oldUI?.textAreaRef?.current?.value

		// open and focus new thread
		chatThreadsService.openNewThread()
		await chatThreadsService.focusCurrentChat()


		// set new thread values
		const newThreadId = chatThreadsService.state.currentThreadId
		const newThread = chatThreadsService.state.allThreads[newThreadId]

		const newUI = await newThread?.state.mountedInfo?.whenMounted
		chatThreadsService.setCurrentThreadState({ stagingSelections: oldSelns, })
		if (newUI?.textAreaRef?.current && oldVal) newUI.textAreaRef.current.value = oldVal


		// if has selection, add it
		const editor = editorService.getActiveCodeEditor()
		const model = editor?.getModel()
		if (!model) return
		const selectionRange = roundRangeToLines(editor?.getSelection(), { emptySelectionBehavior: 'null' })
		if (!selectionRange) return
		editor?.setSelection({ startLineNumber: selectionRange.startLineNumber, endLineNumber: selectionRange.endLineNumber, startColumn: 1, endColumn: Number.MAX_SAFE_INTEGER })
		chatThreadsService.addNewStagingSelection({
			type: 'CodeSelection',
			uri: model.uri,
			language: model.getLanguageId(),
			range: [selectionRange.startLineNumber, selectionRange.endLineNumber],
			state: { wasAddedAsCurrentFile: false },
		})
	}
})

// History menu button
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'loophole.historyAction',
			title: 'View Past Chats',
			icon: { id: 'history' },
			menu: [{ id: MenuId.ViewTitle, group: 'navigation', when: ContextKeyExpr.equals('view', LOOPHOLE_VIEW_ID), }]
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {

		const chatThreadsService = accessor.get(IChatThreadService)
		const quickInputService = accessor.get(IQuickInputService)
		const metricsService = accessor.get(IMetricsService)

		metricsService.capture('Chat Navigation', { type: 'History' })

		const { allThreads } = chatThreadsService.state

		// Build quick pick items from all threads (sorted by most recent, excluding empty threads)
		const sortedThreadIds = Object.keys(allThreads)
			.sort((a, b) => (allThreads[a]?.lastModified ?? 0) > (allThreads[b]?.lastModified ?? 0) ? -1 : 1)
			.filter(threadId => (allThreads[threadId]?.messages.length ?? 0) !== 0)

		if (sortedThreadIds.length === 0) {
			return
		}

		const picks: IQuickPickItem[] = sortedThreadIds.map(threadId => {
			const thread = allThreads[threadId]!

			// Get first user message as label
			const firstUserMsg = thread.messages.find(m => m.role === 'user')
			const label = firstUserMsg?.displayContent || '(No messages)'

			// Truncate label for display
			const truncatedLabel = label.length > 80 ? label.slice(0, 80) + '...' : label

			// Format relative time
			const lastModified = new Date(thread.lastModified)
			const diffMs = Date.now() - lastModified.getTime()
			const diffMin = Math.floor(diffMs / 60000)
			const diffHour = Math.floor(diffMin / 60)
			const diffDay = Math.floor(diffHour / 24)
			const diffWeek = Math.floor(diffDay / 7)
			const diffMonth = Math.floor(diffDay / 30)
			let timeStr: string
			if (diffMin < 1) timeStr = 'just now'
			else if (diffMin < 60) timeStr = `${diffMin}m ago`
			else if (diffHour < 24) timeStr = `${diffHour}h ago`
			else if (diffDay < 7) timeStr = `${diffDay}d ago`
			else if (diffMonth < 1) timeStr = `${diffWeek}w ago`
			else timeStr = `${diffMonth}mo ago`

			const numMessages = thread.messages.filter(m => m.role === 'assistant' || m.role === 'user').length

			return {
				id: threadId,
				label: truncatedLabel,
				description: timeStr,
				detail: `${numMessages} messages`,
			}
		})

		const selected = await quickInputService.pick(picks, {
			placeHolder: 'Search past chats...',
			matchOnDescription: true,
			matchOnDetail: true,
		})

		if (selected?.id) {
			chatThreadsService.switchToThread(selected.id)
		}
	}
})


// Settings gear
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'loophole.settingsAction',
			title: `Loophole's Settings`,
			icon: { id: 'settings-gear' },
			menu: [{ id: MenuId.ViewTitle, group: 'navigation', when: ContextKeyExpr.equals('view', LOOPHOLE_VIEW_ID), }]
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const commandService = accessor.get(ICommandService)
		commandService.executeCommand(LOOPHOLE_TOGGLE_SETTINGS_ACTION_ID)
	}
})




// export class TabSwitchListener extends Disposable {

// 	constructor(
// 		onSwitchTab: () => void,
// 		@ICodeEditorService private readonly _editorService: ICodeEditorService,
// 	) {
// 		super()

// 		// when editor switches tabs (models)
// 		const addTabSwitchListeners = (editor: ICodeEditor) => {
// 			this._register(editor.onDidChangeModel(e => {
// 				if (e.newModelUrl?.scheme !== 'file') return
// 				onSwitchTab()
// 			}))
// 		}

// 		const initializeEditor = (editor: ICodeEditor) => {
// 			addTabSwitchListeners(editor)
// 		}

// 		// initialize current editors + any new editors
// 		for (let editor of this._editorService.listCodeEditors()) initializeEditor(editor)
// 		this._register(this._editorService.onCodeEditorAdd(editor => { initializeEditor(editor) }))
// 	}
// }

// Reset Token Usage command
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'loophole.resetTokenUsage',
			title: localize2('resetTokenUsage', 'Loophole: Reset Token Usage'),
			f1: true,
			category: { value: localize('loopholeCategory', 'Loophole'), original: 'Loophole' },
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const tokenUsageService = accessor.get(ITokenUsageService);
		tokenUsageService.resetTotalTokens();
	}
});
