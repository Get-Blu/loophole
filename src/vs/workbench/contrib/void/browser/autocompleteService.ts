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

// ─── Constants (mirrors Continue's approach exactly) ──────────────────────────

const DEBOUNCE_TIME = 350          // Continue default: 350ms
const TIMEOUT_TIME = 60_000
const MAX_CACHE_SIZE = 20
const MAX_PENDING_REQUESTS = 2
const MAX_COMPLETION_LINES = 50

// Exact copies from Continue's lineStream.ts
const LINES_TO_STOP_AT = [
	'# End of file.',
	'<STOP EDITING HERE',
	'<|/updated_code|>',
	'```',
]

// Lines to remove before the first real code line (Continue: LINES_TO_REMOVE_BEFORE_START)
const LINES_TO_REMOVE_BEFORE_START = [
	'<COMPLETION>',
	'[CODE]',
	'<START EDITING HERE>',
	'{{FILL_HERE}}',
	'<FILL_HERE>',   // our own sentinel, strip if echoed
]

// Prefixes to strip from the very first line (Continue: PREFIXES_TO_SKIP)
const PREFIXES_TO_SKIP = ['<COMPLETION>']

// Exact copies from Continue's lineStream.ts
const ENGLISH_START_PHRASES = [
	'here is',
	'here\'s',
	'sure, here',
	'sure thing',
	'sure!',
	'to fill',
	'certainly',
	'of course',
	'the code should',
]

const ENGLISH_POST_PHRASES = [
	'explanation:',
	'here is',
	'here\'s how',
	'the above',
]

/** Code keywords that can end in `:` but are NOT English sentences */
const CODE_KEYWORDS_ENDING_IN_COLON = [
	'if', 'else', 'elif', 'for', 'while', 'try', 'except',
	'finally', 'with', 'class', 'def', 'case', 'default',
]


// ─── Continue-style stream post-processing ────────────────────────────────────
// Ported from Continue's StreamTransformPipeline + postprocessCompletion.
// Runs on the completed string (our arch) but applies the same logic Continue
// applies to the live generator.

function isEnglishFirstLine(line: string): boolean {
	const l = line.trim().toLowerCase()
	if (l.endsWith(':') && !CODE_KEYWORDS_ENDING_IN_COLON.some(k => l.startsWith(k))) return true
	return ENGLISH_START_PHRASES.some(p => l.startsWith(p))
}

function isEnglishPostLine(line: string): boolean {
	const l = line.toLowerCase()
	return ENGLISH_POST_PHRASES.some(p => l.startsWith(p))
}

/** Continue: rewritesLineAbove — don't complete if we'd just repeat the line strictly above the cursor */
function rewritesLineAbove(completion: string, prefix: string): boolean {
	const allLines = prefix.split('\n')
	// The last line is the current (partial) line — we want the one above it
	const linesAboveCursor = allLines.slice(0, -1).filter(l => l.trim().length > 0)
	const lineAbove = linesAboveCursor[linesAboveCursor.length - 1]
	if (!lineAbove) return false
	const firstLineOfCompletion = completion.split('\n').find(l => l.trim().length > 0)
	if (!firstLineOfCompletion) return false
	// "repeated" = completion's first line is just a repeat of the line above the cursor
	const a = lineAbove.trim(), b = firstLineOfCompletion.trim()
	return a.length > 4 && b.startsWith(a)
}

/** Continue: isExtremeRepetition — catch infinite hallucination loops */
function isExtremeRepetition(completion: string): boolean {
	const lines = completion.split('\n')
	if (lines.length < 6) return false
	for (let freq = 1; freq < 3; freq++) {
		const anchor = lines[0]
		let matchCount = 0
		for (let i = 0; i < lines.length; i += freq) {
			if (lines[i] === anchor) matchCount++
		}
		if (matchCount * freq > 8 || (matchCount * freq) / lines.length > 0.8) return true
	}
	return false
}

/** Continue: removeBackticks */
function removeBackticks(completion: string): string {
	const lines = completion.split('\n')
	let startIdx = 0, endIdx = lines.length
	if (lines[0]?.trim().startsWith('```')) startIdx = 1
	if (lines.length > startIdx && /^`+$/.test(lines[lines.length - 1]?.trim() ?? '')) endIdx = lines.length - 1
	if (startIdx > 0 || endIdx < lines.length) return lines.slice(startIdx, endIdx).join('\n')
	return completion
}

/**
 * Full Continue-compatible filter pipeline applied to the completed string.
 *
 * Matches Continue's StreamTransformPipeline stages:
 *  0. removeBackticks (postprocessCompletion)
 *  1. stopAtStartOf suffix (charStream)
 *  2. skipPrefixes — strip PREFIXES_TO_SKIP from first line
 *  3. Skip LINES_TO_REMOVE_BEFORE_START
 *  4. stopAtLines — LINES_TO_STOP_AT
 *  5. stopAtLinesExact — lineBelowCursor exact match
 *  6. stopAtRepeatingLines — max 3 repeats
 *  7. avoidEmptyComments (skip comment-only blank lines)
 *  8. noDoubleNewLine — stop at first blank line (single-line mode)
 *  9. English post-phrase stop
 * 10. stopAtSimilarLine — fuzzy match with line below cursor
 * 11. Hard line cap
 * 12. isExtremeRepetition / rewritesLineAbove → return ''
 */
function applyStreamFilterPipeline(
	rawText: string,
	suffix: string,
	lineBelowCursor: string,
	prefix: string,
): string {
	// Stage 0: strip backtick fences (Continue: removeBackticks in postprocessCompletion)
	rawText = removeBackticks(rawText)

	// Stage 1: stop at suffix overlap (Continue: stopAtStartOf suffix in charStream)
	const trimmedSuffix = suffix.trimStart()
	if (trimmedSuffix.length > 10) {
		const suffixFirstLine = trimmedSuffix.split(_ln)[0].trim()
		if (suffixFirstLine.length > 5) {
			const overlapIdx = rawText.indexOf(suffixFirstLine)
			if (overlapIdx > 0) { console.log('[AC:filter] stage1 suffix overlap cut at', overlapIdx); rawText = rawText.slice(0, overlapIdx) }
		}
	}

	const rawLines = rawText.split(_ln)
	const outputLines: string[] = []

	let isFirstRealLine = true

	for (let i = 0; i < rawLines.length; i++) {
		let line = rawLines[i]

		// Stage 3: skip LINES_TO_REMOVE_BEFORE_START (before first real code)
		if (isFirstRealLine && LINES_TO_REMOVE_BEFORE_START.some(p => line.trimStart().startsWith(p))) {
			console.log('[AC:filter] stage3 removed line before start:', JSON.stringify(line.slice(0,40)))
			continue
		}

		// Stage 2: strip PREFIXES_TO_SKIP from first line
		if (isFirstRealLine) {
			const match = PREFIXES_TO_SKIP.find(p => line.startsWith(p))
			if (match) line = line.slice(match.length)
		}

		// Skip leading blank lines before first real content
		if (isFirstRealLine && line.trim() === '') {
			continue
		}

		// Skip leading English prose (Continue: ENGLISH_START_PHRASES)
		if (isFirstRealLine && isEnglishFirstLine(line)) {
			continue
		}

		if (line.trim() !== '') isFirstRealLine = false

		// Stage 4: stopAtLines
		if (LINES_TO_STOP_AT.some(pat => line.includes(pat))) { console.log('[AC:filter] stage4 stop-at-line:', JSON.stringify(line.slice(0,60))); break }

		// Stage 5: stopAtLinesExact — exact match with line below cursor
		if (lineBelowCursor !== '' && line === lineBelowCursor) { console.log('[AC:filter] stage5 line matches lineBelowCursor:', JSON.stringify(line.slice(0,60))); break }

		// Stage 6: stopAtRepeatingLines (max 3)
		const prevLine = outputLines[outputLines.length - 1]
		if (line === prevLine) {
			const prevPrev = outputLines[outputLines.length - 2]
			if (line === prevPrev) break // 3 identical in a row
		}

		// Stage 8: noDoubleNewLine — first blank line stops stream
		if (line.trim() === '' && outputLines.length > 0) { console.log('[AC:filter] stage8 blank line stop after', outputLines.length, 'lines'); break }

		// Stage 9: English post-phrase
		if (isEnglishPostLine(line)) { console.log('[AC:filter] stage9 English post-phrase:', JSON.stringify(line.slice(0,60))); break }

		// Stage 10: stopAtSimilarLine — fuzzy: trimmed equality with line below
		if (
			lineBelowCursor.trim() !== '' &&
			line.trim() !== '' &&
			line.trim() === lineBelowCursor.trim()
		) { console.log('[AC:filter] stage10 trimmed match with lineBelowCursor:', JSON.stringify(line.slice(0,60))); break }

		// Stage 11: hard line cap
		if (outputLines.length >= MAX_COMPLETION_LINES) break

		outputLines.push(line)
	}

	// Remove trailing blank lines
	while (outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
		outputLines.pop()
	}

	const result = outputLines.join(_ln)

	// Stage 12: postprocessCompletion guards (Continue)
	if (result.trim().length === 0) { console.log('[AC:filter] stage12 — result empty after pipeline'); return '' }
	if (rewritesLineAbove(result, prefix)) { console.log('[AC:filter] stage12 — rewritesLineAbove killed:', JSON.stringify(result.slice(0, 60))); return '' }
	if (isExtremeRepetition(result)) { console.log('[AC:filter] stage12 — isExtremeRepetition killed:', JSON.stringify(result.slice(0, 60))); return '' }

	return result
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


const getCompletionOptions = (
	prefixAndSuffix: PrefixAndSuffixInfo,
	_relevantContext: string,
	justAcceptedAutocompletion: boolean,
): CompletionOptions => {

	let { prefix, suffix, prefixToTheLeftOfCursor, suffixToTheRightOfCursor, suffixLines, prefixLines } = prefixAndSuffix

	// trim prefix and suffix to not be very large
	suffixLines = suffix.split(_ln).slice(0, 25)
	prefixLines = prefix.split(_ln).slice(-25)
	prefix = prefixLines.join(_ln)
	suffix = suffixLines.join(_ln)

	const isLineEmpty = !prefixToTheLeftOfCursor.trim() && !suffixToTheRightOfCursor.trim()
	const isLinePrefixEmpty = removeAllWhitespace(prefixToTheLeftOfCursor).length === 0
	const isLineSuffixEmpty = removeAllWhitespace(suffixToTheRightOfCursor).length === 0

	// detect if the prefix line ends with block-opening syntax (def foo():, if x:, function bar() {, etc.)
	const prefixLineTrimmed = prefixToTheLeftOfCursor.trimEnd()
	const prefixEndsWithBlockOpen = /[:{(,\[]$/.test(prefixLineTrimmed)

	// if we just accepted an autocompletion, predict a multiline completion starting on the next line
	if (justAcceptedAutocompletion && isLineSuffixEmpty) {
		return {
			predictionType: 'multi-line-start-on-next-line',
			shouldGenerate: true,
			llmPrefix: prefix + _ln,
			llmSuffix: suffix,
			stopTokens: [`${_ln}${_ln}`]
		}
	}
	// if line ends with block-opening syntax, do multi-line starting on next line
	else if (prefixEndsWithBlockOpen && isLineSuffixEmpty) {
		return {
			predictionType: 'multi-line-start-on-next-line',
			shouldGenerate: true,
			llmPrefix: prefix + _ln,
			llmSuffix: suffix,
			stopTokens: [`${_ln}${_ln}`]
		}
	}
	// if the current line is empty, predict a single-line completion
	else if (isLineEmpty) {
		return {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: allLinebreakSymbols
		}
	}
	// if suffix is 3 or fewer characters, attempt to complete the line ignoring it
	else if (removeAllWhitespace(suffixToTheRightOfCursor).length <= 3) {
		const suffixLinesIgnoringThisLine = suffixLines.slice(1)
		const suffixStringIgnoringThisLine = suffixLinesIgnoringThisLine.length === 0
			? ''
			: _ln + suffixLinesIgnoringThisLine.join(_ln)
		return {
			predictionType: 'single-line-redo-suffix',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffixStringIgnoringThisLine,
			stopTokens: allLinebreakSymbols
		}
	}
	// else attempt to complete the middle of the line if there is a prefix
	else if (!isLinePrefixEmpty) {
		return {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: allLinebreakSymbols
		}
	}

	return {
		predictionType: 'do-not-predict',
		shouldGenerate: false,
		llmPrefix: prefix,
		llmSuffix: suffix,
		stopTokens: []
	}
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
	completionStr = applyStreamFilterPipeline(completionStr, suffix, lineBelowCursor, prefix)

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
		if (!isEnabled) { console.log('[AC] disabled in settings'); return [] }

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
				console.log('[AC] cache hit → returning cached completion')
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
		if (didTypingHappenDuringDebounce) { console.log('[AC] debounced — typing continued'); return [] }

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

		if (!shouldGenerate) { console.log('[AC] do-not-predict:', predictionType, '| prefixLeft:', JSON.stringify(prefixAndSuffix.prefixToTheLeftOfCursor.slice(-30)), '| suffixRight:', JSON.stringify(prefixAndSuffix.suffixToTheRightOfCursor.slice(0, 30))); return [] }
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

		const featureName: FeatureName = 'Autocomplete'
		const overridesOfModel = this._settingsService.state.overridesOfModel
		const modelSelection = this._settingsService.state.modelSelectionOfFeature[featureName]
		const modelSelectionOptions = modelSelection
			? this._settingsService.state.optionsOfModelSelection[featureName][modelSelection.providerName]?.[modelSelection.modelName]
			: undefined
		if (!modelSelection) console.warn('[AC] no model selected for Autocomplete feature — check settings')
		console.log('[AC] →', predictionType, '| model:', modelSelection ? `${modelSelection.providerName}/${modelSelection.modelName}` : 'none', '| prefixLen:', llmPrefix.length, '| suffixLen:', llmSuffix.length)

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
					console.log('[AC] LLM response received in', newAutocompletion.endTime - newAutocompletion.startTime, 'ms | raw length:', fullText.length, '| preview:', JSON.stringify(fullText.slice(0, 80)))

					let rawText = fullText

					// 1. Strip markdown fences (```language\n...\n```) that slipped through
					const [extracted] = extractCodeFromRegular({ text: rawText, recentlyAddedTextLen: 0 })
					rawText = extracted

					// 2. Strip <FILL_HERE> sentinel if the model echoed it back
					const afterExtract = rawText
					rawText = rawText.replace(/<FILL_HERE>/g, '')
					if (afterExtract !== rawText) console.log('[AC] stripped <FILL_HERE> sentinel')

					if (extracted !== fullText) console.log('[AC] stripped markdown fences | after:', JSON.stringify(rawText.slice(0, 60)))

					// 3. If the model echoed the full prefix before the completion, strip it.
					//    This happens when a chat model repeats the whole prompt in its reply.
					const trimmedPrefix = llmPrefix.trimEnd()
					if (rawText.startsWith(trimmedPrefix) && trimmedPrefix.length > 20) {
						rawText = rawText.slice(trimmedPrefix.length)
					}

					// 4. If the model started echoing the suffix, cut before it.
					const trimmedSuffix = llmSuffix.trimStart()
					if (trimmedSuffix.length > 10) {
						const suffixIdx = rawText.indexOf(trimmedSuffix)
						if (suffixIdx > 0) rawText = rawText.slice(0, suffixIdx)
					}

					// 5. Apply Continue-style stream filter pipeline (stop tokens, repeat detection, etc.)
					const beforeFilter = rawText
					const lineBelowCursor = getLineBelowCursor(suffix.split(_ln))
					rawText = applyStreamFilterPipeline(rawText, suffix, lineBelowCursor, prefix)
					if (beforeFilter !== rawText) console.log('[AC] stream filter changed output | before:', JSON.stringify(beforeFilter.slice(0, 60)), '→ after:', JSON.stringify(rawText.slice(0, 60)))

					newAutocompletion.insertText = processStartAndEndSpaces(rawText)
					if (newAutocompletion.type === 'multi-line-start-on-next-line') {
						newAutocompletion.insertText = _ln + newAutocompletion.insertText
					}
					if (!newAutocompletion.insertText.trim()) {
						console.warn('[AC] final insertText is empty — completion will not show')
					} else {
						console.log('[AC] ✓ final insertText:', JSON.stringify(newAutocompletion.insertText.slice(0, 80)))
					}
					resolve(newAutocompletion.insertText)
				},
				onError: ({ message }) => {
					newAutocompletion.endTime = Date.now()
					newAutocompletion.status = 'error'
					console.error('[AC] LLM error:', message)
					reject(message)
				},
				onAbort: () => { console.log('[AC] request aborted'); reject('Aborted autocomplete') },
			})
			newAutocompletion.requestId = requestId

			setTimeout(() => {
				if (newAutocompletion.status === 'pending') {
					console.error('[AC] TIMEOUT after', TIMEOUT_TIME, 'ms — LLM never responded. Check API key, network, and provider endpoint.')
					reject('Timeout receiving message to LLM.')
				}
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
						console.log('[AC] ✓ accepted completion id:', autocompletion.id, '| text:', JSON.stringify(autocompletion.insertText.slice(0, 60)))
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
