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
import { Check, EllipsisVertical, Menu, MoveDown, MoveLeft, MoveRight, MoveUp, X, Command, CornerDownLeft, Delete } from 'lucide-react';
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
                        <div className="pointer-events-auto" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', background: '#1c1c1c', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)', padding: '2px 4px', gap: '2px', height: '28px' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', padding: '0 4px', fontWeight: 500 }}>Next File</span>
                                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', padding: '0' }} onClick={() => commandBarService.goToURIIdx(nextURIIdx)}>
                                                <MoveRight className='size-3.5' />
                                        </button>
                                </div>
                        </div>
                )
        }

        // bar is always dark — colors are fixed

        const navBtnStyle: React.CSSProperties = {
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.72)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '5px',
                padding: 0,
                transition: 'background 0.1s',
                flexShrink: 0,
        }

        // shared pill style
        const pillStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                background: '#1c1c1c',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.09)',
                padding: '2px 4px',
                gap: '2px',
                height: '28px',
        }

        const vDividerStyle: React.CSSProperties = {
                width: '1px',
                height: '14px',
                background: 'rgba(255,255,255,0.1)',
                margin: '0 4px',
                flexShrink: 0,
        }

        const countLabelStyle: React.CSSProperties = {
                fontSize: '12px',
                color: 'rgba(255,255,255,0.75)',
                whiteSpace: 'nowrap',
                padding: '0 6px',
                fontWeight: 500,
        }

        return (
                // outer: full-width, flex row, centered — the overlay widget is already 100% wide
                <div className="pointer-events-auto" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>

                                {/* Left pill: diff nav + accept/reject */}
                                <div style={pillStyle}>

                                        {/* Up / count / Down */}
                                        <button
                                                style={navBtnStyle}
                                                disabled={upDownDisabled}
                                                onClick={() => commandBarService.goToDiffIdx(prevDiffIdx)}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={upKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveUp className='size-3.5' />
                                        </button>
                                        <span style={{ ...countLabelStyle, opacity: isADiffInThisFile ? 1 : 0.45 }}>
                                                {isADiffInThisFile
                                                        ? `${(currDiffIdx ?? 0) + 1} / ${sortedDiffIds.length}`
                                                        : streamState === 'streaming' ? 'Streaming...' : 'No changes'
                                                }
                                        </span>
                                        <button
                                                style={navBtnStyle}
                                                disabled={upDownDisabled}
                                                onClick={() => commandBarService.goToDiffIdx(nextDiffIdx)}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={downKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveDown className='size-3.5' />
                                        </button>

                                        {/* Accept / Reject — only when idle-has-changes */}
                                        {showAcceptReject && (
                                                <>
                                                        <div style={vDividerStyle} />

                                                        {/* Reject — dark gray */}
                                                        <button
                                                                data-tooltip-id="loophole-tooltip"
                                                                data-tooltip-content={rejectFileKeybindLabel}
                                                                data-tooltip-delay-show={500}
                                                                onClick={onRejectFile}
                                                                style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        background: '#333333',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        color: 'rgba(255,255,255,0.82)',
                                                                        fontSize: '12px',
                                                                        fontWeight: 500,
                                                                        padding: '0 10px',
                                                                        height: '22px',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        whiteSpace: 'nowrap',
                                                                        transition: 'background 0.1s',
                                                                        flexShrink: 0,
                                                                }}
                                                        >
                                                                <X size={11} />
                                                                Reject File
                                                        </button>

                                                        {/* 3px gap */}
                                                        <div style={{ width: '3px', flexShrink: 0 }} />

                                                        {/* Accept — bright white, primary */}
                                                        <button
                                                                data-tooltip-id="loophole-tooltip"
                                                                data-tooltip-content={acceptFileKeybindLabel}
                                                                data-tooltip-delay-show={500}
                                                                onClick={onAcceptFile}
                                                                style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        background: '#f0f0f0',
                                                                        border: '1px solid rgba(255,255,255,0.15)',
                                                                        color: '#111111',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        padding: '0 10px',
                                                                        height: '22px',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        whiteSpace: 'nowrap',
                                                                        transition: 'background 0.1s',
                                                                        flexShrink: 0,
                                                                }}
                                                        >
                                                                <Check size={11} />
                                                                Accept File
                                                        </button>
                                                </>
                                        )}
                                </div>

                                {/* Right pill: file nav */}
                                <div style={pillStyle}>
                                        <button
                                                style={navBtnStyle}
                                                disabled={leftRightDisabled}
                                                onClick={() => commandBarService.goToURIIdx(prevURIIdx)}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={leftKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveLeft className='size-3.5' />
                                        </button>
                                        <span style={countLabelStyle}>
                                                {`File ${currFileIdx + 1} / ${sortedCommandBarURIs.length}`}
                                        </span>
                                        <button
                                                style={navBtnStyle}
                                                disabled={leftRightDisabled}
                                                onClick={() => commandBarService.goToURIIdx(nextURIIdx)}
                                                data-tooltip-id="loophole-tooltip"
                                                data-tooltip-content={rightKeybindLabel}
                                                data-tooltip-delay-show={500}
                                        >
                                                <MoveRight className='size-3.5' />
                                        </button>
                                </div>

                        </div>
                </div>
        )
}
