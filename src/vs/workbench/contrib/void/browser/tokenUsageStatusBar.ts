/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Loophole-AI. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IStatusbarService, StatusbarAlignment } from '../../../services/statusbar/browser/statusbar.js';
import { ITokenUsageService, formatTokenCount, formatDollarCount } from '../common/tokenUsageService.js';
import { localize } from '../../../../nls.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';

export const ITokenUsageStatusBarService = createDecorator<ITokenUsageStatusBarService>('tokenUsageStatusBarService');

export interface ITokenUsageStatusBarService {
	readonly _serviceBrand: undefined;
}



const TOKEN_USAGE_STATUS_BAR_ID = 'loophole.tokenUsage';

export class TokenUsageStatusBarService extends Disposable implements ITokenUsageStatusBarService, IWorkbenchContribution {
	static readonly ID = 'loophole.tokenUsageStatusBar';
	readonly _serviceBrand: undefined;

	constructor(
		@IStatusbarService private readonly statusbarService: IStatusbarService,
		@ITokenUsageService private readonly tokenUsageService: ITokenUsageService,
	) {
		super();

		// Add initial status bar entry
		// Priority: Number.NEGATIVE_INFINITY + 1 places it just LEFT of the notification bell
		const accessor = this.statusbarService.addEntry(
			{
				name: localize('tokenUsage', 'Token Usage & Cost'),
				text: this.getTokenText(),
				ariaLabel: localize('tokenUsageAria', 'Total tokens used: {0}, Estimated cost: {1}', formatTokenCount(this.tokenUsageService.getTotalTokensUsed()), formatDollarCount(this.tokenUsageService.getEstimatedCost())),
				tooltip: localize('tokenUsageTooltip', 'Total tokens used & estimated cost. Click to reset.'),
				command: 'loophole.resetTokenUsage',
			},
			TOKEN_USAGE_STATUS_BAR_ID,
			StatusbarAlignment.LEFT,
			100 // places it on the left side after branch indicator
		);

		// Update when token usage changes
		this._register(
			this.tokenUsageService.onTokenUsageChanged(() => {
				accessor.update({
					name: localize('tokenUsage', 'Token Usage & Cost'),
					text: this.getTokenText(),
					ariaLabel: localize('tokenUsageAria', 'Total tokens used: {0}, Estimated cost: {1}', formatTokenCount(this.tokenUsageService.getTotalTokensUsed()), formatDollarCount(this.tokenUsageService.getEstimatedCost())),
					tooltip: localize('tokenUsageTooltip', 'Total tokens used & estimated cost. Click to reset.'),
					command: 'loophole.resetTokenUsage',
				});
			})
		);

		// Register reset command
		this.registerResetCommand();
	}

	private getTokenText(): string {
		const total = this.tokenUsageService.getTotalTokensUsed();
		const cost = this.tokenUsageService.getEstimatedCost();
		const costText = cost > 0 ? ` $(dollar) ${formatDollarCount(cost)}` : '';
		return `$(graph) ${formatTokenCount(total)}${costText}`;
	}

	private registerResetCommand(): void {
		// The command will be registered separately via the commands registry
		// This is just a placeholder - actual registration happens in the contribution
	}
}

registerSingleton(ITokenUsageStatusBarService, TokenUsageStatusBarService, InstantiationType.Eager);
registerWorkbenchContribution2(TokenUsageStatusBarService.ID, TokenUsageStatusBarService, WorkbenchPhase.AfterRestored);
