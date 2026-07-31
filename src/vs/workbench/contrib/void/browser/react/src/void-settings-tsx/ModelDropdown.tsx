/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeatureName, featureNames, isFeatureNameDisabled, ModelSelection, modelSelectionsEqual, ProviderName, providerNames, SettingsOfProvider } from '../../../../../../../workbench/contrib/void/common/voidSettingsTypes.js'
import { useSettingsState, useRefreshModelState, useAccessor } from '../util/services.js'
import { _VoidSelectBox, LoopholeCustomDropdownBox } from '../util/inputs.js'
import { ModelTag, getModelCapabilities } from '../../../../../../../workbench/contrib/void/common/modelCapabilities.js'
import { SelectBox } from '../../../../../../../base/browser/ui/selectBox/selectBox.js'
import { IconWarning } from '../sidebar-tsx/SidebarChat.js'
import { LOOPHOLE_OPEN_SETTINGS_ACTION_ID, LOOPHOLE_TOGGLE_SETTINGS_ACTION_ID } from '../../../voidSettingsPane.js'
import { modelFilterOfFeatureName, ModelOption } from '../../../../../../../workbench/contrib/void/common/voidSettingsService.js'
import { WarningBox } from './WarningBox.js'
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js'

const optionsEqual = (m1: ModelOption[], m2: ModelOption[]) => {
	if (m1.length !== m2.length) return false
	for (let i = 0; i < m1.length; i++) {
		if (!modelSelectionsEqual(m1[i].selection, m2[i].selection)) return false
	}
	return true
}

// Convert raw model ID to clean display name (UI only - doesn't affect backend model IDs)
const getCleanModelName = (modelName: string): string => {
	// Remove common prefixes/suffixes and clean up the name
	let clean = modelName
		// Remove provider prefixes like meta-llama/, anthropic/, etc.
		.replace(/^[^/]+\//, '')
		// Remove common suffixes
		.replace(/-instruct-turbo$/i, '')
		.replace(/-instruct$/i, '')
		.replace(/-preview$/i, '')
		.replace(/-latest$/i, '')
		.replace(/-\d{4}-\d{2}-\d{2}$/i, '') // date suffixes like -2024-06-01
		// Replace separators with spaces
		.replace(/-/g, ' ')
		.replace(/_/g, ' ')

	// Title case each word
	clean = clean
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ')

	return clean
}

// ── Tag icons
const TagIcons: Record<ModelTag, JSX.Element> = {
	beast:(
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
        	<path d="M6 1C5.5 2.5 4 3 4 5c0 1.5 1 2.5 2 3C8 7.5 9 6.5 9 5c0-2-1.5-2.5-2-4zM4.5 6.5C4.5 7.5 5.2 8.5 6 9c.8-.5 1.5-1.5 1.5-2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    	</svg>	
	),
	recommended: (
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
			<path d="M6 1l1.3 2.6L10 4.1l-2 2 .5 2.8L6 7.5l-2.5 1.4.5-2.8-2-2 2.7-.5L6 1z" fill="currentColor" />
		</svg>
	),
	fast: (
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
			<path d="M7 1L2 7h4l-1 4 5-6H6l1-4z" fill="currentColor" />
		</svg>
	),
	powerful: (
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
			<path d="M6 1C3.8 1 2 2.8 2 5c0 .8.3 1.6.7 2.2C2.3 7.7 2 8.3 2 9c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-.7-.3-1.3-.7-1.8C9.7 6.6 10 5.8 10 5c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
			<path d="M4 6.5c.6.5 1.4.5 2 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
		</svg>
	),
	cheap: (
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
			<circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
			<path d="M6 4v1m0 2v1m-1-2.5h1.5a.5.5 0 010 1H5.5a.5.5 0 000 1H7" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" />
		</svg>
	),
	free: (
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
			<rect x="1.5" y="4" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1" />
			<path d="M4.5 4c0-1 .7-2.5 1.5-2.5S7.5 3 7.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
			<path d="M6 4v6.5" stroke="currentColor" strokeWidth="1" />
			<path d="M1.5 6.5h9" stroke="currentColor" strokeWidth="1" />
		</svg>
	),
	slow: (
		<svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.8 }}>
			<circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
			<path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	),
}

const ModelTags = ({ tags, isSelected }: { tags: ModelTag[], isSelected: boolean }) => {
	if (!tags || tags.length === 0) return null
	return (
		<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
			{tags.map(tag => (
				<span
					key={tag}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 3,
						padding: '1px 5px',
						borderRadius: 3,
						fontSize: '9.5px',
						fontWeight: 500,
						letterSpacing: '0.02em',
						whiteSpace: 'nowrap',
						lineHeight: 1.6,
						color: isSelected ? 'rgba(255,255,255,0.55)' : '#71717a',
						background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(113,113,122,0.10)',
						border: `1px solid ${isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(113,113,122,0.18)'}`,
					}}
				>
					{TagIcons[tag]}
					{tag.charAt(0).toUpperCase() + tag.slice(1)}
				</span>
			))}
		</span>
	)
}

const getModelTags = (modelName: string, providerName: ProviderName): ModelTag[] => {
	try {
		const caps = getModelCapabilities(providerName, modelName, undefined)
		return caps.tags ?? []
	} catch {
		return []
	}
}

const ModelSelectBox = ({ options, featureName, className }: { options: ModelOption[], featureName: FeatureName, className: string }) => {
	const accessor = useAccessor()
	const voidSettingsService = accessor.get('ILoopholeSettingsService')

	const selection = voidSettingsService.state.modelSelectionOfFeature[featureName]
	const selectedOption = selection ? voidSettingsService.state._modelOptions.find(v => modelSelectionsEqual(v.selection, selection))! : options[0]

	const onChangeOption = useCallback((newOption: ModelOption) => {
		voidSettingsService.setModelSelectionOfFeature(featureName, newOption.selection)
	}, [voidSettingsService, featureName])

	return <LoopholeCustomDropdownBox
		options={options}
		selectedOption={selectedOption}
		onChangeOption={onChangeOption}
		getOptionDisplayName={(option) => getCleanModelName(option.selection.modelName)}
		getOptionDropdownName={(option) => getCleanModelName(option.selection.modelName)}
		getOptionDropdownDetail={(option) => option.selection.providerName}
		getOptionDropdownExtra={(option, isSelected) => {
			const tags = getModelTags(option.selection.modelName, option.selection.providerName)
			return tags.length > 0 ? <ModelTags tags={tags} isSelected={isSelected} /> : null
		}}
		getOptionsEqual={(a, b) => optionsEqual([a], [b])}
		className={className}
		matchInputWidth={false}
		showArrow={false}
		withSearch={true}
		getSearchString={(option) => `${option.selection.modelName} ${option.selection.providerName}`}
	/>
}


const MemoizedModelDropdown = ({ featureName, className }: { featureName: FeatureName, className: string }) => {
	const settingsState = useSettingsState()
	const oldOptionsRef = useRef<ModelOption[]>([])
	const [memoizedOptions, setMemoizedOptions] = useState(oldOptionsRef.current)

	const { filter, emptyMessage } = modelFilterOfFeatureName[featureName]

	useEffect(() => {
		const oldOptions = oldOptionsRef.current
		const newOptions = settingsState._modelOptions.filter((o) => filter(o.selection, { chatMode: settingsState.globalSettings.chatMode, overridesOfModel: settingsState.overridesOfModel }))

		if (!optionsEqual(oldOptions, newOptions)) {
			setMemoizedOptions(newOptions)
		}
		oldOptionsRef.current = newOptions
	}, [settingsState._modelOptions, filter])

	if (memoizedOptions.length === 0) { // Pretty sure this will never be reached unless filter is enabled
		return <WarningBox text={emptyMessage?.message || 'No models available'} />
	}

	return <ModelSelectBox featureName={featureName} options={memoizedOptions} className={className} />

}

export const ModelDropdown = ({ featureName, className }: { featureName: FeatureName, className: string }) => {
	const settingsState = useSettingsState()

	const accessor = useAccessor()
	const commandService = accessor.get('ICommandService')

	const openSettings = () => { commandService.executeCommand(LOOPHOLE_OPEN_SETTINGS_ACTION_ID); };


	const { emptyMessage } = modelFilterOfFeatureName[featureName]

	const isDisabled = isFeatureNameDisabled(featureName, settingsState)
	if (isDisabled)
		return <WarningBox onClick={openSettings} text={
			emptyMessage && emptyMessage.priority === 'always' ? emptyMessage.message :
				isDisabled === 'needToEnableModel' ? 'Enable a model'
					: isDisabled === 'addModel' ? 'Add a model'
						: (isDisabled === 'addProvider' || isDisabled === 'notFilledIn' || isDisabled === 'providerNotAutoDetected') ? 'Provider required'
							: 'Provider required'
		} />

	return <ErrorBoundary>
		<MemoizedModelDropdown featureName={featureName} className={className} />
	</ErrorBoundary>
}
