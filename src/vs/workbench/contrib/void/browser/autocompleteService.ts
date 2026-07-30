/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILanguageFeaturesService } from '../../../../editor/common/services/languageFeatures.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { EndOfLinePreference, ITextModel } from '../../../../editor/common/model.js';
import { Position } from '../../../../editor/common/core/position.js';
import { InlineCompletion, } from '../../../../editor/common/languages.js';
import { Range } from '../../../../editor/common/core/range.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { isCodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { EditorResourceAccessor } from '../../../common/editor.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import { extractCodeFromRegular } from '../common/helpers/extractCodeFromResult.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { isWindows } from '../../../../base/common/platform.js';
import { ILoopholeSettingsService } from '../common/voidSettingsService.js';
import { FeatureName } from '../common/voidSettingsTypes.js';
import { IConvertToLLMMessageService } from './convertToLLMMessageService.js';

export const IAutocompleteService = createDecorator<IAutocompleteService>('AutocompleteService');

const allLinebreakSymbols = ['\r\n', '\n']
const _ln = isWindows ? allLinebreakSymbols[0] : allLinebreakSymbols[1]

// ─── Constants (mirrors Continue's approach) ──────────────────────────────────

const DEBOUNCE_TIME = 700          // ms to wait after last keystroke before firing
const MIN_PREFIX_CHARS = 3         // non-whitespace chars required on current line
const TIMEOUT_TIME = 60_000
const MAX_CACHE_SIZE = 20
const MAX_PENDING_REQUESTS = 2
const MAX_COMPLETION_LINES = 50    // hard safety cap; Continue uses similar limits

/** Patterns whose presence on a line signals the LLM has gone off the rails */
const LINES_TO_STOP_AT = [
	'# End of file.',
	'<STOP EDITING HERE',
	'<|/updated_code|>',
	'```',
	'diff --git',
]

/** English prose phrases that should never appear at the start of a code completion */
const ENGLISH_START_PHRASES = [
	'here is', 'here\'s', 'sure', 'certainly', 'of course',
	'i will', 'i\'ll', 'the following', 'this code', 'this function',
	'this is', 'note that', 'please', 'you can', 'you\'ll',
]

/** English prose phrases that signal a post-code explanation has started */
const ENGLISH_POST_PHRASES = [
	'explanation:', 'note:', 'this code', 'the above', 'in this',
	'as you can see', 'this will', 'here we', 'we use', 'the function',
]

/** Code keywords that can end in `:` but are NOT English sentences */
const CODE_KEYWORDS_ENDING_IN_COLON = [
	'if', 'else', 'elif', 'for', 'while', 'try', 'except',
	'finally', 'with', 'class', 'def', 'case', 'default',
]


// ─── Continue-style stream post-processing ────────────────────────────────────
// These operate on the *completed* string rather than a live async generator,
// because our architecture delivers the full text in onFinalMessage. The logic
// is identical in spirit to Continue's StreamTransformPipeline.

function isEnglishFirstLine(line: string): boolean {
	const l = line.trim().toLowerCase()
	if (l.endsWith(':') && !CODE_KEYWORDS_ENDING_IN_COLON.some(k => l.startsWith(k))) return true
	return ENGLISH_START_PHRASES.some(p => l.startsWith(p))
}

function isEnglishPostLine(line: string): boolean {
	const l = line.toLowerCase()
	return ENGLISH_POST_PHRASES.some(p => l.startsWith(p))
}

/**
 * Apply a Continue-style multi-stage filter pipeline to the raw LLM output.
 * Returns the cleaned completion string.
 *
 * Stages (in order, matching Continue's StreamTransformPipeline):
 *  1. Stop at suffix overlap – avoids echoing code already in the file
 *  2. Strip leading empty lines
 *  3. Filter English prose at the start
 *  4. Stop at LINES_TO_STOP_AT patterns (```, diff --git, etc.)
 *  5. Stop at repeating lines (hallucination loop detector, max 3 repeats)
 *  6. Stop at double blank line (natural block boundary)
 *  7. Filter English prose at the end
 *  8. Hard cap on number of lines
 *  9. Stop when a line exactly matches the first non-empty line below the cursor
 */
function applyStreamFilterPipeline(
	rawText: string,
	suffix: string,
	lineBelowCursor: string,
): string {
	// --- Stage 1: stop at suffix overlap ---
	// If the LLM starts repeating what's already in the suffix, cut there.
	const trimmedSuffix = suffix.trimStart()
	if (trimmedSuffix.length > 10) {
		// Find the first line of the suffix that's non-trivial
		const suffixFirstLine = trimmedSuffix.split(_ln)[0].trim()
		if (suffixFirstLine.length > 5) {
			const overlapIdx = rawText.indexOf(suffixFirstLine)
			if (overlapIdx > 0) {
				rawText = rawText.slice(0, overlapIdx)
			}
		}
	}

	const rawLines = rawText.split(_ln)
	const outputLines: string[] = []

	// --- Stage 2 & 3: skip leading blank lines and English prose ---
	let startIdx = 0
	for (let i = 0; i < rawLines.length; i++) {
		if (rawLines[i].trim() === '') continue
		if (isEnglishFirstLine(rawLines[i])) { startIdx = i + 1; continue }
		startIdx = i
		break
	}

	// --- Stages 4–9: process remaining lines ---
	let prevLine: string | undefined
	let repeatCount = 0
	let blankLineCount = 0

	for (let i = startIdx; i < rawLines.length; i++) {
		const line = rawLines[i]

		// Stage 4: stop at garbage-signal patterns
		if (LINES_TO_STOP_AT.some(pat => line.includes(pat))) break

		// Stage 5: stop on repeating lines (hallucination loop)
		if (line === prevLine) {
			repeatCount++
			if (repeatCount >= 3) break
		} else {
			repeatCount = 1
		}
		prevLine = line

		// Stage 6: stop at double blank line (end of logical block)
		if (line.trim() === '') {
			blankLineCount++
			if (blankLineCount >= 2) break
		} else {
			blankLineCount = 0
		}

		// Stage 7: stop at English post-explanation
		if (isEnglishPostLine(line)) break

		// Stage 8: hard line cap
		if (outputLines.length >= MAX_COMPLETION_LINES) break

		// Stage 9: stop if we reach a line that already exists below the cursor
		if (
			lineBelowCursor.trim() !== '' &&
			line.trim() !== '' &&
			line.trim() === lineBelowCursor.trim()
		) break

		outputLines.push(line)
	}

	// Remove trailing blank lines
	while (outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
		outputLines.pop()
	}

	return outputLines.join(_ln)
}


// ─── LRU Cache ────────────────────────────────────────────────────────────────

class LRUCache<K, V> {
	public items: Map<K, V>;
	private keyOrder: K[];
	private maxSize: number;
	private disposeCallback?: (value: V, key?: K) => void;

	constructor(maxSize: number, disposeCallback?: (value: V, key?: K) => void) {
		if (maxSize <= 0) throw new Error('Cache size must be greater than 0');
		this.items = new Map();
		this.keyOrder = [];
		this.maxSize = maxSize;
		this.disposeCallback = disposeCallback;
	}

	set(key: K, value: V): void {
		if (this.items.has(key)) {
			this.keyOrder = this.keyOrder.filter(k => k !== key);
		} else if (this.items.size >= this.maxSize) {
			const oldKey = this.keyOrder[0];
			const oldValue = this.items.get(oldKey);
			if (this.disposeCallback && oldValue !== undefined) this.disposeCallback(oldValue, oldKey);
			this.items.delete(oldKey);
			this.keyOrder.shift();
		}
		this.items.set(key, value);
		this.keyOrder.push(key);
	}

	delete(key: K): boolean {
		const value = this.items.get(key);
		if (value !== undefined) {
			if (this.disposeCallback) this.disposeCallback(value, key);
			this.items.delete(key);
			this.keyOrder = this.keyOrder.filter(k => k !== key);
			return true;
		}
		return false;
	}

	clear(): void {
		if (this.disposeCallback) {
			for (const [key, value] of this.items.entries()) this.disposeCallback(value, key);
		}
		this.items.clear();
		this.keyOrder = [];
	}

	get size(): number { return this.items.size; }
	has(key: K): boolean { return this.items.has(key); }
}


// ─── Types ────────────────────────────────────────────────────────────────────

type AutocompletionPredictionType =
	| 'single-line-fill-middle'
	| 'single-line-redo-suffix'
	| 'multi-line-start-on-next-line'
	| 'do-not-predict'

type Autocompletion = {
	id: number,
	prefix: string,
	suffix: string,
	llmPrefix: string,
	llmSuffix: string,
	startTime: number,
	endTime: number | undefined,
	status: 'pending' | 'finished' | 'error',
	type: AutocompletionPredictionType,
	llmPromise: Promise<string> | undefined,
	insertText: string,
	requestId: string | null,
	_newlineCount: number,
}

type PrefixAndSuffixInfo = {
	prefix: string,
	suffix: string,
	prefixLines: string[],
	suffixLines: string[],
	prefixToTheLeftOfCursor: string,
	suffixToTheRightOfCursor: string,
}

type AutocompletionMatchupBounds = {
	startLine: number,
	startCharacter: number,
	startIdx: number,
}

type CompletionOptions = {
	predictionType: AutocompletionPredictionType,
	shouldGenerate: boolean,
	llmPrefix: string,
	llmSuffix: string,
	stopTokens: string[],
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

const removeAllWhitespace = (str: string): string => str.replace(/\s+/g, '')

const processStartAndEndSpaces = (result: string) => {
	[result,] = extractCodeFromRegular({ text: result, recentlyAddedTextLen: result.length })
	const hasLeadingSpace = result.startsWith(' ');
	const hasTrailingSpace = result.endsWith(' ');
	return (hasLeadingSpace ? ' ' : '') + result.trim() + (hasTrailingSpace ? ' ' : '');
}

const removeLeftTabsAndTrimEnds = (s: string): string => {
	const trimmedString = s.trimEnd();
	const trailingEnd = s.slice(trimmedString.length);
	if (trailingEnd.includes(_ln)) s = trimmedString + _ln;
	s = s.replace(/^\s+/gm, '');
	return s;
}

function getIsSubsequence({ of: ofStr, subsequence }: { of: string, subsequence: string }): [boolean, string] {
	if (subsequence.length === 0) return [true, '']
	if (ofStr.length === 0) return [false, '']
	let subIdx = 0, lastMatchChar = ''
	for (let i = 0; i < ofStr.length; i++) {
		if (ofStr[i] === subsequence[subIdx]) { lastMatchChar = ofStr[i]; subIdx++ }
		if (subIdx === subsequence.length) return [true, lastMatchChar]
	}
	return [false, lastMatchChar]
}

function getStringUpToUnbalancedClosingParenthesis(s: string, prefix: string): string {
	const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
	let stack: string[] = []
	const firstOpenIdx = prefix.search(/[[({]/);
	if (firstOpenIdx !== -1) {
		const brackets = prefix.slice(firstOpenIdx).split('').filter(c => '()[]{}'.includes(c));
		for (const bracket of brackets) {
			if ('({['.includes(bracket)) stack.push(bracket)
			else if (stack.length > 0 && stack[stack.length - 1] === pairs[bracket]) stack.pop()
			else stack.push(bracket)
		}
	}
	for (let i = 0; i < s.length; i++) {
		const char = s[i]
		if ('({['.includes(char)) stack.push(char)
		else if (')}]'.includes(char)) {
			if (stack.length === 0 || stack.pop() !== pairs[char]) return s.substring(0, i)
		}
	}
	return s
}

const getPrefixAndSuffixInfo = (model: ITextModel, position: Position): PrefixAndSuffixInfo => {
	const fullText = model.getValue(EndOfLinePreference.LF);
	const cursorOffset = model.getOffsetAt(position)
	const prefix = fullText.substring(0, cursorOffset)
	const suffix = fullText.substring(cursorOffset)
	const prefixLines = prefix.split(_ln)
	const suffixLines = suffix.split(_ln)
	const prefixToTheLeftOfCursor = prefixLines.slice(-1)[0] ?? ''
	const suffixToTheRightOfCursor = suffixLines[0] ?? ''
	return { prefix, suffix, prefixLines, suffixLines, prefixToTheLeftOfCursor, suffixToTheRightOfCursor }
}

const getIndex = (str: string, line: number, char: number) =>
	str.split(_ln).slice(0, line).join(_ln).length + (line > 0 ? 1 : 0) + char

const getLastLine = (s: string): string => s.match(new RegExp(`[^${_ln}]*$`))?.[0] ?? ''

/** Returns the first non-empty line below the cursor (like Continue's getLineBelowCursor) */
const getLineBelowCursor = (suffixLines: string[]): string => {
	for (let i = 1; i < suffixLines.length; i++) {
		if (suffixLines[i].trim() !== '') return suffixLines[i]
	}
	return ''
}


// ─── Autocomplete trigger logic (mirrors Continue's shouldCompleteMultiline) ──

const getCompletionOptions = (
	prefixAndSuffix: PrefixAndSuffixInfo,
	_relevantContext: string,
	justAcceptedAutocompletion: boolean,
): CompletionOptions => {

	let { prefix, suffix, prefixToTheLeftOfCursor, suffixToTheRightOfCursor, suffixLines, prefixLines } = prefixAndSuffix

	// Trim context window to avoid sending massive prompts
	suffixLines = suffix.split(_ln).slice(0, 25)
	prefixLines = prefix.split(_ln).slice(-25)
	prefix = prefixLines.join(_ln)
	suffix = suffixLines.join(_ln)

	const isLineEmpty = !prefixToTheLeftOfCursor.trim() && !suffixToTheRightOfCursor.trim()
	const isLinePrefixEmpty = removeAllWhitespace(prefixToTheLeftOfCursor).length === 0
	const isLineSuffixEmpty = removeAllWhitespace(suffixToTheRightOfCursor).length === 0

	// ── Mirror Continue: don't trigger on single-line comments ──────────────
	const trimmedLeft = prefixToTheLeftOfCursor.trimStart()
	const isSingleLineComment =
		trimmedLeft.startsWith('//') ||
		trimmedLeft.startsWith('#') ||
		trimmedLeft.startsWith('--') ||
		trimmedLeft.startsWith('*')
	if (isSingleLineComment && !justAcceptedAutocompletion) {
		return { predictionType: 'do-not-predict', shouldGenerate: false, llmPrefix: prefix, llmSuffix: suffix, stopTokens: [] }
	}

	// ── Require minimum typed content (avoids garbage on blank/short lines) ─
	const currentLinePrefixChars = removeAllWhitespace(prefixToTheLeftOfCursor).length
	if (!justAcceptedAutocompletion && currentLinePrefixChars < MIN_PREFIX_CHARS && !isLineEmpty) {
		return { predictionType: 'do-not-predict', shouldGenerate: false, llmPrefix: prefix, llmSuffix: suffix, stopTokens: [] }
	}

	// ── Suppress blank-line completions (like Continue: no mid-line if suffix starts with \n) ─
	if (isLineEmpty && !justAcceptedAutocompletion) {
		return { predictionType: 'do-not-predict', shouldGenerate: false, llmPrefix: prefix, llmSuffix: suffix, stopTokens: [] }
	}

	// ── Detect block-opening syntax (def foo():, if x:, function bar() {, …) ─
	const prefixLineTrimmed = prefixToTheLeftOfCursor.trimEnd()
	const prefixEndsWithBlockOpen = /[:{(,\[]$/.test(prefixLineTrimmed)

	// ── Mid-line completion: Continue style — single-line stop ───────────────
	// If there's meaningful content to the right of the cursor, stay single-line.
	if (!isLineSuffixEmpty && suffixToTheRightOfCursor.trim().length > 3) {
		return {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: allLinebreakSymbols,   // single line, like Continue for mid-line
		}
	}

	// ── Post-accept chained completion ───────────────────────────────────────
	if (justAcceptedAutocompletion && isLineSuffixEmpty) {
		return {
			predictionType: 'multi-line-start-on-next-line',
			shouldGenerate: true,
			llmPrefix: prefix + _ln,
			llmSuffix: suffix,
			stopTokens: [`${_ln}${_ln}`],
		}
	}

	// ── Block-opening → multi-line from next line ────────────────────────────
	if (prefixEndsWithBlockOpen && isLineSuffixEmpty) {
		return {
			predictionType: 'multi-line-start-on-next-line',
			shouldGenerate: true,
			llmPrefix: prefix + _ln,
			llmSuffix: suffix,
			stopTokens: [`${_ln}${_ln}`],
		}
	}

	// ── Empty line (only reachable when justAccepted) ────────────────────────
	if (isLineEmpty) {
		return {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: allLinebreakSymbols,
		}
	}

	// ── Short/no suffix → multi-line block completion ────────────────────────
	if (removeAllWhitespace(suffixToTheRightOfCursor).length <= 3) {
		const suffixLinesIgnoringThisLine = suffixLines.slice(1)
		const suffixStringIgnoringThisLine = suffixLinesIgnoringThisLine.length === 0
			? ''
			: _ln + suffixLinesIgnoringThisLine.join(_ln)
		return {
			predictionType: 'single-line-redo-suffix',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffixStringIgnoringThisLine,
			stopTokens: [`${_ln}${_ln}`],
		}
	}

	// ── Non-empty line prefix, some suffix → complete the line ───────────────
	if (!isLinePrefixEmpty) {
		return {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: [`${_ln}${_ln}`],
		}
	}

	return { predictionType: 'do-not-predict', shouldGenerate: false, llmPrefix: prefix, llmSuffix: suffix, stopTokens: [] }
}


// ─── Post-processing ──────────────────────────────────────────────────────────

const postprocessAutocompletion = ({
	autocompletionMatchup, autocompletion, prefixAndSuffix,
}: {
	autocompletionMatchup: AutocompletionMatchupBounds,
	autocompletion: Autocompletion,
	prefixAndSuffix: PrefixAndSuffixInfo,
}) => {
	const { prefix, suffix, prefixToTheLeftOfCursor, suffixToTheRightOfCursor, suffixLines } = prefixAndSuffix
	const generatedMiddle = autocompletion.insertText
	let startIdx = autocompletionMatchup.startIdx
	let endIdx = generatedMiddle.length

	// Strip leading space if user already typed one
	const charToLeft = prefixToTheLeftOfCursor.slice(-1)[0] || ''
	const userTypedSpace = charToLeft === ' ' || charToLeft === '\t'
	const rawFirstNonspaceIdx = generatedMiddle.slice(startIdx).search(/[^\t ]/)
	if (rawFirstNonspaceIdx > -1 && userTypedSpace) {
		startIdx = Math.max(startIdx, rawFirstNonspaceIdx + startIdx)
	}

	// Strip leading newlines on blank lines
	const numStartingNewlines = generatedMiddle.slice(startIdx).match(new RegExp(`^${_ln}+`))?.[0].length || 0;
	if (!prefixToTheLeftOfCursor.trim() && !suffixToTheRightOfCursor.trim() && numStartingNewlines > 0) {
		startIdx += numStartingNewlines
	}

	// Mid-line: stop before the first matching suffix character
	if (autocompletion.type === 'single-line-fill-middle' && suffixToTheRightOfCursor.trim()) {
		const rawMatchIndex = generatedMiddle.slice(startIdx).lastIndexOf(suffixToTheRightOfCursor.trim()[0])
		if (rawMatchIndex > -1) {
			const matchIdx = rawMatchIndex + startIdx
			const matchChar = generatedMiddle[matchIdx]
			if (`{}()[]<>\`'"`.includes(matchChar)) {
				endIdx = Math.min(endIdx, matchIdx)
			}
		}
	}

	let completionStr = generatedMiddle.slice(startIdx, endIdx)

	// ── Apply the Continue-style stream filter pipeline ──────────────────────
	const lineBelowCursor = getLineBelowCursor(suffixLines)
	completionStr = applyStreamFilterPipeline(completionStr, suffix, lineBelowCursor)

	// Filter unbalanced parentheses
	completionStr = getStringUpToUnbalancedClosingParenthesis(completionStr, prefix)

	return completionStr
}


const getAutocompletionMatchup = ({
	prefix, autocompletion,
}: {
	prefix: string,
	autocompletion: Autocompletion,
}): AutocompletionMatchupBounds | undefined => {
	const trimmedCurrentPrefix = removeLeftTabsAndTrimEnds(prefix)
	const trimmedCompletionPrefix = removeLeftTabsAndTrimEnds(autocompletion.prefix)
	const trimmedCompletionMiddle = removeLeftTabsAndTrimEnds(autocompletion.insertText)

	if (trimmedCurrentPrefix.length < trimmedCompletionPrefix.length) return undefined
	if (!(trimmedCompletionPrefix + trimmedCompletionMiddle).startsWith(trimmedCurrentPrefix)) return undefined

	const lineStart =
		trimmedCurrentPrefix.split(_ln).length -
		trimmedCompletionPrefix.split(_ln).length

	if (lineStart < 0) { console.error('Error: No line found.'); return undefined }

	const currentPrefixLine = getLastLine(trimmedCurrentPrefix)
	const completionPrefixLine = lineStart === 0 ? getLastLine(trimmedCompletionPrefix) : ''
	const completionMiddleLine = autocompletion.insertText.split(_ln)[lineStart]
	const fullCompletionLine = completionPrefixLine + completionMiddleLine

	const charMatchIdx = fullCompletionLine.indexOf(currentPrefixLine)
	if (charMatchIdx < 0) { console.error('Warning: Found character with negative index.'); return undefined }

	const character = charMatchIdx + currentPrefixLine.length - completionPrefixLine.length
	const startIdx = getIndex(autocompletion.insertText, lineStart, character)

	return { startLine: lineStart, startCharacter: character, startIdx }
}


const toInlineCompletions = ({
	autocompletionMatchup, autocompletion, prefixAndSuffix, position,
}: {
	autocompletionMatchup: AutocompletionMatchupBounds,
	autocompletion: Autocompletion,
	prefixAndSuffix: PrefixAndSuffixInfo,
	position: Position,
	debug?: boolean,
}): { insertText: string, range: Range }[] => {

	let trimmedInsertText = postprocessAutocompletion({ autocompletionMatchup, autocompletion, prefixAndSuffix })
	let rangeToReplace: Range = new Range(position.lineNumber, position.column, position.lineNumber, position.column)

	if (autocompletion.type === 'single-line-redo-suffix') {
		const oldSuffix = prefixAndSuffix.suffixToTheRightOfCursor
		const newSuffix = autocompletion.insertText
		const [isSubsequence, lastMatchingChar] = getIsSubsequence({
			subsequence: removeAllWhitespace(oldSuffix),
			of: removeAllWhitespace(newSuffix),
		})
		if (isSubsequence) {
			rangeToReplace = new Range(position.lineNumber, position.column, position.lineNumber, Number.MAX_SAFE_INTEGER)
		} else {
			const lastMatchupIdx = trimmedInsertText.lastIndexOf(lastMatchingChar)
			trimmedInsertText = trimmedInsertText.slice(0, lastMatchupIdx + 1)
			const numCharsToReplace = oldSuffix.lastIndexOf(lastMatchingChar) + 1
			rangeToReplace = new Range(position.lineNumber, position.column, position.lineNumber, position.column + numCharsToReplace)
		}
	}

	return [{ insertText: trimmedInsertText, range: rangeToReplace }]
}


// ─── Service ──────────────────────────────────────────────────────────────────

export interface IAutocompleteService {
	readonly _serviceBrand: undefined;
}

export class AutocompleteService extends Disposable implements IAutocompleteService {

	static readonly ID = 'void.autocompleteService'
	_serviceBrand: undefined;

	private _autocompletionId: number = 0;
	private _autocompletionsOfDocument: { [docUriStr: string]: LRUCache<number, Autocompletion> } = {}
	private _lastCompletionStart = 0
	private _lastCompletionAccept = 0

	async _provideInlineCompletionItems(
		model: ITextModel,
		position: Position,
	): Promise<InlineCompletion[]> {

		const isEnabled = this._settingsService.state.globalSettings.enableAutocomplete
		if (!isEnabled) return []

		const testMode = false
		const docUriStr = model.uri.fsPath;
		const prefixAndSuffix = getPrefixAndSuffixInfo(model, position)
		const { prefix, suffix } = prefixAndSuffix

		if (!this._autocompletionsOfDocument[docUriStr]) {
			this._autocompletionsOfDocument[docUriStr] = new LRUCache<number, Autocompletion>(
				MAX_CACHE_SIZE,
				(autocompletion: Autocompletion) => {
					if (autocompletion.requestId) this._llmMessageService.abort(autocompletion.requestId)
				}
			)
		}

		// ── Cache lookup ─────────────────────────────────────────────────────
		let cachedAutocompletion: Autocompletion | undefined
		let autocompletionMatchup: AutocompletionMatchupBounds | undefined
		for (const autocompletion of this._autocompletionsOfDocument[docUriStr].items.values()) {
			autocompletionMatchup = getAutocompletionMatchup({ prefix, autocompletion })
			if (autocompletionMatchup !== undefined) { cachedAutocompletion = autocompletion; break }
		}

		if (cachedAutocompletion && autocompletionMatchup) {
			if (cachedAutocompletion.status === 'finished') {
				return toInlineCompletions({ autocompletionMatchup, autocompletion: cachedAutocompletion, prefixAndSuffix, position })
			} else if (cachedAutocompletion.status === 'pending') {
				try {
					await cachedAutocompletion.llmPromise;
					return toInlineCompletions({ autocompletionMatchup, autocompletion: cachedAutocompletion, prefixAndSuffix, position })
				} catch (e) {
					this._autocompletionsOfDocument[docUriStr].delete(cachedAutocompletion.id)
					console.error('Error creating autocompletion (1): ' + e)
				}
			}
			return []
		}

		// ── Debounce (UUID-style: Continue's AutocompleteDebouncer) ──────────
		const thisTime = Date.now()
		const justAcceptedAutocompletion = thisTime - this._lastCompletionAccept < 500
		this._lastCompletionStart = thisTime

		const didTypingHappenDuringDebounce = await new Promise<boolean>(resolve =>
			setTimeout(() => resolve(this._lastCompletionStart !== thisTime), DEBOUNCE_TIME)
		)
		if (didTypingHappenDuringDebounce) return []

		// ── Pending request management ───────────────────────────────────────
		let numPending = 0
		let oldestPending: Autocompletion | undefined
		for (const autocompletion of this._autocompletionsOfDocument[docUriStr].items.values()) {
			if (autocompletion.status === 'pending') {
				numPending++
				if (!oldestPending) oldestPending = autocompletion
				if (numPending >= MAX_PENDING_REQUESTS) {
					this._autocompletionsOfDocument[docUriStr].delete(oldestPending.id)
					break
				}
			}
		}

		const relevantContext = ''
		const { shouldGenerate, predictionType, llmPrefix, llmSuffix, stopTokens } =
			getCompletionOptions(prefixAndSuffix, relevantContext, justAcceptedAutocompletion)

		if (!shouldGenerate) return []
		if (testMode && this._autocompletionId !== 0) return []

		// ── Create new autocompletion ────────────────────────────────────────
		const newAutocompletion: Autocompletion = {
			id: this._autocompletionId++,
			prefix, suffix,
			llmPrefix, llmSuffix,
			startTime: Date.now(),
			endTime: undefined,
			type: predictionType,
			status: 'pending',
			llmPromise: undefined,
			insertText: '',
			requestId: null,
			_newlineCount: 0,
		}

		console.log('starting autocomplete...', predictionType)

		const featureName: FeatureName = 'Autocomplete'
		const overridesOfModel = this._settingsService.state.overridesOfModel
		const modelSelection = this._settingsService.state.modelSelectionOfFeature[featureName]
		const modelSelectionOptions = modelSelection
			? this._settingsService.state.optionsOfModelSelection[featureName][modelSelection.providerName]?.[modelSelection.modelName]
			: undefined

		newAutocompletion.llmPromise = new Promise((resolve, reject) => {
			const requestId = this._llmMessageService.sendLLMMessage({
				messagesType: 'FIMMessage',
				messages: this._convertToLLMMessageService.prepareFIMMessage({
					messages: { prefix: llmPrefix, suffix: llmSuffix, stopTokens },
					modelSelection,
				}),
				modelSelection,
				modelSelectionOptions,
				overridesOfModel,
				logging: { loggingName: 'Autocomplete' },
				onText: () => {},
				onFinalMessage: ({ fullText }) => {
					newAutocompletion.endTime = Date.now()
					newAutocompletion.status = 'finished'
					const [text] = extractCodeFromRegular({ text: fullText, recentlyAddedTextLen: 0 })
					newAutocompletion.insertText = processStartAndEndSpaces(text)
					if (newAutocompletion.type === 'multi-line-start-on-next-line') {
						newAutocompletion.insertText = _ln + newAutocompletion.insertText
					}
					resolve(newAutocompletion.insertText)
				},
				onError: ({ message }) => {
					newAutocompletion.endTime = Date.now()
					newAutocompletion.status = 'error'
					reject(message)
				},
				onAbort: () => { reject('Aborted autocomplete') },
			})
			newAutocompletion.requestId = requestId

			setTimeout(() => {
				if (newAutocompletion.status === 'pending') reject('Timeout receiving message to LLM.')
			}, TIMEOUT_TIME)
		})

		this._autocompletionsOfDocument[docUriStr].set(newAutocompletion.id, newAutocompletion)

		try {
			await newAutocompletion.llmPromise
			const matchup: AutocompletionMatchupBounds = { startIdx: 0, startLine: 0, startCharacter: 0 }
			return toInlineCompletions({ autocompletionMatchup: matchup, autocompletion: newAutocompletion, prefixAndSuffix, position })
		} catch (e) {
			this._autocompletionsOfDocument[docUriStr].delete(newAutocompletion.id)
			console.error('Error creating autocompletion (2): ' + e)
			return []
		}
	}

	constructor(
		@ILanguageFeaturesService private _langFeatureService: ILanguageFeaturesService,
		@ILLMMessageService private readonly _llmMessageService: ILLMMessageService,
		@IEditorService private readonly _editorService: IEditorService,
		@IModelService private readonly _modelService: IModelService,
		@ILoopholeSettingsService private readonly _settingsService: ILoopholeSettingsService,
		@IConvertToLLMMessageService private readonly _convertToLLMMessageService: IConvertToLLMMessageService,
	) {
		super()

		this._register(this._langFeatureService.inlineCompletionsProvider.register('*', {
			provideInlineCompletions: async (model, position, _context, _token) => {
				const items = await this._provideInlineCompletionItems(model, position)
				return { items }
			},
			handleItemDidShow: (_completions, _item, _updatedInsertText) => {
				const activePane = this._editorService.activeEditorPane;
				if (!activePane) return;
				const control = activePane.getControl();
				if (!control || !isCodeEditor(control)) return;
				const position = control.getPosition();
				if (!position) return;
				const resource = EditorResourceAccessor.getCanonicalUri(this._editorService.activeEditor);
				if (!resource) return;
				const model = this._modelService.getModel(resource)
				if (!model) return;
				const docUriStr = resource.fsPath;
				if (!this._autocompletionsOfDocument[docUriStr]) return;
				const { prefix } = getPrefixAndSuffixInfo(model, position)
				this._autocompletionsOfDocument[docUriStr].items.forEach((autocompletion: Autocompletion) => {
					const matchup = removeAllWhitespace(prefix) === removeAllWhitespace(autocompletion.prefix + autocompletion.insertText)
					if (matchup) {
						console.log('ACCEPT', autocompletion.id)
						this._lastCompletionAccept = Date.now()
						this._autocompletionsOfDocument[docUriStr].delete(autocompletion.id);
					}
				});
			},
			disposeInlineCompletions: (_completions, _reason) => {},
		}))
	}
}

registerWorkbenchContribution2(AutocompleteService.ID, AutocompleteService, WorkbenchPhase.BlockRestore);
