/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { FeatureName, ModelSelectionOptions, OverridesOfModel, ProviderName } from './voidSettingsTypes.js';

export const defaultProviderSettings = {
	anthropic: {
		apiKey: '',
	},
	openAI: {
		apiKey: '',
	},
	deepseek: {
		apiKey: '',
	},
	ollama: {
		endpoint: 'http://127.0.0.1:11434',
	},
	vLLM: {
		endpoint: 'http://localhost:8000',
	},
	openRouter: {
		apiKey: '',
	},
	openAICompatible: {
		endpoint: '',
		apiKey: '',
		headersJSON: '{}', // default to {}
	},
	gemini: {
		apiKey: '',
	},
	groq: {
		apiKey: '',
	},
	xAI: {
		apiKey: '',
	},
	mistral: {
		apiKey: '',
	},
	lmStudio: {
		endpoint: 'http://localhost:1234',
	},
	liteLLM: { // https://docs.litellm.ai/docs/providers/openai_compatible
		endpoint: '',
	},
	googleVertex: { // google https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/call-vertex-using-openai-library
		region: 'us-west2',
		project: '',
	},
	microsoftAzure: { // microsoft Azure Foundry
		project: '', // really 'resource'
		apiKey: '',
		azureApiVersion: '2024-05-01-preview',
	},
	awsBedrock: {
		apiKey: '',
		region: 'us-east-1', // add region setting
		endpoint: '', // optionally allow overriding default
	},
	cohere: { // https://cohere.com
		apiKey: '',
	},
	perplexity: { // https://www.perplexity.ai/settings/api
		apiKey: '',
	},
	togetherAI: { // https://www.together.ai
		apiKey: '',
	},
	fireworksAI: { // https://fireworks.ai
		apiKey: '',
	},

	inception: { // https://docs.inceptionlabs.ai — Mercury Edit 2 is their autocomplete-optimized model
		apiKey: '',
	},

} as const

export const defaultModelsOfProvider = {
	openAI: [
	    'gpt-5.6-sol',
	    'gpt-5.6-terra',
	    'gpt-5.6-luna',
	    'gpt-5.5',
	    'gpt-5.4-pro',
	    'gpt-5.4',
	    'gpt-5.3-codex',
	    'o3',
	    'gpt-5.4-mini',
	    'gpt-4o',
	    'gpt-4o-mini',
	    'gpt-4.1-nano',
	],
	
	anthropic: [
		'claude-fable-5',
		'claude-opus-5',
		'claude-opus-4-8',
		'claude-opus-4-7',
		'claude-opus-4-6',
		'claude-sonnet-5',
		'claude-sonnet-4-6',
		'claude-haiku-4-5-20251001',
	],
	
	xAI: [
	    'grok-4.5',
	    'grok-4.20-reasoning',
	    'grok-4.3',
	    'grok-4.20-non-reasoning',
	    'grok-build-0.1',
	],
	
	gemini: [
	    'gemini-3.5-flash',
	    'gemini-3.6-flash',
	    'gemini-3.1-pro-preview',
	    'gemini-2.5-pro',
	    'gemini-3.1-flash-lite',
	],
	
	deepseek: [
		'deepseek-v4-pro',
		'deepseek-v4-flash',
	],
	
	ollama: [ // autodetected
	],
	vLLM: [ // autodetected
	],
	lmStudio: [],
	
	openRouter: [
		
	    // Anthropic
		'anthropic/claude-fable-5',
		'anthropic/claude-opus-5',
	    'anthropic/claude-opus-4-8',
	    'anthropic/claude-sonnet-5',
	    'anthropic/claude-sonnet-4-6',
	    'anthropic/claude-haiku-4-5',
		
	    // OpenAI
	    'openai/gpt-5.6-sol',
	    'openai/gpt-5.6-terra',
	    'openai/gpt-5.6-luna',
	    'openai/gpt-5.5',
	    'openai/gpt-oss-120b',
	    'openai/gpt-oss-20b',
		
	    // Google
		'google/gemini-3.6-flash',
	    'google/gemini-3.5-flash',
	    'google/gemini-3.1-pro-preview',
	    'google/gemini-3.1-flash-lite',
	    'google/gemma-4-31b-it',
	    'google/gemma-4-26b-a4b-it',
		
	    // DeepSeek
	    'deepseek/deepseek-v4-pro',
	    'deepseek/deepseek-v4-flash',
	    'deepseek/deepseek-r1',
		
	    // Meta Llama
	    'meta-llama/llama-4-maverick',
	    'meta-llama/llama-4-scout',
		
	    // xAI
	    'x-ai/grok-4.5',
	    'x-ai/grok-4.3',
		
	    // Mistral
	    'mistralai/mistral-large-latest',
	    'mistralai/magistral-medium-latest',
	    'mistralai/mistral-small-latest',
	    'mistralai/codestral-latest',
	    'mistralai/devstral-latest',
		
	    // Qwen
	    'qwen/qwen3.7-plus',
	    'qwen/qwen3.7-max',
	    'qwen/qwen3-235b-a22b',
	    'qwen/qwen3-32b',
	    'qwen/qwen3-coder-480b-a35b',
		
	    // Moonshot / Kimi
	    'moonshotai/kimi-k3',
		'moonshotai/kimi-k2.7-code',
	    'moonshotai/kimi-k2.6',
		
	    // ZhipuAI / GLM
	    'z-ai/glm-5.2',
		
	    // Xiaomi MiMo
	    'xiaomi/mimo-v2.5-pro',
	    'xiaomi/mimo-v2.5',
		
	    // Auto
	    'openrouter/auto',
	],
	
	groq: [
	    'openai/gpt-oss-120b',    
	    'qwen/qwen3.6-27b',     
	    'groq/compound',   
	    'llama-3.3-70b-versatile', 
	    'openai/gpt-oss-20b',   
	],
	
	mistral: [
	    'mistral-large-latest',
	    'magistral-medium-latest',
	    'devstral-latest',
	    'codestral-latest',
	    'mistral-small-latest',
	],
	
	openAICompatible: [],
	googleVertex: [],
	microsoftAzure: [],
	awsBedrock: [],
	liteLLM: [],
	
	cohere: [
	    'command-a-plus',   
	    'command-a',
	    'command-a-reasoning',
		'command-r',
	],
	
	perplexity: [
	    'sonar-pro',            
	    'sonar-reasoning-pro',
	    'sonar-deep-research',
	],
	
	togetherAI: [
	    'deepseek-ai/DeepSeek-V4-Pro',
	    'zai-org/GLM-5.2',
	    'MiniMaxAI/MiniMax-M3',   
	    'moonshotai/Kimi-K2.7-Code',
	    'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8',
	    'google/gemma-4-31B-it',
	    'openai/gpt-oss-20b',
	],
	
	fireworksAI: [
	    'accounts/fireworks/models/gpt-oss-120b',
	    'accounts/fireworks/models/deepseek-v4-pro',
	    'accounts/fireworks/models/glm-5p2',          
	    'accounts/fireworks/models/kimi-k2p7-code',    
	    'accounts/fireworks/models/kimi-k2-thinking',  
	    'accounts/fireworks/models/qwen3-coder-480b-a35b-instruct',
	    'accounts/fireworks/models/gemma-4-31b-it',  
	],

	inception: [
	    'mercury-edit-2',      // recommended for autocomplete — diffusion FIM model
	    'mercury-coder-small', // smaller/faster autocomplete model
	    'mercury-2',           // general chat/reasoning
	],


} as const satisfies Record<ProviderName, string[]>


export type LoopholeStaticModelInfo = { // not stateful
	// Loophole uses the information below to know how to handle each model.
	// for some examples, see openAIModelOptions and anthropicModelOptions (below).

	contextWindow: number; // input tokens
	reservedOutputTokenSpace: number | null; // reserve this much space in the context window for output, defaults to 4096 if null

	supportsSystemMessage: false | 'system-role' | 'developer-role' | 'separated'; // typically you should use 'system-role'. 'separated' means the system message is passed as a separate field (e.g. anthropic)
	specialToolFormat?: 'openai-style' | 'anthropic-style' | 'gemini-style', // typically you should use 'openai-style'. null means "can't call tools by default", and asks the LLM to output XML in agent mode
	supportsFIM: boolean; // whether the model was specifically designed for autocomplete or "FIM" ("fill-in-middle" format)

	additionalOpenAIPayload?: { [key: string]: string } // additional payload in the message body for requests that are openai-compatible (ollama, vllm, openai, openrouter, etc)

	// reasoning options
	reasoningCapabilities: false | {
		readonly supportsReasoning: true; // for clarity, this must be true if anything below is specified
		readonly canTurnOffReasoning: boolean; // whether or not the user can disable reasoning mode (false if the model only supports reasoning)
		readonly canIOReasoning: boolean; // whether or not the model actually outputs reasoning (eg o1 lets us control reasoning but not output it)
		readonly reasoningReservedOutputTokenSpace?: number; // overrides normal reservedOutputTokenSpace
		readonly reasoningSlider?:
		| undefined
		| { type: 'budget_slider'; min: number; max: number; default: number } // anthropic supports this (reasoning budget)
		| { type: 'effort_slider'; values: string[]; default: string } // openai-compatible supports this (reasoning effort)

		// if it's open source and specifically outputs think tags, put the think tags here and we'll parse them out (e.g. ollama)
		readonly openSourceThinkTags?: [string, string];

		// the only other field related to reasoning is "providerReasoningIOSettings", which varies by provider.
	};


	// --- below is just informative, not used in sending / receiving, cannot be customized in settings ---
	cost: {
		input: number;
		output: number;
		cache_read?: number;
		cache_write?: number;
	}
	downloadable: false | {
		sizeGb: number | 'not-known'
	}
}
// if you change the above type, remember to update the Settings link



export const modelOverrideKeys = [
	'contextWindow',
	'reservedOutputTokenSpace',
	'supportsSystemMessage',
	'specialToolFormat',
	'supportsFIM',
	'reasoningCapabilities',
	'additionalOpenAIPayload'
] as const

export type ModelOverrides = Pick<
	LoopholeStaticModelInfo,
	(typeof modelOverrideKeys)[number]
>




type ProviderReasoningIOSettings = {
	// include this in payload to get reasoning
	input?: { includeInPayload?: (reasoningState: SendableReasoningInfo) => null | { [key: string]: any }, };
	// nameOfFieldInDelta: reasoning output is in response.choices[0].delta[deltaReasoningField]
	// needsManualParse: whether we must manually parse out the <think> tags
	output?:
	| { nameOfFieldInDelta?: string, needsManualParse?: undefined, }
	| { nameOfFieldInDelta?: undefined, needsManualParse?: true, };
}

type LoopholeStaticProviderInfo = { // doesn't change (not stateful)
	providerReasoningIOSettings?: ProviderReasoningIOSettings; // input/output settings around thinking (allowed to be empty) - only applied if the model supports reasoning output
	modelOptions: { [key: string]: LoopholeStaticModelInfo };
	modelOptionsFallback: (modelName: string, fallbackKnownValues?: Partial<LoopholeStaticModelInfo>) => (LoopholeStaticModelInfo & { modelName: string, recognizedModelName: string }) | null;
}



const defaultModelOptions = {
	contextWindow: 256_000,
	reservedOutputTokenSpace: 4_096,
	cost: { input: 0, output: 0 },
	downloadable: false,
	supportsSystemMessage: false,
	supportsFIM: false,
	reasoningCapabilities: false,
} as const satisfies LoopholeStaticModelInfo

// TODO!!! double check all context sizes below
// TODO!!! add openrouter common models
// TODO!!! allow user to modify capabilities and tell them if autodetected model or falling back
const openSourceModelOptions_assumingOAICompat = {
	'deepseekR1': {
		supportsFIM: false,
		supportsSystemMessage: false,
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'deepseekCoderV3': {
		supportsFIM: false,
		supportsSystemMessage: false, // unstable
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'deepseekCoderV2': {
		supportsFIM: false,
		supportsSystemMessage: false, // unstable
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'codestral': {
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'devstral': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 131_000, reservedOutputTokenSpace: 8_192,
	},
	'openhands-lm-32b': { // https://www.all-hands.dev/blog/introducing-openhands-lm-32b----a-strong-open-coding-agent-model
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false, // built on qwen 2.5 32B instruct
		contextWindow: 128_000, reservedOutputTokenSpace: 4_096
	},

	// really only phi4-reasoning supports reasoning... simpler to combine them though
	'phi4': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 16_000, reservedOutputTokenSpace: 4_096,
	},

	'gemma': { // https://news.ycombinator.com/item?id=43451406
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	// llama 4 https://ai.meta.com/blog/llama-4-multimodal-intelligence/
	'llama4-scout': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 10_000_000, reservedOutputTokenSpace: 8_192,
	},
	'llama4-maverick': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 1_000_000, reservedOutputTokenSpace: 8_192,
	},
	'llama4-scout-thinking': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 10_000_000, reservedOutputTokenSpace: 32_768,
	},

	// llama 3
	'llama3': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'llama3.1': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'llama3.2': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'llama3.3': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	// qwen
	'qwen2.5coder': {
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 32_000, reservedOutputTokenSpace: 4_096,
	},
	'qwen3coder-480b': {
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 262_144, reservedOutputTokenSpace: 16_384,
	},
	'qwen3coder-30b': {
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 131_072, reservedOutputTokenSpace: 8_192,
	},
	'qwq': {
		supportsFIM: false, // no FIM, yes reasoning
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 128_000, reservedOutputTokenSpace: 8_192,
	},
	'qwen3': {
		supportsFIM: false, // replaces QwQ
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 32_768, reservedOutputTokenSpace: 8_192,
	},
	// FIM only
	'starcoder2': {
		supportsFIM: true,
		supportsSystemMessage: false,
		reasoningCapabilities: false,
		contextWindow: 128_000, reservedOutputTokenSpace: 8_192,

	},
	'codegemma:2b': {
		supportsFIM: true,
		supportsSystemMessage: false,
		reasoningCapabilities: false,
		contextWindow: 128_000, reservedOutputTokenSpace: 8_192,

	},
	'quasar': { // openrouter/quasar-alpha
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 1_000_000, reservedOutputTokenSpace: 32_000,
	}
} as const satisfies { [s: string]: Partial<LoopholeStaticModelInfo> }




// keep modelName, but use the fallback's defaults
const extensiveModelOptionsFallback: LoopholeStaticProviderInfo['modelOptionsFallback'] = (modelName, fallbackKnownValues) => {

	const lower = modelName.toLowerCase()

	const toFallback = <T extends { [s: string]: any },>(obj: T, recognizedModelName: string & keyof T)
		: LoopholeStaticModelInfo & { modelName: string, recognizedModelName: string } => {

		const opts = obj[recognizedModelName] as LoopholeStaticModelInfo
		const supportsSystemMessage = opts.supportsSystemMessage === 'separated'
			? 'system-role'
			: opts.supportsSystemMessage

		return {
			recognizedModelName,
			modelName,
			...opts,
			supportsSystemMessage: supportsSystemMessage,
			cost: opts.cost ?? { input: 0, output: 0 },
			downloadable: opts.downloadable ?? false,
			...fallbackKnownValues
		};
	}

	if (lower.includes('gemini') && (lower.includes('3.6') || lower.includes('3-6'))) return toFallback(geminiModelOptions, 'gemini-3.6-flash')
	if (lower.includes('gemini') && (lower.includes('3.5') || lower.includes('3-5')) && (lower.includes('lite') || lower.includes('flash-lite'))) return toFallback(geminiModelOptions, 'gemini-3.5-flash-lite')
	if (lower.includes('gemini') && (lower.includes('3.5') || lower.includes('3-5'))) return toFallback(geminiModelOptions, 'gemini-3.5-flash')
	if (lower.includes('gemini') && (lower.includes('3.1') || lower.includes('3-1')) && (lower.includes('lite') || lower.includes('flash-lite'))) return toFallback(geminiModelOptions, 'gemini-3.1-flash-lite')
	if (lower.includes('gemini') && (lower.includes('3.1') || lower.includes('3-1'))) return toFallback(geminiModelOptions, 'gemini-3.1-pro')
	if (lower.includes('gemini') && (lower.includes('2.5') || lower.includes('2-5'))) return toFallback(geminiModelOptions, 'gemini-2.5-pro-exp-03-25')

	if (lower.includes('claude-fable-5') || lower.includes('fable-5')) return toFallback(anthropicModelOptions, 'claude-fable-5')
	if (lower.includes('claude-opus-5') || (lower.includes('claude') && lower.includes('opus-5'))) return toFallback(anthropicModelOptions, 'claude-opus-5')
	if (lower.includes('claude-sonnet-5') || (lower.includes('claude') && lower.includes('sonnet-5'))) return toFallback(anthropicModelOptions, 'claude-sonnet-5')
	if (lower.includes('claude-opus-4-8') || lower.includes('claude-4-8')) return toFallback(anthropicModelOptions, 'claude-opus-4-8')
	if (lower.includes('claude-opus-4-7') || lower.includes('claude-4-7')) return toFallback(anthropicModelOptions, 'claude-opus-4-7')
	if (lower.includes('claude-opus-4-6') || (lower.includes('claude') && lower.includes('opus-4-6'))) return toFallback(anthropicModelOptions, 'claude-opus-4-6')
	if (lower.includes('claude-haiku-4-5') || (lower.includes('claude') && lower.includes('haiku-4-5'))) return toFallback(anthropicModelOptions, 'claude-haiku-4-5')
	if (lower.includes('claude-4-6') || lower.includes('claude-4.6')) return toFallback(anthropicModelOptions, 'claude-sonnet-4.6-20260217')
	if (lower.includes('claude-3-7') || lower.includes('claude-3.7')) return toFallback(anthropicModelOptions, 'claude-3-7-sonnet-20250219')
	if (lower.includes('claude-3-5') || lower.includes('claude-3.5')) return toFallback(anthropicModelOptions, 'claude-3-5-sonnet-20241022')
	if (lower.includes('claude')) return toFallback(anthropicModelOptions, 'claude-sonnet-4.6-20260217')

	if (lower.includes('grok-4.5') || lower.includes('grok4.5')) return toFallback(xAIModelOptions, 'grok-4.5')
	if (lower.includes('grok-4.20') && lower.includes('non-reasoning')) return toFallback(xAIModelOptions, 'grok-4.20-non-reasoning')
	if (lower.includes('grok-4.20') || lower.includes('grok4.20')) return toFallback(xAIModelOptions, 'grok-4.20-reasoning')
	if (lower.includes('grok-4.3') || lower.includes('grok4.3')) return toFallback(xAIModelOptions, 'grok-4.3')
	if (lower.includes('grok-4') || lower.includes('grok4')) return toFallback(xAIModelOptions, 'grok-4.5')
	if (lower.includes('grok3') || lower.includes('grok-3')) return toFallback(xAIModelOptions, 'grok-3')
	if (lower.includes('grok2') || lower.includes('grok-2')) return toFallback(xAIModelOptions, 'grok-2')
	if (lower.includes('grok')) return toFallback(xAIModelOptions, 'grok-4.5')

	if (lower.includes('deepseek-v4')) return toFallback(deepseekModelOptions, 'deepseek-v4')
	if (lower.includes('deepseek-v3')) return toFallback(deepseekModelOptions, 'deepseek-v3-0324')
	if (lower.includes('deepseek-r1') || lower.includes('deepseek-reasoner')) return toFallback(openSourceModelOptions_assumingOAICompat, 'deepseekR1')
	if (lower.includes('deepseek')) return toFallback(deepseekModelOptions, 'deepseek-v4')

	if (lower.includes('llama4') || lower.includes('scout')) return toFallback(openSourceModelOptions_assumingOAICompat, 'llama4-scout')
	if (lower.includes('llama4') || lower.includes('maverick')) return toFallback(openSourceModelOptions_assumingOAICompat, 'llama4-maverick')
	if (lower.includes('llama3.3')) return toFallback(openSourceModelOptions_assumingOAICompat, 'llama3.3')
	if (lower.includes('llama3.2')) return toFallback(openSourceModelOptions_assumingOAICompat, 'llama3.2')
	if (lower.includes('llama3.1')) return toFallback(openSourceModelOptions_assumingOAICompat, 'llama3.1')
	if (lower.includes('llama')) return toFallback(openSourceModelOptions_assumingOAICompat, 'llama4-scout')

	if (lower.includes('gpt') && (lower.includes('5.6') || lower.includes('5-6')) && lower.includes('sol')) return toFallback(openAIModelOptions, 'gpt-5.6-sol')
	if (lower.includes('gpt') && (lower.includes('5.6') || lower.includes('5-6')) && lower.includes('terra')) return toFallback(openAIModelOptions, 'gpt-5.6-terra')
	if (lower.includes('gpt') && (lower.includes('5.6') || lower.includes('5-6')) && lower.includes('luna')) return toFallback(openAIModelOptions, 'gpt-5.6-luna')
	if (lower.includes('gpt') && (lower.includes('5.6') || lower.includes('5-6'))) return toFallback(openAIModelOptions, 'gpt-5.6-sol')
	if (lower.includes('gpt') && (lower.includes('5.5') || lower.includes('5-5'))) return toFallback(openAIModelOptions, 'gpt-5.5')
	if (lower.includes('gpt') && (lower.includes('5.4') || lower.includes('5-4'))) return toFallback(openAIModelOptions, 'gpt-5.4-thinking')
	if (lower.includes('gpt') && (lower.includes('5.3') || lower.includes('5-3'))) return toFallback(openAIModelOptions, 'gpt-5.3-codex')
	if (lower.includes('gpt') && (lower.includes('4.1') || lower.includes('4-1'))) return toFallback(openAIModelOptions, 'gpt-4.1')

	if (lower.includes('o3') && lower.includes('mini')) return toFallback(openAIModelOptions, 'o3-mini')
	if (lower.includes('o3')) return toFallback(openAIModelOptions, 'o3')
	if (lower.includes('o4') && lower.includes('mini')) return toFallback(openAIModelOptions, 'o4-mini')
	if (lower.includes('o4')) return toFallback(openAIModelOptions, 'o4')

	if (lower.includes('qwen') && lower.includes('3') && lower.includes('coder') && (lower.includes('480') || lower.includes('a35b'))) return toFallback(openSourceModelOptions_assumingOAICompat, 'qwen3coder-480b')
	if (lower.includes('qwen') && lower.includes('3') && lower.includes('coder')) return toFallback(openSourceModelOptions_assumingOAICompat, 'qwen3coder-30b')
	if (lower.includes('qwen') && lower.includes('3')) return toFallback(openSourceModelOptions_assumingOAICompat, 'qwen3')
	if (lower.includes('qwen') && lower.includes('2.5') && lower.includes('coder')) return toFallback(openSourceModelOptions_assumingOAICompat, 'qwen2.5coder')

	if (lower.includes('mistral-large-3')) return toFallback(mistralModelOptions, 'mistral-large-3')

	if (Object.keys(openSourceModelOptions_assumingOAICompat).map(k => k.toLowerCase()).includes(lower))
		return toFallback(openSourceModelOptions_assumingOAICompat, lower as keyof typeof openSourceModelOptions_assumingOAICompat)

	return null
}






// ---------------- ANTHROPIC ----------------
const anthropicModelOptions = {
	// --- Dateless IDs (4.6 generation onwards — pinned snapshots, no date suffix) ---
	// https://platform.claude.com/docs/en/about-claude/models/overview
	'claude-fable-5': { // Flagship, released June 9 2026. $10/$50, 1M context, 128K output.
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 10.00, cache_read: 1.00, cache_write: 12.50, output: 50.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-opus-5': { // Released July 24 2026. $5/$25, 1M context, 128K output. Thinking on by default.
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 5.00, cache_read: 0.50, cache_write: 6.25, output: 25.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-sonnet-5': { // Released June 30 2026. Intro pricing $2/$10 through Aug 31 2026, then $3/$15. 1M context, 128K output.
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 2.00, cache_read: 0.20, cache_write: 2.50, output: 10.00 }, // intro pricing through Aug 31 2026
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-opus-4-8': { // 1M context, released May 2026
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 5.00, cache_read: 0.50, cache_write: 6.25, output: 25.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-opus-4-7': { // 1M context
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 5.00, cache_read: 0.50, cache_write: 6.25, output: 25.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-opus-4-6': { // 1M context
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 15.00, cache_read: 1.50, cache_write: 18.75, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-sonnet-4-6': { // 1M context
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 3.00, cache_read: 0.30, cache_write: 3.75, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	// --- Dated IDs (pre-4.6 generation) ---
	'claude-opus-4-5-20251101': { // 200k context
		contextWindow: 200_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 15.00, cache_read: 1.50, cache_write: 18.75, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-sonnet-4-5-20250929': { // 200k context
		contextWindow: 200_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 3.00, cache_read: 0.30, cache_write: 3.75, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider' as const, min: 1024, max: 32_768, default: 4096 },
		},
	},
	'claude-haiku-4-5-20251001': { // 200k context — was falling through to 128k default, now fixed
		contextWindow: 200_000,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 1.00, cache_read: 0.10, cache_write: 1.25, output: 5.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: false,
	},
	// alias without date (claude-haiku-4-5 → same as above)
	'claude-haiku-4-5': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 1.00, cache_read: 0.10, cache_write: 1.25, output: 5.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style' as const,
		supportsSystemMessage: 'separated' as const,
		reasoningCapabilities: false,
	},
	'claude-3-7-sonnet-20250219': { // https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 3.00, cache_read: 0.30, cache_write: 3.75, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
		},

	},
	'claude-opus-4.6-20260205': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 15.00, cache_read: 1.50, cache_write: 18.75, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
		},

	},
	'claude-sonnet-4.6-20260217': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 3.00, cache_read: 0.30, cache_write: 3.75, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 32_768,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
		},

	},
	'claude-opus-4-20250514': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 15.00, cache_read: 1.50, cache_write: 18.75, output: 30.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 8192, // can bump it to 128_000 with beta mode output-128k-2025-02-19
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 8192, default: 1024 }, // they recommend batching if max > 32_000. we cap at 8192 because above is typically not necessary (often even buggy)
		},

	},
	'claude-sonnet-4-20250514': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 3.00, cache_read: 0.30, cache_write: 3.75, output: 6.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 8192, // can bump it to 128_000 with beta mode output-128k-2025-02-19
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 8192, default: 1024 }, // they recommend batching if max > 32_000. we cap at 8192 because above is typically not necessary (often even buggy)
		},

	},
	'claude-3-5-sonnet-20241022': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 3.00, cache_read: 0.30, cache_write: 3.75, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: false,
	},
	'claude-3-5-haiku-20241022': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.80, cache_read: 0.08, cache_write: 1.00, output: 4.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: false,
	},
	'claude-3-opus-20240229': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 15.00, cache_read: 1.50, cache_write: 18.75, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: false,
	},
	'claude-3-sonnet-20240229': { // no point of using this, but including this for people who put it in
		contextWindow: 200_000, cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		reservedOutputTokenSpace: 4_096,
		supportsFIM: false,
		specialToolFormat: 'anthropic-style',
		supportsSystemMessage: 'separated',
		reasoningCapabilities: false,
	}
} as const satisfies { [s: string]: LoopholeStaticModelInfo }

const anthropicSettings: LoopholeStaticProviderInfo = {
	providerReasoningIOSettings: {
		input: {
			includeInPayload: (reasoningInfo) => {
				if (!reasoningInfo?.isReasoningEnabled) return null

				if (reasoningInfo.type === 'budget_slider_value') {
					return { thinking: { type: 'enabled', budget_tokens: reasoningInfo.reasoningBudget } }
				}
				return null
			}
		},
	},
	modelOptions: anthropicModelOptions,
	modelOptionsFallback: (modelName) => {
		const lower = modelName.toLowerCase()
		let fallbackName: keyof typeof anthropicModelOptions | null = null

		// Claude 5.x models
		if (lower.includes('claude-fable-5') || lower.includes('fable-5')) fallbackName = 'claude-fable-5'
		else if (lower.includes('claude-opus-5') || lower.includes('opus-5')) fallbackName = 'claude-opus-5'
		else if (lower.includes('claude-sonnet-5') || lower.includes('sonnet-5')) fallbackName = 'claude-sonnet-5'

		// Claude 4.x dateless IDs (4.6 generation onwards — 1M context)
		else if (lower.includes('claude-opus-4-8') || lower.includes('claude-4-8-opus')) fallbackName = 'claude-opus-4-8'
		else if (lower.includes('claude-opus-4-7') || lower.includes('claude-4-7-opus')) fallbackName = 'claude-opus-4-7'
		else if (lower.includes('claude-opus-4-6') || lower.includes('claude-4-6-opus')) fallbackName = 'claude-opus-4-6'
		else if (lower.includes('claude-sonnet-4-6') || lower.includes('claude-4-6-sonnet')) fallbackName = 'claude-sonnet-4-6'

		// Claude 4.x dated IDs (pre-4.6 — 200k context)
		else if (lower.includes('claude-opus-4-5') || lower.includes('claude-4-5-opus')) fallbackName = 'claude-opus-4-5-20251101'
		else if (lower.includes('claude-sonnet-4-5') || lower.includes('claude-4-5-sonnet')) fallbackName = 'claude-sonnet-4-5-20250929'
		else if (lower.includes('claude-haiku-4-5') || lower.includes('claude-4-5-haiku')) fallbackName = 'claude-haiku-4-5-20251001'

		// Generic claude-opus-4 / claude-sonnet-4 fallback (200k)
		else if (lower.includes('claude-opus-4') || lower.includes('claude-4-opus')) fallbackName = 'claude-opus-4-20250514'
		else if (lower.includes('claude-sonnet-4') || lower.includes('claude-4-sonnet')) fallbackName = 'claude-sonnet-4-20250514'

		// Claude 3.x
		else if (lower.includes('claude-3-7-sonnet')) fallbackName = 'claude-3-7-sonnet-20250219'
		else if (lower.includes('claude-3-5-sonnet')) fallbackName = 'claude-3-5-sonnet-20241022'
		else if (lower.includes('claude-3-5-haiku')) fallbackName = 'claude-3-5-haiku-20241022'
		else if (lower.includes('claude-3-opus')) fallbackName = 'claude-3-opus-20240229'
		else if (lower.includes('claude-3-sonnet')) fallbackName = 'claude-3-sonnet-20240229'

		if (fallbackName) return { modelName: fallbackName, recognizedModelName: fallbackName, ...anthropicModelOptions[fallbackName] }
		return null
	},
}


// ---------------- OPENAI ----------------
const openAIModelOptions = { // https://platform.openai.com/docs/pricing
	// GPT-5.x family — 1_050_000 context (ModelWalk: openai.json)
	// Released July 9, 2026. All three share 1.05M context / 128K output. Sol=$5/$30, Terra=$2.50/$15, Luna=$1/$6.
	'gpt-5.6-sol': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 5.00, output: 30.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'gpt-5.6-terra': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 2.50, output: 15.00, cache_read: 0.25 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'medium' } },
	},
	'gpt-5.6-luna': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 1.00, output: 6.00, cache_read: 0.10 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'gpt-5.5': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 5.00, output: 30.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'gpt-5.4': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 5.00, output: 30.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'gpt-5.4-pro': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 15.00, output: 60.00, cache_read: 3.75 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'gpt-5.4-mini': {
		contextWindow: 400_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 0.50, output: 2.00, cache_read: 0.05 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'medium' } },
	},
	'gpt-5.4-thinking': {
		contextWindow: 1_050_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 15.00, output: 60.00, cache_read: 3.75 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'gpt-5.3-codex': {
		contextWindow: 400_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 8.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: false,
	},
	// OSS models — 131_072 context (ModelWalk: fireworks.json)
	'gpt-oss-120b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.50, output: 2.00 },
		downloadable: { sizeGb: 70 },
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'gpt-oss-20b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.40 },
		downloadable: { sizeGb: 12 },
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	// o-series — 200_000 context (ModelWalk: openai.json)
	'o3': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 50_000,
		cost: { input: 10.00, output: 40.00, cache_read: 2.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'o4': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 50_000,
		cost: { input: 2.00, output: 8.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'medium' } },
	},
	'o4-mini': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 50_000,
		cost: { input: 1.10, output: 4.40, cache_read: 0.275 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'gpt-4.1': {
		contextWindow: 1_047_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 8.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: false,
	},
	'gpt-4.1-mini': {
		contextWindow: 1_047_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.40, output: 1.60, cache_read: 0.10 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: false,
	},
	'gpt-4.1-nano': {
		contextWindow: 1_047_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.10, output: 0.40, cache_read: 0.03 },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: false,
	},
	'o1': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 100_000,
		cost: { input: 15.00, cache_read: 7.50, output: 60.00, },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'o3-mini': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 100_000,
		cost: { input: 1.10, cache_read: 0.55, output: 4.40, },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'developer-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'gpt-4o': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 2.50, cache_read: 1.25, output: 10.00, },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'o1-mini': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 1.10, cache_read: 0.55, output: 4.40, },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: false, // does not support any system
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'gpt-4o-mini': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 0.15, cache_read: 0.075, output: 0.60, },
		downloadable: false,
		supportsFIM: false,
		specialToolFormat: 'openai-style',
		supportsSystemMessage: 'system-role', // ??
		reasoningCapabilities: false,
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }


// https://platform.openai.com/docs/guides/reasoning?api-mode=chat
const openAICompatIncludeInPayloadReasoning = (reasoningInfo: SendableReasoningInfo) => {
	if (!reasoningInfo?.isReasoningEnabled) return null
	if (reasoningInfo.type === 'effort_slider_value') {
		return { reasoning_effort: reasoningInfo.reasoningEffort }
	}
	return null

}

const openAISettings: LoopholeStaticProviderInfo = {
	modelOptions: openAIModelOptions,
	modelOptionsFallback: (modelName) => {
		const lower = modelName.toLowerCase()
		let fallbackName: keyof typeof openAIModelOptions | null = null
		if (lower.includes('gpt-5.6') && lower.includes('sol')) fallbackName = 'gpt-5.6-sol'
		else if (lower.includes('gpt-5.6') && lower.includes('terra')) fallbackName = 'gpt-5.6-terra'
		else if (lower.includes('gpt-5.6') && lower.includes('luna')) fallbackName = 'gpt-5.6-luna'
		else if (lower.includes('gpt-5.6')) fallbackName = 'gpt-5.6-sol'
		else if (lower.includes('gpt-5.5')) fallbackName = 'gpt-5.5'
		else if (lower.includes('gpt-5.4') && lower.includes('pro')) fallbackName = 'gpt-5.4-pro'
		else if (lower.includes('gpt-5.4') && lower.includes('mini')) fallbackName = 'gpt-5.4-mini'
		else if (lower.includes('gpt-5.4')) fallbackName = 'gpt-5.4'
		else if (lower.includes('gpt-5.3')) fallbackName = 'gpt-5.3-codex'
		else if (lower.includes('gpt-oss-120b')) fallbackName = 'gpt-oss-120b'
		else if (lower.includes('gpt-oss-20b')) fallbackName = 'gpt-oss-20b'
		else if (lower.includes('o4-mini')) fallbackName = 'o4-mini'
		else if (lower.includes('o4')) fallbackName = 'o4'
		else if (lower.includes('o3-mini')) fallbackName = 'o3-mini'
		else if (lower.includes('o3')) fallbackName = 'o3'
		else if (lower.includes('o1-mini')) fallbackName = 'o1-mini'
		else if (lower.includes('o1')) fallbackName = 'o1'
		else if (lower.includes('gpt-4.1') && lower.includes('mini')) fallbackName = 'gpt-4.1-mini'
		else if (lower.includes('gpt-4.1') && lower.includes('nano')) fallbackName = 'gpt-4.1-nano'
		else if (lower.includes('gpt-4.1')) fallbackName = 'gpt-4.1'
		else if (lower.includes('gpt-4o-mini')) fallbackName = 'gpt-4o-mini'
		else if (lower.includes('gpt-4o')) fallbackName = 'gpt-4o'
		if (fallbackName) return { modelName: fallbackName, recognizedModelName: fallbackName, ...openAIModelOptions[fallbackName] }
		return null
	},
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
	},
}

// ---------------- XAI ----------------
const xAIModelOptions = {
	// https://docs.x.ai/docs/guides/reasoning#reasoning
	// https://docs.x.ai/docs/models#models-and-pricing
	'grok-2': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: null,
		cost: { input: 2.00, output: 10.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: false,
	},
	'grok-3': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: null,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: false,
	},
	'grok-3-fast': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: null,
		cost: { input: 5.00, output: 25.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: false,
	},
	// only mini supports thinking
	'grok-3-mini': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: null,
		cost: { input: 0.30, output: 0.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'high'], default: 'low' } },
	},
	'grok-3-mini-fast': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: null,
		cost: { input: 0.60, output: 4.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'high'], default: 'low' } },
	},
	// grok-4.x family — 200_000 context (ModelWalk: xai.json)
	'grok-4.5': { // Released July 8, 2026. 500K context, $2/$6 per 1M. Configurable reasoning.
		contextWindow: 500_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 6.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'grok-build': { // grok-build-0.1: 256K context, $1/$2 per 1M. Code-focused agent model.
		contextWindow: 256_000,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 1.00, output: 2.00, cache_read: 0.20 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: false,
	},
	'grok-4.3': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 20_000,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'grok-4.3-latest': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 20_000,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'grok-4.20-reasoning': {
		contextWindow: 2_000_000,
		reservedOutputTokenSpace: 20_000,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'grok-4.20-non-reasoning': { // non-reasoning variant of grok-4.20 — 2M context
		contextWindow: 2_000_000,
		reservedOutputTokenSpace: 20_000,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: false,
	},
	'grok-4.1-fast-reasoning': {
		contextWindow: 2_000_000,
		reservedOutputTokenSpace: 20_000,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		specialToolFormat: 'openai-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: false, canIOReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'medium' } },
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }

const xAISettings: LoopholeStaticProviderInfo = {
	modelOptions: xAIModelOptions,
	modelOptionsFallback: (modelName) => {
		const lower = modelName.toLowerCase()
		let fallbackName: keyof typeof xAIModelOptions | null = null
		if (lower.includes('grok-2')) fallbackName = 'grok-2'
		else if (lower.includes('grok-4.5')) fallbackName = 'grok-4.5'
		else if (lower.includes('grok-4.20') && lower.includes('non-reasoning')) fallbackName = 'grok-4.20-non-reasoning'
		else if (lower.includes('grok-4.20') && lower.includes('reasoning')) fallbackName = 'grok-4.20-reasoning'
		else if (lower.includes('grok-4.20')) fallbackName = 'grok-4.20-reasoning'
		else if (lower.includes('grok-4')) fallbackName = 'grok-4.3'
		else if (lower.includes('grok-build')) fallbackName = 'grok-build'
		else if (lower.includes('grok-3-mini')) fallbackName = 'grok-3-mini'
		else if (lower.includes('grok-3')) fallbackName = 'grok-3'
		else if (lower.includes('grok')) fallbackName = 'grok-4.5'
		if (fallbackName) return { modelName: fallbackName, recognizedModelName: fallbackName, ...xAIModelOptions[fallbackName] }
		return null
	},
	// same implementation as openai
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
	},
}


// ---------------- GEMINI ----------------
const geminiModelOptions = { // https://ai.google.dev/gemini-api/docs/pricing
	// Gemini 3.6 Flash — released July 21 2026. 1M context, 65K output. $1.50/$7.50.
	'gemini-3.6-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 1.50, output: 7.50, cache_read: 0.15 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 }, reasoningReservedOutputTokenSpace: 32_768 },
	},
	// Gemini 3.5 Flash — released May 19 2026. 1M context, 65K output. $1.50/$9.
	'gemini-3.5-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 1.50, output: 9.00, cache_read: 0.15 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 }, reasoningReservedOutputTokenSpace: 32_768 },
	},
	// Gemini 3.5 Flash-Lite — released July 21 2026. 1M context, 65K output. $0.30/$2.50. ~462 t/s.
	'gemini-3.5-flash-lite': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 0.30, output: 2.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: false,
	},
	// Gemini 2.5 Pro — legacy, retiring Oct 16 2026. 1M context. $1.25/$10 (≤200K); $2.50/$15 above.
	'gemini-2.5-pro': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 1.25, output: 10.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
			reasoningReservedOutputTokenSpace: 32_768,
		},
	},
	// Gemini 2.5 Flash — legacy, retiring Oct 16 2026. 1M context, $0.15/$1.25.
	'gemini-2.5-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.15, output: 1.25 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
			reasoningReservedOutputTokenSpace: 32_768,
		},
	},
	// Gemini 3.1 Pro — released Feb 19, 2026. 1M context, 66K output, $2/$12 (up to 200K); $4/$18 above.
	// gemini-3.1-pro-preview is the alias used in defaultModelsOfProvider
	'gemini-3.1-pro-preview': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 2.00, output: 12.00, cache_read: 0.20 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
			reasoningReservedOutputTokenSpace: 32_768,
		},
	},
	'gemini-3.1-pro': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 2.00, output: 12.00, cache_read: 0.20 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
			reasoningReservedOutputTokenSpace: 32_768,
		},
	},
	// Gemini 3.1 Flash-Lite — released May 7 2026. 1M context. $0.125/$0.75.
	'gemini-3.1-flash-lite': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.125, output: 0.75 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: false,
	},
	'gemini-3-deep-think': {
		contextWindow: 2_000_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: false,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 4096, max: 65_536, default: 8192 },
			reasoningReservedOutputTokenSpace: 65_536,
		},
	},
	'gemini-2.5-pro-exp-03-25': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: false,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 8192, default: 1024 }, // max is really 24576
			reasoningReservedOutputTokenSpace: 8192,
		},
	},
	'gemini-2.0-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.40 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: false,
	},
	'gemini-2.0-flash-lite': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.075, output: 0.30 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: false,
	},
	'gemini-1.5-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.075, output: 0.30 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: false,
	},
	'gemini-1.5-pro': {
		contextWindow: 2_097_152,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 1.25, output: 5.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'separated',
		specialToolFormat: 'gemini-style',
		reasoningCapabilities: false,
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }

const geminiSettings: LoopholeStaticProviderInfo = {
	modelOptions: geminiModelOptions,
	modelOptionsFallback: (modelName) => {
		const lower = modelName.toLowerCase()
		let fallbackName: keyof typeof geminiModelOptions | null = null
		if (lower.includes('gemini') && lower.includes('3.6')) fallbackName = 'gemini-3.6-flash'
		else if (lower.includes('gemini') && lower.includes('3.5') && lower.includes('lite')) fallbackName = 'gemini-3.5-flash-lite'
		else if (lower.includes('gemini') && lower.includes('3.5')) fallbackName = 'gemini-3.5-flash'
		else if (lower.includes('gemini') && lower.includes('3.1') && lower.includes('lite')) fallbackName = 'gemini-3.1-flash-lite'
		else if (lower.includes('gemini') && lower.includes('3.1')) fallbackName = 'gemini-3.1-pro'
		else if (lower.includes('gemini') && lower.includes('3')) fallbackName = 'gemini-3-deep-think'
		else if (lower.includes('gemini') && lower.includes('2.5') && lower.includes('flash')) fallbackName = 'gemini-2.5-flash'
		else if (lower.includes('gemini') && lower.includes('2.5')) fallbackName = 'gemini-2.5-pro'
		else if (lower.includes('gemini') && lower.includes('2.0') && lower.includes('lite')) fallbackName = 'gemini-2.0-flash-lite'
		else if (lower.includes('gemini') && lower.includes('2.0')) fallbackName = 'gemini-2.0-flash'
		else if (lower.includes('gemini') && lower.includes('1.5') && lower.includes('flash')) fallbackName = 'gemini-1.5-flash'
		else if (lower.includes('gemini') && lower.includes('1.5')) fallbackName = 'gemini-1.5-pro'
		if (fallbackName) return { modelName: fallbackName, recognizedModelName: fallbackName, ...geminiModelOptions[fallbackName] }
		return null
	},
}



// ---------------- DEEPSEEK API ----------------
const deepseekModelOptions = {
	// DeepSeek V4 — 1_000_000 context (ModelWalk: deepseek.json)
	'deepseek-v4-pro': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 1_048_576, reservedOutputTokenSpace: 32_768,
		cost: { input: .435, output: .87 },
		downloadable: false,
	},
	'deepseek-v4-flash': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 1_048_576, reservedOutputTokenSpace: 32_768,
		cost: { input: .14, output: .28 },
		downloadable: false,
	},
	'deepseek-v4': { // generic fallback for any deepseek-v4 variant
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
		contextWindow: 1_048_576, reservedOutputTokenSpace: 32_768,
		cost: { input: .27, output: 1.10 },
		downloadable: false,
	},
	'deepseek-v3-0324': {
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
		contextWindow: 64_000, reservedOutputTokenSpace: 8_192,
		cost: { input: .14, output: .55 },
		downloadable: false,
	},
	'deepseek-chat': {
		...openSourceModelOptions_assumingOAICompat.deepseekCoderV3,
		contextWindow: 128_000, // https://api-docs.deepseek.com/quick_start/pricing
		reservedOutputTokenSpace: 8_000,
		cost: { cache_read: .07, input: .27, output: 1.10, },
		downloadable: false,
		reasoningCapabilities: false, // deepseek-chat is the non-reasoning V3 model
	},
	'deepseek-reasoner': {
		...openSourceModelOptions_assumingOAICompat.deepseekCoderV2,
		contextWindow: 64_000,
		reservedOutputTokenSpace: 8_000, // 8_000,
		cost: { cache_read: .14, input: .55, output: 2.19, },
		downloadable: false,
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }


const deepseekSettings: LoopholeStaticProviderInfo = {
	modelOptions: deepseekModelOptions,
	modelOptionsFallback: (modelName) => { return null },
	providerReasoningIOSettings: {
		// reasoning: OAICompat +  response.choices[0].delta.reasoning_content // https://api-docs.deepseek.com/guides/reasoning_model
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		output: { nameOfFieldInDelta: 'reasoning_content' },
	},
}



// ---------------- MISTRAL ----------------

const mistralModelOptions = { // https://mistral.ai/products/la-plateforme#pricing https://docs.mistral.ai/getting-started/models/models_overview/#premier-models
	'mistral-large-2411': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 6.00 },
		supportsFIM: false,
		downloadable: { sizeGb: 73 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistral-large-3': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 6.00 },
		supportsFIM: false,
		downloadable: { sizeGb: 73 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'ministral-14b-latest': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.10 },
		supportsFIM: false,
		downloadable: { sizeGb: 8 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'devstral-small-2-latest': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		supportsFIM: false,
		downloadable: { sizeGb: 14 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistral-large-latest': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 2.00, output: 6.00 },
		supportsFIM: false,
		downloadable: { sizeGb: 73 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistral-medium-latest': { // https://openrouter.ai/mistralai/mistral-medium-3
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.40, output: 2.00 },
		supportsFIM: false,
		downloadable: { sizeGb: 'not-known' },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'codestral-latest': {
		contextWindow: 256_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.30, output: 0.90 },
		supportsFIM: true,
		downloadable: { sizeGb: 13 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'magistral-medium-latest': {
		contextWindow: 256_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.30, output: 0.90 }, // TODO: check this
		supportsFIM: false,
		downloadable: { sizeGb: 13 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: false, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'magistral-small-latest': { // 131_072 context (ModelWalk: mistral.json)
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.50, output: 1.50 },
		supportsFIM: false,
		downloadable: { sizeGb: 13 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: false, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'devstral-small-2507': { // alias used in defaultModelsOfProvider
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		supportsFIM: false,
		downloadable: { sizeGb: 14 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'ministral-14b-2512': { // alias used in defaultModelsOfProvider — 131_072 context (ModelWalk: mistral.json)
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.10 },
		supportsFIM: false,
		downloadable: { sizeGb: 8 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'devstral-small-latest': { //https://openrouter.ai/mistralai/devstral-small:free
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		supportsFIM: false,
		downloadable: { sizeGb: 14 }, //https://ollama.com/library/devstral
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'ministral-8b-latest': { // ollama 'mistral'
		contextWindow: 131_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.10, output: 0.10 },
		supportsFIM: false,
		downloadable: { sizeGb: 4.1 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'ministral-3b-latest': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.04, output: 0.04 },
		supportsFIM: false,
		downloadable: { sizeGb: 'not-known' },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	// aliases used in defaultModelsOfProvider
	'devstral-latest': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		supportsFIM: false,
		downloadable: { sizeGb: 14 },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistral-small-latest': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.10, output: 0.30 },
		supportsFIM: false,
		downloadable: { sizeGb: 'not-known' },
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }

const mistralSettings: LoopholeStaticProviderInfo = {
	modelOptions: mistralModelOptions,
	modelOptionsFallback: (modelName) => { return null },
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
	},
}


// ---------------- GROQ ----------------
const groqModelOptions = { // https://console.groq.com/docs/models, https://groq.com/pricing/
	'llama-3.3-70b-versatile': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 32_768, // 32_768,
		cost: { input: 0.59, output: 0.79 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'llama-3.1-8b-instant': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.05, output: 0.08 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen-2.5-coder-32b': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: null, // not specified?
		cost: { input: 0.79, output: 0.79 },
		downloadable: false,
		supportsFIM: false, // unfortunately looks like no FIM support on groq
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen-qwq-32b': { // https://huggingface.co/Qwen/QwQ-32B
		contextWindow: 128_000,
		reservedOutputTokenSpace: null, // not specified?
		cost: { input: 0.29, output: 0.39 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: false, openSourceThinkTags: ['<think>', '</think>'] }, // we're using reasoning_format:parsed so really don't need to know openSourceThinkTags
	},
	// Groq-hosted models from defaultModelsOfProvider — 131_072 context (ModelWalk: groq.json)
	'qwen/qwen3-32b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 10_000,
		cost: { input: 0.29, output: 0.39 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'openai/gpt-oss-120b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.50, output: 2.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'openai/gpt-oss-20b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.40 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'meta-llama/llama-4-scout-17b-16e-instruct': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 10_000,
		cost: { input: 0.11, output: 0.34 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'groq/compound': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 10_000,
		cost: { input: 0.59, output: 0.79 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen/qwen3.6-27b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 10_000,
		cost: { input: 0.29, output: 0.39 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }
const groqSettings: LoopholeStaticProviderInfo = {
	modelOptions: groqModelOptions,
	modelOptionsFallback: (modelName) => { return null },
	providerReasoningIOSettings: {
		// Must be set to either parsed or hidden when using tool calling https://console.groq.com/docs/reasoning
		input: {
			includeInPayload: (reasoningInfo) => {
				if (!reasoningInfo?.isReasoningEnabled) return null
				if (reasoningInfo.type === 'budget_slider_value') {
					return { reasoning_format: 'parsed' }
				}
				return null
			}
		},
		output: { nameOfFieldInDelta: 'reasoning' },
	},
}


// ---------------- GOOGLE VERTEX ----------------
const googleVertexModelOptions = {
} as const satisfies Record<string, LoopholeStaticModelInfo>
const googleVertexSettings: LoopholeStaticProviderInfo = {
	modelOptions: googleVertexModelOptions,
	modelOptionsFallback: (modelName) => { return null },
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
	},
}

// ---------------- MICROSOFT AZURE ----------------
const microsoftAzureModelOptions = {
} as const satisfies Record<string, LoopholeStaticModelInfo>
const microsoftAzureSettings: LoopholeStaticProviderInfo = {
	modelOptions: microsoftAzureModelOptions,
	modelOptionsFallback: (modelName) => { return null },
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
	},
}

// ---------------- AWS BEDROCK ----------------
const awsBedrockModelOptions = {
} as const satisfies Record<string, LoopholeStaticModelInfo>

const awsBedrockSettings: LoopholeStaticProviderInfo = {
	modelOptions: awsBedrockModelOptions,
	modelOptionsFallback: (modelName) => { return null },
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
	},
}


// ---------------- VLLM, OLLAMA, OPENAICOMPAT (self-hosted / local) ----------------
const ollamaModelOptions = {
	'qwen2.5-coder:7b': {
		contextWindow: 32_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 1.9 },
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen2.5-coder:3b': {
		contextWindow: 32_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 1.9 },
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen2.5-coder:1.5b': {
		contextWindow: 32_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: .986 },
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'llama3.1': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 4.9 },
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen2.5-coder': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 4.7 },
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'qwen3-coder:30b': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 18.5 },
		supportsFIM: true,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'qwq': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 32_000,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 20 },
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: false, canTurnOffReasoning: false, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'deepseek-r1': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 4.7 },
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: false, canTurnOffReasoning: false, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'devstral:latest': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0, output: 0 },
		downloadable: { sizeGb: 14 },
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},

} as const satisfies Record<string, LoopholeStaticModelInfo>

export const ollamaRecommendedModels = ['qwen2.5-coder:1.5b', 'llama3.1', 'qwq', 'deepseek-r1', 'devstral:latest', 'qwen3-coder:30b'] as const satisfies (keyof typeof ollamaModelOptions)[]


const vLLMSettings: LoopholeStaticProviderInfo = {
	modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName, { downloadable: { sizeGb: 'not-known' } }),
	modelOptions: {},
	providerReasoningIOSettings: {
		// reasoning: OAICompat + response.choices[0].delta.reasoning_content // https://docs.vllm.ai/en/stable/features/reasoning_outputs.html#streaming-chat-completions
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		output: { nameOfFieldInDelta: 'reasoning_content' },
	},
}

const lmStudioSettings: LoopholeStaticProviderInfo = {
	modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName, { downloadable: { sizeGb: 'not-known' }, contextWindow: 4_096 }),
	modelOptions: {},
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		output: { needsManualParse: true },
	},
}

const ollamaSettings: LoopholeStaticProviderInfo = {
	modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName, { downloadable: { sizeGb: 'not-known' } }),
	modelOptions: ollamaModelOptions,
	providerReasoningIOSettings: {
		// reasoning: we need to filter out reasoning <think> tags manually
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		output: { needsManualParse: true },
	},
}

const openaiCompatible: LoopholeStaticProviderInfo = {
	modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName),
	modelOptions: {},
	providerReasoningIOSettings: {
		// reasoning: we have no idea what endpoint they used, so we can't consistently parse out reasoning
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		output: { nameOfFieldInDelta: 'reasoning_content' },
	},
}

const liteLLMSettings: LoopholeStaticProviderInfo = { // https://docs.litellm.ai/docs/reasoning_content
	modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName, { downloadable: { sizeGb: 'not-known' } }),
	modelOptions: {},
	providerReasoningIOSettings: {
		input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		output: { nameOfFieldInDelta: 'reasoning_content' },
	},
}


// ---------------- OPENROUTER ----------------
const openRouterModelOptions_assumingOpenAICompat = {
	'deepseek/deepseek-v3': {
		...openSourceModelOptions_assumingOAICompat.deepseekCoderV3,
		contextWindow: 64_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.14, output: 0.55 },
		downloadable: false,
		reasoningCapabilities: false,
	},
	'deepseek/deepseek-r1': {
		...openSourceModelOptions_assumingOAICompat.deepseekR1,
		cost: { input: 0.55, output: 2.19 },
		contextWindow: 64_000,
		downloadable: false,
	},
	'qwen/qwen3-235b-a22b': {
		contextWindow: 40_960,
		reservedOutputTokenSpace: null,
		cost: { input: .10, output: .10 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: false },
	},
	'qwen/qwen3-coder-480b-a35b': {
		...openSourceModelOptions_assumingOAICompat['qwen3coder-480b'],
		cost: { input: 0.50, output: 1.50 },
		downloadable: false,
	},
	'microsoft/phi-4-reasoning-plus:free': { // a 14B model...
		contextWindow: 32_768,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: false },
	},
	'mistralai/mistral-small-3.1-24b-instruct:free': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'google/gemini-2.0-flash-lite-preview-02-05:free': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'google/gemini-2.0-pro-exp-02-05:free': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'phind/phind-codellama-34b': {
		contextWindow: 16_384,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'01-ai/yi-large': {
		contextWindow: 32_768,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 3.00, output: 3.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'liquid/lfm-40b': {
		contextWindow: 32_768,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.15, output: 0.15 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'openai/gpt-4-turbo': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 10.00, output: 30.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'minimax/m2.5': {
		contextWindow: 204_800,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.30 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'moonshot/kimi-k2.5': {
		contextWindow: 256_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.80, output: 2.40 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'zhipuai/glm-5': {
		contextWindow: 256_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.50, output: 1.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'z-ai/glm-5.1': { // GLM-5.1 — ZhipuAI's latest flagship reasoning model
		contextWindow: 204_800,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.60, output: 1.80 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'z-ai/glm-5-turbo': { // GLM-5-Turbo — fast and affordable GLM-5 variant
		contextWindow: 256_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.15, output: 0.45 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'google/gemini-3-flash-preview': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'google/gemini-2.0-flash-exp:free': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'anthropic/claude-opus-4.6': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 15.00, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
		},
	},
	'anthropic/claude-sonnet-4.6': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: {
			supportsReasoning: true,
			canTurnOffReasoning: true,
			canIOReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
		},
	},
	'openai/gpt-5.4-pro': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 15.00, output: 60.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'openai/gpt-5.4': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 15.00, output: 60.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'openai/o4': { // OpenAI o4 — full reasoning model, successor to o3
		contextWindow: 1_047_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 8.00, cache_read: 0.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: false, canTurnOffReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'medium' } },
	},
	'openai/o4-mini': { // OpenAI o4-mini — affordable reasoning model
		contextWindow: 1_047_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 1.10, output: 4.40, cache_read: 0.275 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: false, canTurnOffReasoning: false, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'meta-llama/llama-4-scout-turbo': { // Llama 4 Scout Turbo — faster variant with 10M context
		contextWindow: 10_000_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.15, output: 0.60 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistralai/mistral-medium-3': { // Mistral Medium 3 — balanced performance/cost
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.40, output: 2.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'x-ai/grok-4': { // Grok-4 — xAI's latest flagship model
		contextWindow: 256_000,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 6.00, output: 30.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'high' } },
	},
	'google/gemini-3.1-pro-preview': {
		contextWindow: 1_485_760,
		reservedOutputTokenSpace: 128_000,
		cost: { input: 1.25, output: 5.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: {
			supportsReasoning: true,
			canIOReasoning: true,
			canTurnOffReasoning: true,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 },
		},
	},
	'google/gemini-3.1-flash-preview': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.10, output: 0.40 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'google/gemini-3.1-flash-lite:free': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'deepseek/deepseek-v3.2': {
		contextWindow: 163_840,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.27, output: 1.10 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'meta-llama/llama-4-scout': {
		...openSourceModelOptions_assumingOAICompat['llama4-scout'],
		cost: { input: 0.10, output: 0.40 },
		downloadable: false,
	},
	'meta-llama/llama-4-maverick': {
		...openSourceModelOptions_assumingOAICompat['llama4-maverick'],
		cost: { input: 0.05, output: 0.20 },
		downloadable: false,
	},
	'deepseek/deepseek-r1:free': {
		...openSourceModelOptions_assumingOAICompat.deepseekR1,
		cost: { input: 0, output: 0 },
		contextWindow: 164_000,
		downloadable: false,
	},
	'qwen/qwen3-vl-235b-a22b-thinking': {
		...openSourceModelOptions_assumingOAICompat.qwen3,
		cost: { input: 0.50, output: 1.50 },
		contextWindow: 128_000,
		downloadable: false,
	},
	'mistralai/mistral-large-2411': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 6.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},

	'anthropic/claude-opus-4': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: null,
		cost: { input: 15.00, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'anthropic/claude-sonnet-4': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: null,
		cost: { input: 15.00, output: 75.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'anthropic/claude-3.7-sonnet:thinking': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: null,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { // same as anthropic, see above
			supportsReasoning: true,
			canTurnOffReasoning: false,
			canIOReasoning: true,
			reasoningReservedOutputTokenSpace: 8192,
			reasoningSlider: { type: 'budget_slider', min: 1024, max: 8192, default: 1024 }, // they recommend batching if max > 32_000.
		},
	},
	'anthropic/claude-3.7-sonnet': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: null,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false, // stupidly, openrouter separates thinking from non-thinking
	},
	'anthropic/claude-3.5-sonnet': {
		contextWindow: 200_000,
		reservedOutputTokenSpace: null,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistralai/codestral-2501': {
		...openSourceModelOptions_assumingOAICompat.codestral,
		contextWindow: 256_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0.3, output: 0.9 },
		downloadable: false,
		reasoningCapabilities: false,
	},
	'mistralai/devstral-small:free': {
		...openSourceModelOptions_assumingOAICompat.devstral,
		contextWindow: 130_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0, output: 0 },
		downloadable: false,
		reasoningCapabilities: false,
	},
	'qwen/qwen-2.5-coder-32b-instruct': {
		...openSourceModelOptions_assumingOAICompat['qwen2.5coder'],
		contextWindow: 33_000,
		reservedOutputTokenSpace: null,
		cost: { input: 0.07, output: 0.16 },
		downloadable: false,
	},
	'qwen/qwen3-72b-instruct': {
		...openSourceModelOptions_assumingOAICompat.qwen3,
		cost: { input: 0.40, output: 1.20 },
		contextWindow: 128_000,
		downloadable: false,
	},
	'arcee/trinity-large-preview': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.50, output: 1.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'stepfun/step-3.5-flash': {
		contextWindow: 256_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.05, output: 0.15 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'nvidia/nemotron-3-nano-30b': {
		contextWindow: 32_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.05, output: 0.05 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'bytedance/seed-2.0-mini': {
		contextWindow: 32_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.05, output: 0.05 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},

	'perplexity/llama-3.1-sonar-large-128k-online': {
		contextWindow: 128_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 1.00, output: 1.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},

	// Qwen 3.7
	'qwen/qwen3.7-plus': {
		...openSourceModelOptions_assumingOAICompat.qwen3,
		contextWindow: 256_000, reservedOutputTokenSpace: 16_384,
		cost: { input: 0.50, output: 1.50 },
		downloadable: false,
	},
	'qwen/qwen3.7-max': {
		...openSourceModelOptions_assumingOAICompat.qwen3,
		contextWindow: 256_000, reservedOutputTokenSpace: 16_384,
		cost: { input: 1.00, output: 3.00 },
		downloadable: false,
	},

	// Moonshot / Kimi
	'moonshotai/kimi-k3': {
		contextWindow: 262_144,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 1.00, output: 3.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'moonshotai/kimi-k2.7-code': {
		contextWindow: 262_144,
		reservedOutputTokenSpace: 16_384,
		cost: { input: 0.80, output: 2.40 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'moonshotai/kimi-k2.6': {
		contextWindow: 262_144,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.60, output: 1.80 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},

	// ZhipuAI / GLM
	'z-ai/glm-5.2': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.50, output: 1.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},

	// Xiaomi MiMo
	'xiaomi/mimo-v2.5-pro': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.40, output: 1.20 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'xiaomi/mimo-v2.5': {
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.20, output: 0.60 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},

	// OpenRouter auto
	'openrouter/auto': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0, output: 0 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},

	// Gemini via OpenRouter (uses openai-style, not gemini-style)
	'google/gemini-3.6-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 1.50, output: 7.50 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 } },
	},
	'google/gemini-3.5-flash': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 65_536,
		cost: { input: 1.50, output: 9.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'budget_slider', min: 1024, max: 32_768, default: 4096 } },
	},
	'google/gemini-3.1-flash-lite': {
		contextWindow: 1_048_576,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 0.125, output: 0.75 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},

	// Google Gemma-4
	'google/gemma-4-31b-it': {
		...openSourceModelOptions_assumingOAICompat.gemma,
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.30 },
		downloadable: false,
	},
	'google/gemma-4-26b-a4b-it': {
		...openSourceModelOptions_assumingOAICompat.gemma,
		contextWindow: 131_072,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.08, output: 0.24 },
		downloadable: false,
	},

	// DeepSeek via OpenRouter (versioned names)
	'deepseek/deepseek-v4-pro': {
		...openSourceModelOptions_assumingOAICompat.deepseekCoderV3,
		contextWindow: 1_048_576, reservedOutputTokenSpace: 32_768,
		cost: { input: 0.50, output: 2.19 },
		downloadable: false,
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'deepseek/deepseek-v4-flash': {
		...openSourceModelOptions_assumingOAICompat.deepseekCoderV3,
		contextWindow: 1_048_576, reservedOutputTokenSpace: 32_768,
		cost: { input: 0.14, output: 0.55 },
		downloadable: false,
		reasoningCapabilities: { supportsReasoning: true, canTurnOffReasoning: true, canIOReasoning: true, openSourceThinkTags: ['<think>', '</think>'] },
	},

	// xAI via OpenRouter
	'x-ai/grok-4.5': {
		contextWindow: 500_000,
		reservedOutputTokenSpace: 32_768,
		cost: { input: 2.00, output: 6.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},
	'x-ai/grok-4.3': {
		contextWindow: 1_000_000,
		reservedOutputTokenSpace: 20_000,
		cost: { input: 3.00, output: 15.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: true, reasoningSlider: { type: 'effort_slider', values: ['low', 'medium', 'high'], default: 'low' } },
	},

	// Mistral via OpenRouter
	'mistralai/mistral-large-latest': {
		...openSourceModelOptions_assumingOAICompat.devstral,
		contextWindow: 131_000, reservedOutputTokenSpace: 8_192,
		cost: { input: 2.00, output: 6.00 },
		downloadable: false,
		reasoningCapabilities: false,
	},
	'mistralai/magistral-medium-latest': {
		contextWindow: 256_000,
		reservedOutputTokenSpace: 8_192,
		cost: { input: 0.30, output: 0.90 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: { supportsReasoning: true, canIOReasoning: true, canTurnOffReasoning: false, openSourceThinkTags: ['<think>', '</think>'] },
	},
	'mistralai/mistral-small-latest': {
		contextWindow: 131_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.10, output: 0.30 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
	'mistralai/codestral-latest': {
		...openSourceModelOptions_assumingOAICompat.codestral,
		contextWindow: 256_000, reservedOutputTokenSpace: 8_192,
		cost: { input: 0.30, output: 0.90 },
		downloadable: false,
	},
	'mistralai/devstral-latest': {
		...openSourceModelOptions_assumingOAICompat.devstral,
		contextWindow: 131_000, reservedOutputTokenSpace: 8_192,
		cost: { input: 0.10, output: 0.30 },
		downloadable: false,
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }

const openRouterSettings: LoopholeStaticProviderInfo = {
	modelOptions: openRouterModelOptions_assumingOpenAICompat,
	modelOptionsFallback: (modelName) => {
		const res = extensiveModelOptionsFallback(modelName)
		// openRouter does not support gemini-style, use openai-style instead
		if (res?.specialToolFormat === 'gemini-style') {
			res.specialToolFormat = 'openai-style'
		}
		return res
	},
	providerReasoningIOSettings: {
		// reasoning: OAICompat + response.choices[0].delta.reasoning : payload should have {include_reasoning: true} https://openrouter.ai/announcements/reasoning-tokens-for-thinking-models
		input: {
			// https://openrouter.ai/docs/use-cases/reasoning-tokens
			includeInPayload: (reasoningInfo) => {
				if (!reasoningInfo?.isReasoningEnabled) return null

				if (reasoningInfo.type === 'budget_slider_value') {
					return {
						reasoning: {
							max_tokens: reasoningInfo.reasoningBudget
						}
					}
				}
				if (reasoningInfo.type === 'effort_slider_value')
					return {
						reasoning: {
							effort: reasoningInfo.reasoningEffort
						}
					}
				return null
			}
		},
		output: { nameOfFieldInDelta: 'reasoning' },
	},
}




// ---------------- model settings of everything above ----------------

// ---------------- INCEPTION LABS ----------------
const inceptionModelOptions = {
	'mercury-edit-2': { // purpose-built for autocomplete/FIM
		contextWindow: 32_000,
		reservedOutputTokenSpace: 512,
		cost: { input: 0.00, output: 0.00 },
		downloadable: false,
		supportsFIM: true,
		supportsSystemMessage: false,
		reasoningCapabilities: false,
	},
	'mercury-coder-small': { // smaller/faster FIM autocomplete model
		contextWindow: 32_000,
		reservedOutputTokenSpace: 512,
		cost: { input: 0.00, output: 0.00 },
		downloadable: false,
		supportsFIM: true,
		supportsSystemMessage: false,
		reasoningCapabilities: false,
	},
	'mercury-2': { // general chat/reasoning model
		contextWindow: 128_000,
		reservedOutputTokenSpace: 4_096,
		cost: { input: 0.00, output: 0.00 },
		downloadable: false,
		supportsFIM: false,
		supportsSystemMessage: 'system-role',
		reasoningCapabilities: false,
	},
} as const satisfies { [s: string]: LoopholeStaticModelInfo }

const modelSettingsOfProvider: { [providerName in ProviderName]: LoopholeStaticProviderInfo } = {
	openAI: openAISettings,
	anthropic: anthropicSettings,
	xAI: xAISettings,
	gemini: geminiSettings,

	// open source models
	deepseek: deepseekSettings,
	groq: groqSettings,

	// open source models + providers (mixture of everything)
	openRouter: openRouterSettings,
	vLLM: vLLMSettings,
	ollama: ollamaSettings,
	openAICompatible: openaiCompatible,
	mistral: mistralSettings,

	liteLLM: liteLLMSettings,
	lmStudio: lmStudioSettings,

	googleVertex: googleVertexSettings,
	microsoftAzure: microsoftAzureSettings,
	awsBedrock: awsBedrockSettings,

	fireworksAI: {
		modelOptions: {},
		modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName),
		providerReasoningIOSettings: {
			input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		},
	},
	cohere: {
		modelOptions: {},
		modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName),
		providerReasoningIOSettings: {
			input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		},
	},
	perplexity: {
		modelOptions: {},
		modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName),
		providerReasoningIOSettings: {
			input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		},
	},
	togetherAI: {
		modelOptions: {},
		modelOptionsFallback: (modelName) => extensiveModelOptionsFallback(modelName),
		providerReasoningIOSettings: {
			input: { includeInPayload: openAICompatIncludeInPayloadReasoning },
		},
	},
	inception: {
	    modelOptions: inceptionModelOptions,
	    modelOptionsFallback: (modelName) =>
	        extensiveModelOptionsFallback(modelName),
	    providerReasoningIOSettings: {
	        input: {
	            includeInPayload: openAICompatIncludeInPayloadReasoning,
	        },
	    },
	},
} as const

// ---------------- exports ----------------

// returns the capabilities and the adjusted modelName if it was a fallback
export const getModelCapabilities = (
	providerName: ProviderName,
	modelName: string,
	overridesOfModel: OverridesOfModel | undefined
): LoopholeStaticModelInfo & (
	| { modelName: string; recognizedModelName: string; isUnrecognizedModel: false }
	| { modelName: string; recognizedModelName?: undefined; isUnrecognizedModel: true }
) => {

	const lowercaseModelName = modelName.toLowerCase()

	const { modelOptions, modelOptionsFallback } = modelSettingsOfProvider[providerName]

	// Get any override settings for this model
	const overrides = overridesOfModel?.[providerName]?.[modelName];

	// search model options object directly first
	for (const modelName_ in modelOptions) {
		const lowercaseModelName_ = modelName_.toLowerCase()
		if (lowercaseModelName === lowercaseModelName_) {
			return { ...modelOptions[modelName], ...overrides, modelName, recognizedModelName: modelName, isUnrecognizedModel: false };
		}
	}

	const result = modelOptionsFallback(modelName)
	if (result) {
		return { ...result, ...overrides, modelName: result.modelName, isUnrecognizedModel: false };
	}

	return { modelName, ...defaultModelOptions, ...overrides, isUnrecognizedModel: true };
}

// non-model settings
export const getProviderCapabilities = (providerName: ProviderName) => {
	const { providerReasoningIOSettings } = modelSettingsOfProvider[providerName]
	return { providerReasoningIOSettings }
}


export type SendableReasoningInfo = {
	type: 'budget_slider_value',
	isReasoningEnabled: true,
	reasoningBudget: number,
} | {
	type: 'effort_slider_value',
	isReasoningEnabled: true,
	reasoningEffort: string,
} | null



export const getIsReasoningEnabledState = (
	featureName: FeatureName,
	providerName: ProviderName,
	modelName: string,
	modelSelectionOptions: ModelSelectionOptions | undefined,
	overridesOfModel: OverridesOfModel | undefined,
) => {
	const { supportsReasoning, canTurnOffReasoning } = getModelCapabilities(providerName, modelName, overridesOfModel).reasoningCapabilities || {}
	if (!supportsReasoning) return false

	// default to enabled if can't turn off, or if the featureName is Chat.
	const defaultEnabledVal = featureName === 'Chat' || !canTurnOffReasoning

	const isReasoningEnabled = modelSelectionOptions?.reasoningEnabled ?? defaultEnabledVal
	return isReasoningEnabled
}


export const getReservedOutputTokenSpace = (providerName: ProviderName, modelName: string, opts: { isReasoningEnabled: boolean, overridesOfModel: OverridesOfModel | undefined }) => {
	const {
		reasoningCapabilities,
		reservedOutputTokenSpace,
	} = getModelCapabilities(providerName, modelName, opts.overridesOfModel)
	return opts.isReasoningEnabled && reasoningCapabilities ? reasoningCapabilities.reasoningReservedOutputTokenSpace : reservedOutputTokenSpace
}

// used to force reasoning state (complex) into something simple we can just read from when sending a message
export const getSendableReasoningInfo = (
	featureName: FeatureName,
	providerName: ProviderName,
	modelName: string,
	modelSelectionOptions: ModelSelectionOptions | undefined,
	overridesOfModel: OverridesOfModel | undefined,
): SendableReasoningInfo => {

	const { reasoningSlider: reasoningBudgetSlider } = getModelCapabilities(providerName, modelName, overridesOfModel).reasoningCapabilities || {}
	const isReasoningEnabled = getIsReasoningEnabledState(featureName, providerName, modelName, modelSelectionOptions, overridesOfModel)
	if (!isReasoningEnabled) return null

	// check for reasoning budget
	const reasoningBudget = reasoningBudgetSlider?.type === 'budget_slider' ? modelSelectionOptions?.reasoningBudget ?? reasoningBudgetSlider?.default : undefined
	if (reasoningBudget) {
		return { type: 'budget_slider_value', isReasoningEnabled: isReasoningEnabled, reasoningBudget: reasoningBudget }
	}

	// check for reasoning effort
	const reasoningEffort = reasoningBudgetSlider?.type === 'effort_slider' ? modelSelectionOptions?.reasoningEffort ?? reasoningBudgetSlider?.default : undefined
	if (reasoningEffort) {
		return { type: 'effort_slider_value', isReasoningEnabled: isReasoningEnabled, reasoningEffort: reasoningEffort }
	}

	return null
}