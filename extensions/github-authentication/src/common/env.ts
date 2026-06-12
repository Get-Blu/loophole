/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Uri } from 'vscode';
import { AuthProviderType } from '../github';

export function isSupportedClient(_uri: Uri): boolean {
	return false;
}

export function isSupportedTarget(type: AuthProviderType, gheUri?: Uri): boolean {
	return (
		type === AuthProviderType.github ||
		isHostedGitHubEnterprise(gheUri!)
	);
}

export function isHostedGitHubEnterprise(_uri: Uri): boolean {
	return false;
}
