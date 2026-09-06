import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { URI } from '../../../../base/common/uri.js';
import { Event } from '../../../../base/common/event.js';

export type CommandBarStateType = undefined | {
    sortedDiffZoneIds: string[];
    sortedDiffIds: string[];
    isStreaming: boolean;
    diffIdx: number | null;
}

export const ILoopholeCommandBarService = createDecorator<ILoopholeCommandBarService>('loopholeCommandBarService');

export interface ILoopholeCommandBarService {
    readonly _serviceBrand: undefined;
    stateOfURI: { [uri: string]: CommandBarStateType };
    sortedURIs: URI[];
    activeURI: URI | null;
    onDidChangeState: Event<{ uri: URI }>;
    onDidChangeActiveURI: Event<{ uri: URI | null }>;
    getStreamState: (uri: URI) => 'streaming' | 'idle-has-changes' | 'idle-no-changes';
    setDiffIdx(uri: URI, newIdx: number | null): void;
    getNextDiffIdx(step: 1 | -1): number | null;
    getNextUriIdx(step: 1 | -1): number | null;
    goToDiffIdx(idx: number | null): void;
    goToURIIdx(idx: number | null): Promise<void>;
    acceptOrRejectAllFiles(opts: { behavior: 'reject' | 'accept' }): void;
    anyFileIsStreaming(): boolean;
}
