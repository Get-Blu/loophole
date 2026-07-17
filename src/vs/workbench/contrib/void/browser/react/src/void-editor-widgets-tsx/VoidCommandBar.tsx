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
        const metricsService = accessor.get('IMetricsService')
        const commandBarService = accessor.get('ILoopholeCommandBarService')
        const keybindingService = accessor.get('IKeybindingService')
        const { stateOfURI: commandBarState, sortedURIs: sortedCommandBarURIs } = useCommandBarState()
        const isDark = useIsDark()

        const _latestValidUriIdxRef = useRef<number | null>(null)

        const i_ = sortedCommandBarURIs.findIndex(e => e.fsPath === uri?.fsPath)
        const currFileIdx = i_ === -1 ? null : i_
        useEffect(() => {
                if (currFileIdx !== null) _latestValidUriIdxRef.current = currFileIdx
        }, [currFileIdx])

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
        const isADiffZoneInAnyFile = sortedCommandBarURIs.length !== 0

        const streamState = uri ? commandBarService.getStreamState(uri) : null
        const showAcceptReject = streamState === 'idle-has-changes'

        const nextDiffIdx = commandBarService.getNextDiffIdx(1)
        const prevDiffIdx = commandBarService.getNextDiffIdx(-1)
        const nextURIIdx = commandBarService.getNextUriIdx(1)
        const prevURIIdx = commandBarService.getNextUriIdx(-1)

        const upDownDisabled = prevDiffIdx === null && nextDiffIdx === null
        const leftRightDisabled = prevURIIdx === null && nextURIIdx === null

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

        const _acceptFileKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_ACCEPT_FILE_ACTION_ID)
        const _rejectFileKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_REJECT_FILE_ACTION_ID)
        const _upKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_PREV_DIFF_ACTION_ID)
        const _downKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_NEXT_DIFF_ACTION_ID)
        const _leftKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_PREV_URI_ACTION_ID)
        const _rightKeybinding = keybindingService.lookupKeybinding(LOOPHOLE_GOTO_NEXT_URI_ACTION_ID)

        const acceptFileKeybindLabel = editCodeService.processRawKeybindingText(_acceptFileKeybinding?.getAriaLabel() || '')
        const rejectFileKeybindLabel = editCodeService.processRawKeybindingText(_rejectFileKeybinding?.getAriaLabel() || '')
        const upKeybindLabel = editCodeService.processRawKeybindingText(_upKeybinding?.getLabel() || '')
        const downKeybindLabel = editCodeService.processRawKeybindingText(_downKeybinding?.getLabel() || '')
        const leftKeybindLabel = editCodeService.processRawKeybindingText(_leftKeybinding?.getLabel() || '')
        const rightKeybindLabel = editCodeService.processRawKeybindingText(_rightKeybinding?.getLabel() || '')

        if (!isADiffZoneInAnyFile) return null

        // Simplified bar when not on a changed file
        if (currFileIdx === null) {
                return (
                        <div className="pointer-events-auto flex flex-col items-end">
                                <button
                                        className="text-xs font-semibold cursor-pointer flex items-center gap-1 hover:opacity-90 text-white rounded-md"
                                        style={{ backgroundColor: '#16a34a', border: 'none', padding: '5px 22px' }}
                                        onClick={() => commandBarService.goToURIIdx(nextURIIdx)}
                                >
                                        Next <MoveRight className='size-3' />
                                </button>
                        </div>
                )
        }

        const borderColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)'
        const bgColor = isDark ? 'rgba(36,36,36,0.97)' : 'rgba(255,255,255,0.97)'
        const textColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)'
        const dividerColor = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.11)'

        const navBtnStyle: React.CSSProperties = {
                background: 'none',
                border: 'none',
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                opacity: 0.65,
                padding: 0,
                transition: 'opacity 0.12s',
        }

        return (
                <div className="pointer-events-auto flex flex-col items-end gap-1.5">

                        {/* Row 1: Accept File / Reject File — separate buttons, same total width */}
                        {showAcceptReject && (
                                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                        <button
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={acceptFileKeybindLabel}
                                                data-tooltip-delay-show={500}
                                                onClick={onAcceptFile}
                                                style={{
                                                        flex: 1,
                                                        backgroundColor: '#16a34a',
                                                        color: '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        padding: '5px 22px',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: '0 1px 5px rgba(0,0,0,0.35)',
                                                        transition: 'opacity 0.12s',
                                                }}
                                        >
                                                Accept File
                                        </button>
                                        <button
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={rejectFileKeybindLabel}
                                                data-tooltip-delay-show={500}
                                                onClick={onRejectFile}
                                                style={{
                                                        flex: 1,
                                                        backgroundColor: '#dc2626',
                                                        color: '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        padding: '5px 22px',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: '0 1px 5px rgba(0,0,0,0.35)',
                                                        transition: 'opacity 0.12s',
                                                }}
                                        >
                                                Reject File
                                        </button>
                                </div>
                        )}

                        {/* Row 2: Diff nav on top, File nav below — stacked in one box */}
                        <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                background: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: '8px',
                                boxShadow: '0 1px 5px rgba(0,0,0,0.35)',
                                overflow: 'hidden',
                        }}>
                                {/* Diff row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 10px', height: '28px' }}>
                                        <button
                                                style={navBtnStyle}
                                                disabled={upDownDisabled}
                                                onClick={() => commandBarService.goToDiffIdx(prevDiffIdx)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToDiffIdx(prevDiffIdx) } }}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={upKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveUp className='size-3.5' />
                                        </button>
                                        <button
                                                style={navBtnStyle}
                                                disabled={upDownDisabled}
                                                onClick={() => commandBarService.goToDiffIdx(nextDiffIdx)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToDiffIdx(nextDiffIdx) } }}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={downKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveDown className='size-3.5' />
                                        </button>
                                        <span style={{ fontSize: '11px', color: textColor, whiteSpace: 'nowrap', paddingLeft: '3px', opacity: isADiffInThisFile ? 1 : 0.5 }}>
                                                {isADiffInThisFile
                                                        ? `Diff ${(currDiffIdx ?? 0) + 1} of ${sortedDiffIds.length}`
                                                        : streamState === 'streaming' ? 'Streaming...' : 'No changes'
                                                }
                                        </span>
                                </div>

                                {/* Divider */}
                                <div style={{ height: '1px', backgroundColor: dividerColor }} />

                                {/* File row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 10px', height: '28px' }}>
                                        <button
                                                style={navBtnStyle}
                                                disabled={leftRightDisabled}
                                                onClick={() => commandBarService.goToURIIdx(prevURIIdx)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToURIIdx(prevURIIdx) } }}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={leftKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveLeft className='size-3.5' />
                                        </button>
                                        <button
                                                style={navBtnStyle}
                                                disabled={leftRightDisabled}
                                                onClick={() => commandBarService.goToURIIdx(nextURIIdx)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commandBarService.goToURIIdx(nextURIIdx) } }}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={rightKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveRight className='size-3.5' />
                                        </button>
                                        <span style={{ fontSize: '11px', color: textColor, whiteSpace: 'nowrap', paddingLeft: '3px' }}>
                                                {`File ${currFileIdx + 1} of ${sortedCommandBarURIs.length}`}
                                        </span>
                                </div>
                        </div>

                </div>
        )
}
