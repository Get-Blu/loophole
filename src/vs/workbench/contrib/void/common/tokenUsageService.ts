/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Emitter, Event } from '../../../../base/common/event.js';

// Storage key for total token usage
const TOTAL_TOKENS_STORAGE_KEY = 'loophole.totalTokensUsed';

// Token usage for a single message
export type TokenUsageInfo = {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
};

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
	
	// Reset total tokens (for testing/debugging)
	resetTotalTokens(): void;
}

export class TokenUsageService implements ITokenUsageService {
	readonly _serviceBrand: undefined;
	
	private readonly _onTokenUsageChanged = new Emitter<void>();
	onTokenUsageChanged: Event<void> = this._onTokenUsageChanged.event;
	
	private _totalTokensUsed: number = 0;
	
	constructor(
		@IStorageService private readonly storageService: IStorageService,
	) {
		// Load persisted total from storage
		const stored = this.storageService.get(TOTAL_TOKENS_STORAGE_KEY, StorageScope.APPLICATION);
		if (stored) {
			this._totalTokensUsed = parseInt(stored, 10) || 0;
		}
	}
	
	getTotalTokensUsed(): number {
		return this._totalTokensUsed;
	}
	
	addTokens(tokens: TokenUsageInfo): void {
		this._totalTokensUsed += tokens.totalTokens;
		
		// Persist to storage
		this.storageService.store(
			TOTAL_TOKENS_STORAGE_KEY,
			this._totalTokensUsed.toString(),
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
		
		// Notify listeners
		this._onTokenUsageChanged.fire();
	}
	
	getFormattedTotalTokens(): string {
		return formatTokenCount(this._totalTokensUsed);
	}
	
	resetTotalTokens(): void {
		this._totalTokensUsed = 0;
		this.storageService.store(
			TOTAL_TOKENS_STORAGE_KEY,
			'0',
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
		this._onTokenUsageChanged.fire();
	}
}

export const ITokenUsageService = createDecorator<ITokenUsageService>('tokenUsageService');

registerSingleton(ITokenUsageService, TokenUsageService, InstantiationType.Eager);
