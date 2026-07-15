/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/


import { useAccessor, useCommandBarState, useIsDark } from '../util/services.js';

import '../styles.css'
import { useCallback, useEffect, useState, useRef } from 'react';
import { ScrollType } from '../../../../../../../editor/common/editorCommon.js';
import { acceptAllBg, acceptBorder, buttonFontSize, buttonTextColor, rejectAllBg, rejectBg, rejectBorder } from '../../../../common/helpers/colors.js';
import { LoopholeCommandBarProps } from '../../../voidCommandBarService.js';
import { Check, EllipsisVertical, Menu, MoveDown, MoveLeft, MoveRight, MoveUp, X } from 'lucide-react';
import {
	LOOPHOLE_GOTO_NEXT_DIFF_ACTION_ID,
	LOOPHOLE_GOTO_PREV_DIFF_ACTION_ID,
	LOOPHOLE_GOTO_NEXT_URI_ACTION_ID,
	LOOPHOLE_GOTO_PREV_URI_ACTION_ID,
	LOOPHOLE_ACCEPT_FILE_ACTION_ID,
	LOOPHOLE_REJECT_FILE_ACTION_ID,
	LOOPHOLE_ACCEPT_ALL_DIFFS_ACTION_ID,
	LOOPHOLE_REJECT_ALL_DIFFS_ACTION_ID
} from '../../../actionIDs.js';

export const LoopholeCommandBarMain = ({ uri, editor }: LoopholeCommandBarProps) => {
	const isDark = useIsDark()

	return <div
		className={`@@loophole-scope ${isDark ? 'dark' : ''}`}
	>
		<VoidCommandBar uri={uri} editor={editor} />
	</div>
}



export const AcceptAllButtonWrapper = ({ text, onClick, className, ...props }: { text: string, onClick: () => void, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		className={`
			px-3 py-1
			flex items-center gap-1
			text-white text-[11px] font-semibold text-nowrap
			cursor-pointer
			transition-opacity duration-150 hover:opacity-88
			${className}
		`}
		style={{
			backgroundColor: '#16a34a',
			color: 'white',
			border: 'none',
		}}
		type='button'
		onClick={onClick}
		{...props}
	>
		{text ? <span>{text}</span> : <Check size={14} />}
	</button>
)

export const RejectAllButtonWrapper = ({ text, onClick, className, ...props }: { text: string, onClick: () => void, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		className={`
			px-3 py-1
			flex items-center gap-1
			text-white text-[11px] font-semibold text-nowrap
			cursor-pointer
			transition-opacity duration-150 hover:opacity-88
			${className}
		`}
		style={{
			backgroundColor: '#dc2626',
			color: 'white',
			border: 'none',
		}}
		type='button'
		onClick={onClick}
		{...props}
	>
		{text ? <span>{text}</span> : <X size={14} />}
	</button>
)



export const VoidCommandBar = ({ uri, editor }: LoopholeCommandBarProps) => {
	const accessor = useAccessor()
	const editCodeService = accessor.get('IEditCodeService')
	const editorService = accessor.get('ICodeEditorService')
	const metricsService = accessor.get('IMetricsService')
	const commandService = accessor.get('ICommandService')
	const commandBarService = accessor.get('ILoopholeCommandBarService')
	const voidModelService = accessor.get('ILoopholeModelService')
	const keybindingService = accessor.get('IKeybindingService')
	const { stateOfURI: commandBarState, sortedURIs: sortedCommandBarURIs } = useCommandBarState()
	const [showAcceptRejectAllButtons, setShowAcceptRejectAllButtons] = useState(false)

	const _latestValidUriIdxRef = useRef<number | null>(null)

	const i_ = sortedCommandBarURIs.findIndex(e => e.fsPath === uri?.fsPath)
	const currFileIdx = i_ === -1 ? null : i_
	useEffect(() => {
		if (currFileIdx !== null) _latestValidUriIdxRef.current = currFileIdx
	}, [currFileIdx])

	const uriIdxInStepper = currFileIdx !== null ? currFileIdx
		: _latestValidUriIdxRef.current === null ? null
			: _latestValidUriIdxRef.current < sortedCommandBarURIs.length ? _latestValidUriIdxRef.current
				: null

	useEffect(() => {
		setTimeout(() => {
			if (!uri) return
			const s = commandBarService.stateOfURI[uri.fsPath]
			if (!s) return
			const { diffIdx } = s
			commandBarService.goToDiffIdx(diffIdx ?? 0)
		}, 50)
	}, [uri, commandBarService])

	if (uri?.scheme !== 'file') return null

	const currDiffIdx = uri ? commandBarState[uri.fsPath]?.diffIdx ?? null : null
	const sortedDiffIds = uri ? commandBarState[uri.fsPath]?.sortedDiffIds ?? [] : []
	const sortedDiffZoneIds = uri ? commandBarState[uri.fsPath]?.sortedDiffZoneIds ?? [] : []

	const isADiffInThisFile = sortedDiffIds.length !== 0
	const isADiffZoneInThisFile = sortedDiffZoneIds.length !== 0
	const isADiffZoneInAnyFile = sortedCommandBarURIs.length !== 0

	const streamState = uri ? commandBarService.getStreamState(uri) : null
	const showAcceptRejectAll = streamState === 'idle-has-changes'

	const nextDiffIdx = commandBarService.getNextDiffIdx(1)
	const prevDiffIdx = commandBarService.getNextDiffIdx(-1)
	const nextURIIdx = commandBarService.getNextUriIdx(1)
	const prevURIIdx = commandBarService.getNextUriIdx(-1)

	const upDownDisabled = prevDiffIdx === null || nextDiffIdx === null
	const leftRightDisabled = prevURIIdx === null || nextURIIdx === null

	const onAcceptFile = () => {
		if (!uri) return
		editCodeService.acceptOrRejectAllDiffAreas({ uri, behavior: 'accept', removeCtrlKs: false, _addToHistory: true })
		metricsService.capture('Accept File', {})
	}
	const onRejectFile = () => {
		if (!uri) return
		editCodeService.acceptOrRejectAllDiffAreas({ uri, behavior: 'reject', removeCtrlKs: false, _addToHistory: true })
		metricsService.capture('Reject File', {})
	}

	const onAcceptAll = () => {
		commandBarService.acceptOrRejectAllFiles({ behavior: 'accept' });
		metricsService.capture('Accept All', {})
		setShowAcceptRejectAllButtons(false);
	}

	const onRejectAll = () => {
		commandBarService.acceptOrRejectAllFiles({ behavior: 'reject' });
		metricsService.capture('Reject All', {})
		setShowAcceptRejectAllButtons(false);
	}

	const _upKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_PREV_DIFF_ACTION_ID);
	const _downKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_NEXT_DIFF_ACTION_ID);
	const _leftKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_PREV_URI_ACTION_ID);
	const _rightKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_NEXT_URI_ACTION_ID);
	const _acceptFileKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_ACCEPT_FILE_ACTION_ID);
	const _rejectFileKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_REJECT_FILE_ACTION_ID);
	const _acceptAllKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_ACCEPT_ALL_DIFFS_ACTION_ID);
	const _rejectAllKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_REJECT_ALL_DIFFS_ACTION_ID);

	const upKeybindLabel = editCodeService.processRawKeybindingText(_upKeybinding?.getLabel() || '');
	const downKeybindLabel = editCodeService.processRawKeybindingText(_downKeybinding?.getLabel() || '');
	const leftKeybindLabel = editCodeService.processRawKeybindingText(_leftKeybinding?.getLabel() || '');
	const rightKeybindLabel = editCodeService.processRawKeybindingText(_rightKeybinding?.getLabel() || '');
	const acceptFileKeybindLabel = editCodeService.processRawKeybindingText(_acceptFileKeybinding?.getAriaLabel() || '');
	const rejectFileKeybindLabel = editCodeService.processRawKeybindingText(_rejectFileKeybinding?.getAriaLabel() || '');
	const acceptAllKeybindLabel = editCodeService.processRawKeybindingText(_acceptAllKeybinding?.getAriaLabel() || '');
	const rejectAllKeybindLabel = editCodeService.processRawKeybindingText(_rejectAllKeybinding?.getAriaLabel() || '');

	if (!isADiffZoneInAnyFile) return null

	// Simplified bar when not on a changed file
	if (currFileIdx === null) {
		return (
			<div className="pointer-events-auto flex flex-col items-end gap-1.5">
				<div className="inline-flex rounded-lg overflow-hidden shadow-lg">
					<button
						className="text-xs font-semibold whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 hover:opacity-90 px-4 py-1.5 text-white"
						style={{ backgroundColor: '#16a34a', border: 'none' }}
						onClick={() => commandBarService.goToURIIdx(nextURIIdx)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								commandBarService.goToURIIdx(nextURIIdx);
							}
						}}
					>
						Next <MoveRight className='size-3' />
					</button>
				</div>
			</div>
		);
	}

	// Icon button style shared across nav buttons
	const iconBtnClass = "cursor-pointer flex items-center justify-center p-0.5 rounded opacity-70 hover:opacity-100 transition-opacity duration-150 disabled:opacity-30"

	return (
		<div className="pointer-events-auto flex flex-col items-end gap-1.5">

			{/* ── ROW 1: Accept File / Reject File (+ Accept All / Reject All popup) ── */}
			{showAcceptRejectAll && (
				<div className="flex items-center gap-1.5">

					{/* Accept All / Reject All popup — appears when ellipsis clicked */}
					{showAcceptRejectAllButtons && (
						<div className="inline-flex rounded-lg overflow-hidden shadow-lg">
							<AcceptAllButtonWrapper
								text="Accept All"
								data-tooltip-id='loophole-tooltip'
								data-tooltip-content={acceptAllKeybindLabel}
								data-tooltip-delay-show={500}
								onClick={onAcceptAll}
							/>
							<RejectAllButtonWrapper
								text="Reject All"
								data-tooltip-id='loophole-tooltip'
								data-tooltip-content={rejectAllKeybindLabel}
								data-tooltip-delay-show={500}
								onClick={onRejectAll}
							/>
						</div>
					)}

					{/* Main Accept File / Reject File buttons */}
					<div className="inline-flex rounded-lg overflow-hidden shadow-lg">
						<AcceptAllButtonWrapper
							text="Accept File"
							data-tooltip-id='loophole-tooltip'
							data-tooltip-content={acceptFileKeybindLabel}
							data-tooltip-delay-show={500}
							onClick={onAcceptFile}
						/>
						<RejectAllButtonWrapper
							text="Reject File"
							data-tooltip-id='loophole-tooltip'
							data-tooltip-content={rejectFileKeybindLabel}
							data-tooltip-delay-show={500}
							onClick={onRejectFile}
						/>
					</div>

				</div>
			)}

			{/* ── ROW 2: Diff nav + File nav ── */}
			<div className="inline-flex items-center bg-loophole-bg-2 border border-loophole-border-2 rounded-lg shadow-md overflow-hidden h-7">

				{/* Diff navigation */}
				<div className="flex items-center gap-0.5 px-2 border-r border-loophole-border-2 h-full">
					<button
						className={iconBtnClass}
						disabled={upDownDisabled}
						onClick={() => commandBarService.goToDiffIdx(prevDiffIdx)}
						onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToDiffIdx(prevDiffIdx); } }}
						data-tooltip-id="loophole-tooltip"
						data-tooltip-content={upKeybindLabel}
						data-tooltip-delay-show={500}
					>
						<MoveUp className='size-3' />
					</button>
					<button
						className={iconBtnClass}
						disabled={upDownDisabled}
						onClick={() => commandBarService.goToDiffIdx(nextDiffIdx)}
						onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToDiffIdx(nextDiffIdx); } }}
						data-tooltip-id="loophole-tooltip"
						data-tooltip-content={downKeybindLabel}
						data-tooltip-delay-show={500}
					>
						<MoveDown className='size-3' />
					</button>
					<span className={`text-xs whitespace-nowrap px-1 ${!isADiffInThisFile ? 'opacity-50' : ''}`}>
						{isADiffInThisFile
							? `Diff ${(currDiffIdx ?? 0) + 1} of ${sortedDiffIds.length}`
							: streamState === 'streaming' ? 'Streaming...' : 'No changes'
						}
					</span>
				</div>

				{/* File navigation */}
				<div className="flex items-center gap-0.5 px-2 h-full">
					<button
						className={iconBtnClass}
						disabled={leftRightDisabled}
						onClick={() => commandBarService.goToURIIdx(prevURIIdx)}
						onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToURIIdx(prevURIIdx); } }}
						data-tooltip-id="loophole-tooltip"
						data-tooltip-content={leftKeybindLabel}
						data-tooltip-delay-show={500}
					>
						<MoveLeft className='size-3' />
					</button>
					<button
						className={iconBtnClass}
						disabled={leftRightDisabled}
						onClick={() => commandBarService.goToURIIdx(nextURIIdx)}
						onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToURIIdx(nextURIIdx); } }}
						data-tooltip-id="loophole-tooltip"
						data-tooltip-content={rightKeybindLabel}
						data-tooltip-delay-show={500}
					>
						<MoveRight className='size-3' />
					</button>
					<span className="text-xs whitespace-nowrap px-1">
						{`File ${currFileIdx + 1} of ${sortedCommandBarURIs.length}`}
					</span>
				</div>

				{/* Ellipsis menu — only when accept/reject visible */}
				{showAcceptRejectAll && (
					<div className="border-l border-loophole-border-2 h-full flex items-center">
						<button
							className="cursor-pointer px-2 h-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-150"
							onClick={() => setShowAcceptRejectAllButtons(!showAcceptRejectAllButtons)}
						>
							<EllipsisVertical className="size-3" />
						</button>
					</div>
				)}

			</div>
		</div>
	)
}
