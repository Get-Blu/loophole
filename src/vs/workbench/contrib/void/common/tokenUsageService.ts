/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Emitter, Event } from '../../../../base/common/event.js';

export const ITokenUsageService = createDecorator<ITokenUsageService>('tokenUsageService');


// Storage key for total token usage
const TOTAL_TOKENS_STORAGE_KEY = 'loophole.totalTokensUsed';
const ESTIMATED_COST_STORAGE_KEY = 'loophole.estimatedCostUsed';

// Token usage for a single message
export type TokenUsageInfo = {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	providerName?: string;
	modelName?: string;
};

// Estimated pricing per 1M tokens (USD) - conservative averages per provider
// Local providers (ollama, vLLM, lmStudio) are free
const PRICE_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
	anthropic: { input: 3.0, output: 15.0 },
	openAI: { input: 2.5, output: 10.0 },
	deepseek: { input: 0.27, output: 1.10 },
	openRouter: { input: 2.0, output: 8.0 },
	gemini: { input: 1.25, output: 5.0 },
	groq: { input: 0.59, output: 0.79 },
	xAI: { input: 2.0, output: 8.0 },
	mistral: { input: 0.8, output: 2.4 },
	googleVertex: { input: 1.25, output: 5.0 },
	microsoftAzure: { input: 2.5, output: 10.0 },
	awsBedrock: { input: 2.0, output: 8.0 },
	cohere: { input: 1.0, output: 2.0 },
	perplexity: { input: 1.0, output: 2.0 },
	togetherAI: { input: 0.8, output: 2.4 },
	fireworksAI: { input: 0.8, output: 2.4 },
	liteLLM: { input: 1.0, output: 3.0 },
	openAICompatible: { input: 1.0, output: 3.0 },
};

// Local providers that are free
const FREE_PROVIDERS = new Set(['ollama', 'vLLM', 'lmStudio']);

// Estimate cost in USD for a token usage entry
export function estimateCost(tokens: TokenUsageInfo): number {
	if (!tokens.providerName || FREE_PROVIDERS.has(tokens.providerName)) {
		return 0;
	}
	const prices = PRICE_PER_MILLION_TOKENS[tokens.providerName];
	if (!prices) {
		// Unknown provider - use a conservative default
		const inputCost = (tokens.inputTokens / 1_000_000) * 1.0;
		const outputCost = (tokens.outputTokens / 1_000_000) * 3.0;
		return inputCost + outputCost;
	}
	const inputCost = (tokens.inputTokens / 1_000_000) * prices.input;
	const outputCost = (tokens.outputTokens / 1_000_000) * prices.output;
	return inputCost + outputCost;
}

// Format dollar amounts as human readable ($0.25, $1.2k, $3.5M)
export function formatDollarCount(amount: number): string {
	if (amount === 0) return '$0';

	const absAmount = Math.abs(amount);

	if (absAmount < 0.01) return '<$0.01';
	if (absAmount < 1000) {
		return `$${amount.toFixed(2)}`;
	} else if (absAmount < 1_000_000) {
		const k = (amount / 1000).toFixed(1);
		return `$${k.replace(/\.0$/, '')}k`;
	} else if (absAmount < 1_000_000_000) {
		const m = (amount / 1_000_000).toFixed(1);
		return `$${m.replace(/\.0$/, '')}M`;
	} else {
		const b = (amount / 1_000_000_000).toFixed(1);
		return `$${b.replace(/\.0$/, '')}B`;
	}
}

// Format numbers as human readable (167k, 3M, 1B, 2T)
export function formatTokenCount(count: number): string {
	if (count === 0) return '0';

	const absCount = Math.abs(count);

	if (absCount < 1000) {
		return count.toString();
	} else if (absCount < 1_000_000) {
		const k = (count / 1000).toFixed(1);
		return `${k.replace(/\.0$/, '')}k`;
	} else if (absCount < 1_000_000_000) {
		const m = (count / 1_000_000).toFixed(1);
		return `${m.replace(/\.0$/, '')}M`;
	} else if (absCount < 1_000_000_000_000) {
		const b = (count / 1_000_000_000).toFixed(1);
		return `${b.replace(/\.0$/, '')}B`;
	} else {
		const t = (count / 1_000_000_000_000).toFixed(1);
		return `${t.replace(/\.0$/, '')}T`;
	}
}

export interface ITokenUsageService {
	readonly _serviceBrand: undefined;

	// Event fired when token usage changes
	onTokenUsageChanged: Event<void>;

	// Get total tokens used across all sessions
	getTotalTokensUsed(): number;

	// Add tokens to the total
	addTokens(tokens: TokenUsageInfo): void;

	// Get formatted total tokens
	getFormattedTotalTokens(): string;

	// Get total estimated cost in USD
	getEstimatedCost(): number;

	// Get formatted estimated cost
	getFormattedEstimatedCost(): string;

	// Reset total tokens (for testing/debugging)
	resetTotalTokens(): void;
}

export class TokenUsageService implements ITokenUsageService {
	readonly _serviceBrand: undefined;

	private readonly _onTokenUsageChanged = new Emitter<void>();
	onTokenUsageChanged: Event<void> = this._onTokenUsageChanged.event;

	private _totalTokensUsed: number = 0;
	private _estimatedCost: number = 0;

	constructor(
		@IStorageService private readonly storageService: IStorageService,
	) {
		// Load persisted total from storage
		const storedTokens = this.storageService.get(TOTAL_TOKENS_STORAGE_KEY, StorageScope.APPLICATION);
		if (storedTokens) {
			this._totalTokensUsed = parseInt(storedTokens, 10) || 0;
		}
		const storedCost = this.storageService.get(ESTIMATED_COST_STORAGE_KEY, StorageScope.APPLICATION);
		if (storedCost) {
			this._estimatedCost = parseFloat(storedCost) || 0;
		}
	}

	getTotalTokensUsed(): number {
		return this._totalTokensUsed;
	}

	addTokens(tokens: TokenUsageInfo): void {
		this._totalTokensUsed += tokens.totalTokens;
		this._estimatedCost += estimateCost(tokens);

		// Persist to storage
		this.storageService.store(
			TOTAL_TOKENS_STORAGE_KEY,
			this._totalTokensUsed.toString(),
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
		this.storageService.store(
			ESTIMATED_COST_STORAGE_KEY,
			this._estimatedCost.toString(),
			StorageScope.APPLICATION,
			StorageTarget.USER
		);

		// Notify listeners
		this._onTokenUsageChanged.fire();
	}

	getFormattedTotalTokens(): string {
		return formatTokenCount(this._totalTokensUsed);
	}

	getEstimatedCost(): number {
		return this._estimatedCost;
	}

	getFormattedEstimatedCost(): string {
		return formatDollarCount(this._estimatedCost);
	}

	resetTotalTokens(): void {
		this._totalTokensUsed = 0;
		this._estimatedCost = 0;
		this.storageService.store(
			TOTAL_TOKENS_STORAGE_KEY,
			'0',
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
		this.storageService.store(
			ESTIMATED_COST_STORAGE_KEY,
			'0',
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
		this._onTokenUsageChanged.fire();
	}
}

registerSingleton(ITokenUsageService, TokenUsageService, InstantiationType.Eager);
