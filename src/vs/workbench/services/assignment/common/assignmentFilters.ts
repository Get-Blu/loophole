/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IExperimentationFilterProvider } from 'tas-client';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IDefaultAccountService } from '../../../../platform/defaultAccount/common/defaultAccount.js';
import { ExtensionIdentifier } from '../../../../platform/extensions/common/extensions.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IChatEntitlementService } from '../../chat/common/chatEntitlementService.js';
import { IExtensionService } from '../../extensions/common/extensions.js';

export enum ExtensionsFilter {

	/**
	 * Version of the completions version (Copilot removed).
	 */
	CompletionsVersionInCopilotChat = 'X-VSCode-CompletionsInChatExtensionVersion',

	/**
	 * The internal org of the user.
	 */
	MicrosoftInternalOrg = 'X-Microsoft-Internal-Org',



	/**
	 * Whether the `sn` flag is set to `'1'` in the copilot token.
	 */
	CopilotIsSn = 'X-GitHub-Copilot-IsSn',

	/**
	 * Whether the `fcv1` flag is set to `'1'` in the copilot token.
	 */
	CopilotIsFcv1 = 'X-GitHub-Copilot-IsFcv1',
}

enum StorageVersionKeys {
	CopilotExtensionVersion = 'extensionsAssignmentFilterProvider.copilotExtensionVersion',
	CopilotChatExtensionVersion = 'extensionsAssignmentFilterProvider.copilotChatExtensionVersion',
	CompletionsVersion = 'extensionsAssignmentFilterProvider.copilotCompletionsVersion',
	CopilotSku = 'extensionsAssignmentFilterProvider.copilotSku',
	CopilotInternalOrg = 'extensionsAssignmentFilterProvider.copilotInternalOrg',
	CopilotTrackingId = 'extensionsAssignmentFilterProvider.copilotTrackingId',
	CopilotIsSn = 'extensionsAssignmentFilterProvider.copilotIsSn',
	CopilotIsFcv1 = 'extensionsAssignmentFilterProvider.copilotIsFcv1',
}

export class CopilotAssignmentFilterProvider extends Disposable implements IExperimentationFilterProvider {
	private copilotChatExtensionVersion: string | undefined;
	private copilotExtensionVersion: string | undefined;
	// TODO@benibenj remove this when completions have been ported to chat
	private copilotCompletionsVersion: string | undefined;

	private copilotInternalOrg: string | undefined;
	private copilotSku: string | undefined;
	private copilotTrackingId: string | undefined;
	private copilotIsSn: string | undefined;
	private copilotIsFcv1: string | undefined;

	private readonly _onDidChangeFilters = this._register(new Emitter<void>());
	readonly onDidChangeFilters = this._onDidChangeFilters.event;

	constructor(
		@IExtensionService private readonly _extensionService: IExtensionService,
		@IStorageService private readonly _storageService: IStorageService,
		@IChatEntitlementService private readonly _chatEntitlementService: IChatEntitlementService,
		@IDefaultAccountService private readonly _defaultAccountService: IDefaultAccountService,
	) {
		super();

		this.copilotExtensionVersion = this._storageService.get(StorageVersionKeys.CopilotExtensionVersion, StorageScope.PROFILE);
		this.copilotChatExtensionVersion = this._storageService.get(StorageVersionKeys.CopilotChatExtensionVersion, StorageScope.PROFILE);
		this.copilotCompletionsVersion = this._storageService.get(StorageVersionKeys.CompletionsVersion, StorageScope.PROFILE);
		this.copilotSku = this._storageService.get(StorageVersionKeys.CopilotSku, StorageScope.PROFILE);
		this.copilotInternalOrg = this._storageService.get(StorageVersionKeys.CopilotInternalOrg, StorageScope.PROFILE);
		this.copilotTrackingId = this._storageService.get(StorageVersionKeys.CopilotTrackingId, StorageScope.PROFILE);
		this.copilotIsSn = this._storageService.get(StorageVersionKeys.CopilotIsSn, StorageScope.PROFILE);
		this.copilotIsFcv1 = this._storageService.get(StorageVersionKeys.CopilotIsFcv1, StorageScope.PROFILE);

		this._register(this._extensionService.onDidChangeExtensionsStatus(extensionIdentifiers => {
			if (extensionIdentifiers.some(identifier => ExtensionIdentifier.equals(identifier, 'github.copilot') || ExtensionIdentifier.equals(identifier, 'github.copilot-chat'))) {
				this.updateExtensionVersions();
			}
		}));

		this._register(this._chatEntitlementService.onDidChangeEntitlement(() => {
			this.updateCopilotEntitlementInfo();
		}));

		this._register(this._defaultAccountService.onDidChangeCopilotTokenInfo(() => {
			this.updateCopilotTokenInfo();
		}));

		this.updateExtensionVersions();
		this.updateCopilotEntitlementInfo();
		this.updateCopilotTokenInfo();
	}

	private async updateExtensionVersions() {
		// Copilot extension tracking removed
		return;
	}

	private updateCopilotEntitlementInfo() {
		// Copilot entitlement tracking removed
		return;
	}

	private updateCopilotTokenInfo() {
		const tokenInfo = this._defaultAccountService.copilotTokenInfo;
		const newIsSn = tokenInfo?.sn === '1' ? '1' : '0';
		const newIsFcv1 = tokenInfo?.fcv1 === '1' ? '1' : '0';

		if (this.copilotIsSn === newIsSn && this.copilotIsFcv1 === newIsFcv1) {
			return;
		}

		this.copilotIsSn = newIsSn;
		this.copilotIsFcv1 = newIsFcv1;

		this._storageService.store(StorageVersionKeys.CopilotIsSn, this.copilotIsSn, StorageScope.PROFILE, StorageTarget.MACHINE);
		this._storageService.store(StorageVersionKeys.CopilotIsFcv1, this.copilotIsFcv1, StorageScope.PROFILE, StorageTarget.MACHINE);

		// Notify that the filters have changed.
		this._onDidChangeFilters.fire();
	}

	/**
	 * Returns a version string that can be parsed by the TAS client.
	 * The tas client cannot handle suffixes lke "-insider"
	 * Ref: https://github.com/microsoft/tas-client/blob/30340d5e1da37c2789049fcf45928b954680606f/vscode-tas-client/src/vscode-tas-client/VSCodeFilterProvider.ts#L35
	 *
	 * @param version Version string to be trimmed.
	*/
	private static trimVersionSuffix(version: string): string {
		const regex = /\-[a-zA-Z0-9]+$/;
		const result = version.split(regex);

		return result[0];
	}

	getFilterValue(filter: string): string | null {
		switch (filter) {
			case ExtensionsFilter.CompletionsVersionInCopilotChat:
				return this.copilotCompletionsVersion ? CopilotAssignmentFilterProvider.trimVersionSuffix(this.copilotCompletionsVersion) : null;
			case ExtensionsFilter.MicrosoftInternalOrg:
				return this.copilotInternalOrg ?? null;
			case ExtensionsFilter.CopilotIsSn:
				return this.copilotIsSn ?? null;
			case ExtensionsFilter.CopilotIsFcv1:
				return this.copilotIsFcv1 ?? null;
			default:
				return null;
		}
	}

	getFilters(): Map<string, string | null> {
		const filters = new Map<string, string | null>();
		const filterValues = Object.values(ExtensionsFilter);
		for (const value of filterValues) {
			filters.set(value, this.getFilterValue(value));
		}

		return filters;
	}
}
