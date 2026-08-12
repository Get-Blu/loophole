/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Garv Agnihotri, Inc. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { URI } from '../../../../base/common/uri.js';
import { VSBuffer } from '../../../../base/common/buffer.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IDirectoryStrService } from '../common/directoryStrService.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { ILoopholeSettingsService } from '../common/voidSettingsService.js';
import {
	defaultWikiState,
	WikiGraph,
	WikiPage,
	WikiState,
} from '../common/repoWikiTypes.js';
import {
	repoWiki_fileSelectionPrompt,
	repoWiki_graphPrompt,
	repoWiki_pagePrompt,
	repoWiki_planningPrompt,
} from '../common/prompt/prompts.js';

export const IRepoWikiService = createDecorator<IRepoWikiService>('repoWikiService');

export interface IRepoWikiService {
	readonly _serviceBrand: undefined;
	readonly state: WikiState;
	readonly onDidChangeState: Event<void>;
	generateWiki(): Promise<void>;
	updateStalePage(pageId: string): Promise<void>;
	selectPage(pageId: string | null): void;
	clearWiki(): void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const WIKI_DIR = '.loophole/wiki';
const WIKI_INDEX_FILE = '.loophole/wiki/index.json';

function slugify(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseJSON<T>(text: string, fallback: T): T {
	try {
		// Strip markdown fences if model wrapped it
		const clean = text.replace(/```(?:json)?/g, '').trim();
		return JSON.parse(clean) as T;
	} catch {
		return fallback;
	}
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────

class RepoWikiService extends Disposable implements IRepoWikiService {
	readonly _serviceBrand: undefined;

	private _state: WikiState = { ...defaultWikiState };
	get state(): WikiState { return this._state; }

	private readonly _onDidChangeState = new Emitter<void>();
	readonly onDidChangeState: Event<void> = this._onDidChangeState.event;

	constructor(
		@IFileService private readonly _fileService: IFileService,
		@IWorkspaceContextService private readonly _workspaceContextService: IWorkspaceContextService,
		@IDirectoryStrService private readonly _directoryStrService: IDirectoryStrService,
		@ILLMMessageService private readonly _llmMessageService: ILLMMessageService,
		@ILoopholeSettingsService private readonly _settingsService: ILoopholeSettingsService,
	) {
		super();
		this._loadPersistedState();
	}

	// ─── STATE ───────────────────────────────────────────────────────────────

	private _setState(partial: Partial<WikiState>): void {
		this._state = { ...this._state, ...partial };
		this._onDidChangeState.fire();
	}

	private _updatePage(pageId: string, partial: Partial<WikiPage>): void {
		this._state = {
			...this._state,
			pages: this._state.pages.map(p => p.id === pageId ? { ...p, ...partial } : p),
		};
		this._onDidChangeState.fire();
	}

	// ─── WORKSPACE ROOT ──────────────────────────────────────────────────────

	private _getWorkspaceRoot(): URI | null {
		const folders = this._workspaceContextService.getWorkspace().folders;
		return folders[0]?.uri ?? null;
	}

	private _wikiFileUri(filename: string): URI | null {
		const root = this._getWorkspaceRoot();
		if (!root) return null;
		return URI.joinPath(root, filename);
	}

	// ─── PERSISTENCE ─────────────────────────────────────────────────────────

	private async _loadPersistedState(): Promise<void> {
		try {
			const indexUri = this._wikiFileUri(WIKI_INDEX_FILE);
			if (!indexUri) return;
			const exists = await this._fileService.exists(indexUri);
			if (!exists) return;
			const content = await this._fileService.readFile(indexUri);
			const persisted = parseJSON<Partial<WikiState>>(content.value.toString(), {});
			if (persisted.pages && Array.isArray(persisted.pages)) {
				// Load page content from individual md files
				const pages = await Promise.all(persisted.pages.map(async (p: WikiPage) => {
					try {
						const mdUri = this._wikiFileUri(`${WIKI_DIR}/${p.id}.md`);
						if (!mdUri) return p;
						const mdExists = await this._fileService.exists(mdUri);
						if (!mdExists) return p;
						const md = await this._fileService.readFile(mdUri);
						return { ...p, content: md.value.toString(), status: 'ready' as const };
					} catch {
						return p;
					}
				}));
				this._setState({
					status: 'ready',
					pages,
					graph: persisted.graph ?? null,
				});
			}
		} catch {
			// No persisted state — start fresh
		}
	}

	private async _persistState(): Promise<void> {
		try {
			const root = this._getWorkspaceRoot();
			if (!root) return;

			// Ensure wiki dir exists
			const wikiDirUri = URI.joinPath(root, WIKI_DIR);
			try { await this._fileService.createFolder(wikiDirUri); } catch { /* already exists */ }

			// Write each page as a separate .md file
			for (const page of this._state.pages) {
				if (page.status === 'ready' && page.content) {
					const mdUri = this._wikiFileUri(`${WIKI_DIR}/${page.id}.md`);
					if (mdUri) {
						await this._fileService.writeFile(mdUri, VSBuffer.fromString(page.content));
					}
				}
			}

			// Write index.json (without large content — that lives in the .md files)
			const indexUri = this._wikiFileUri(WIKI_INDEX_FILE);
			if (indexUri) {
				const index = {
					pages: this._state.pages.map(({ content: _content, ...rest }) => rest),
					graph: this._state.graph,
				};
				await this._fileService.writeFile(indexUri, VSBuffer.fromString(JSON.stringify(index, null, 2)));
			}
		} catch (e) {
			console.error('RepoWiki: failed to persist state', e);
		}
	}

	// ─── LLM HELPERS ─────────────────────────────────────────────────────────

	private _currentModelProps() {
		const modelSelection = this._settingsService.state.modelSelectionOfFeature['Chat'];
		const overridesOfModel = this._settingsService.state.overridesOfModel;
		const modelSelectionOptions = modelSelection
			? this._settingsService.state.optionsOfModelSelection['Chat']?.[modelSelection.providerName]?.[modelSelection.modelName]
			: undefined;
		return { modelSelection, overridesOfModel, modelSelectionOptions };
	}

	private _sendOneShot(systemPrompt: string, userPrompt: string): Promise<string> {
		return new Promise<string>((resolve) => {
			const { modelSelection, overridesOfModel, modelSelectionOptions } = this._currentModelProps();
			if (!modelSelection) { resolve(''); return; }

			this._llmMessageService.sendLLMMessage({
				messagesType: 'chatMessages',
				chatMode: 'normal',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				modelSelection,
				modelSelectionOptions,
				overridesOfModel,
				separateSystemMessage: undefined,
				logging: { loggingName: 'RepoWiki', loggingExtras: {} },
				onText: () => { },
				onFinalMessage: ({ fullText }) => resolve(fullText),
				onError: () => resolve(''),
				onAbort: () => resolve(''),
			});
		});
	}

	// ─── FILE READING FOR A PAGE ─────────────────────────────────────────────

	private async _readFilesForPage(pageTitle: string, pageDescription: string, directoryStr: string): Promise<{ path: string, content: string }[]> {
		// Ask the LLM which files to read
		const selectionResponse = await this._sendOneShot(
			'You are a precise file selector. Return only valid JSON.',
			repoWiki_fileSelectionPrompt(pageTitle, pageDescription, directoryStr),
		);
		const filePaths = parseJSON<string[]>(selectionResponse, []);

		const root = this._getWorkspaceRoot();
		if (!root || filePaths.length === 0) return [];

		const results: { path: string, content: string }[] = [];
		for (const filePath of filePaths.slice(0, 8)) {
			try {
				const uri = URI.joinPath(root, filePath);
				const file = await this._fileService.readFile(uri);
				const content = file.value.toString();
				// Truncate very large files
				results.push({ path: filePath, content: content.length > 8000 ? content.slice(0, 8000) + '\n... (truncated)' : content });
			} catch {
				// File doesn't exist or can't be read — skip
			}
		}
		return results;
	}

	// ─── MAIN GENERATION ─────────────────────────────────────────────────────

	selectPage(pageId: string | null): void {
		this._setState({ selectedPageId: pageId });
	}

	clearWiki(): void {
		this._setState({ ...defaultWikiState });
	}

	async generateWiki(): Promise<void> {
		if (this._state.status === 'planning' || this._state.status === 'generating') return;

		this._setState({ status: 'planning', pages: [], graph: null, selectedPageId: null });

		try {
			// Step 1: Get directory structure
			const directoryStr = await this._directoryStrService.getAllDirectoriesStr({
				cutOffMessage: '...directory listing cut off...',
			});

			// Step 2: Planning pass — decide what pages to write
			const planResponse = await this._sendOneShot(
				'You are a technical documentation planner. Return only valid JSON.',
				repoWiki_planningPrompt(directoryStr),
			);

			type PlanItem = { id: string; title: string; description: string; group: string };
			const plan = parseJSON<PlanItem[]>(planResponse, []);

			if (plan.length === 0) {
				this._setState({ status: 'error', errorMessage: 'Planning pass returned no pages. Try again.' });
				return;
			}

			// Normalize IDs
			const normalizedPlan = plan.map(p => ({
				...p,
				id: p.id || slugify(p.title),
			}));

			// Initialize pages as pending
			const initialPages: WikiPage[] = normalizedPlan.map(p => ({
				id: p.id,
				title: p.title,
				description: p.description,
				content: '',
				sourceFiles: [],
				status: 'pending' as const,
				generatedAt: Date.now(),
			}));

			this._setState({ status: 'generating', pages: initialPages });

			// Step 3: Write each page sequentially
			const allPageTitles = normalizedPlan.map(p => p.title);

			for (const pagePlan of normalizedPlan) {
				this._updatePage(pagePlan.id, { status: 'generating' });

				try {
					// Read relevant files for this page
					const fileContents = await this._readFilesForPage(pagePlan.title, pagePlan.description, directoryStr);
					const sourceFiles = fileContents.map(f => f.path);

					// Write the page
					const pageContent = await this._sendOneShot(
						'You are a precise technical writer. Write clear developer documentation in markdown.',
						repoWiki_pagePrompt(pagePlan.title, pagePlan.description, allPageTitles, fileContents, directoryStr),
					);

					this._updatePage(pagePlan.id, {
						status: 'ready',
						content: pageContent,
						sourceFiles,
						generatedAt: Date.now(),
					});

				} catch (e) {
					this._updatePage(pagePlan.id, {
						status: 'error',
						errorMessage: String(e),
					});
				}
			}

			// Step 4: Generate dependency graph
			const graphResponse = await this._sendOneShot(
				'You are a software architect mapping dependencies. Return only valid JSON.',
				repoWiki_graphPrompt(normalizedPlan),
			);

			type GraphResponse = { edges: { source: string; target: string; label: string }[] };
			const graphData = parseJSON<GraphResponse>(graphResponse, { edges: [] });

			const graph: WikiGraph = {
				nodes: normalizedPlan.map(p => ({
					id: p.id,
					title: p.title,
					group: p.group,
				})),
				edges: graphData.edges.filter(e =>
					normalizedPlan.some(p => p.id === e.source) &&
					normalizedPlan.some(p => p.id === e.target) &&
					e.source !== e.target
				),
			};

			// Select the first page (overview) by default
			const firstPageId = normalizedPlan[0]?.id ?? null;

			this._setState({
				status: 'ready',
				graph,
				selectedPageId: firstPageId,
			});

			// Persist to disk
			await this._persistState();

		} catch (e) {
			this._setState({ status: 'error', errorMessage: String(e) });
		}
	}

	async updateStalePage(pageId: string): Promise<void> {
		const page = this._state.pages.find(p => p.id === pageId);
		if (!page) return;

		this._updatePage(pageId, { status: 'generating' });

		try {
			const directoryStr = await this._directoryStrService.getAllDirectoriesStr({
				cutOffMessage: '...directory listing cut off...',
			});
			const allPageTitles = this._state.pages.map(p => p.title);
			const fileContents = await this._readFilesForPage(page.title, page.description, directoryStr);
			const sourceFiles = fileContents.map(f => f.path);

			const pageContent = await this._sendOneShot(
				'You are a precise technical writer. Write clear developer documentation in markdown.',
				repoWiki_pagePrompt(page.title, page.description, allPageTitles, fileContents, directoryStr),
			);

			this._updatePage(pageId, {
				status: 'ready',
				content: pageContent,
				sourceFiles,
				generatedAt: Date.now(),
			});

			await this._persistState();
		} catch (e) {
			this._updatePage(pageId, { status: 'error', errorMessage: String(e) });
		}
	}
}

registerSingleton(IRepoWikiService, RepoWikiService, InstantiationType.Delayed);
