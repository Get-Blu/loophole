/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Garv Agnihotri, Inc. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import {
	Extensions as ViewContainerExtensions, IViewContainersRegistry,
	ViewContainerLocation, IViewsRegistry, Extensions as ViewExtensions,
	IViewDescriptorService,
} from '../../../common/views.js';
import * as nls from '../../../../nls.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { localize2 } from '../../../../nls.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { toDisposable } from '../../../../base/common/lifecycle.js';
import { Orientation } from '../../../../base/browser/ui/sash/sash.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { mountWiki } from './react/out/wiki-tsx/index.js';

// ─── ICON ────────────────────────────────────────────────────────────────────

const wikiViewIcon = registerIcon(
	'loophole-wiki-view-icon',
	Codicon.book,
	nls.localize('loopholeWikiViewIcon', 'View icon of the Loophole Wiki view.'),
);

// ─── VIEW PANE ───────────────────────────────────────────────────────────────

class WikiViewPane extends ViewPane {
	constructor(
		options: IViewPaneOptions,
		@IInstantiationService instantiationService: IInstantiationService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IOpenerService openerService: IOpenerService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IHoverService hoverService: IHoverService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(parent: HTMLElement): void {
		super.renderBody(parent);
		parent.style.userSelect = 'text';
		this.instantiationService.invokeFunction(accessor => {
			const disposeFn = mountWiki(parent, accessor)?.dispose;
			this._register(toDisposable(() => disposeFn?.()));
		});
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		this.element.style.height = `${height}px`;
		this.element.style.width = `${width}px`;
	}
}

// ─── REGISTRATION ────────────────────────────────────────────────────────────

export const LOOPHOLE_WIKI_VIEW_CONTAINER_ID = 'workbench.view.loophole.wiki';
export const LOOPHOLE_WIKI_VIEW_ID = LOOPHOLE_WIKI_VIEW_CONTAINER_ID;

const viewContainerRegistry = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry);

const wikiViewContainer = viewContainerRegistry.registerViewContainer({
	id: LOOPHOLE_WIKI_VIEW_CONTAINER_ID,
	title: localize2('loopholeWikiContainer', 'Repo Wiki'),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [LOOPHOLE_WIKI_VIEW_CONTAINER_ID, {
		mergeViewWithContainerWhenSingleView: true,
		orientation: Orientation.HORIZONTAL,
	}]),
	hideIfEmpty: false,
	order: 6,
	rejectAddedViews: true,
	icon: wikiViewIcon,
}, ViewContainerLocation.Sidebar, { doNotRegisterOpenCommand: true });

const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);
viewsRegistry.registerViews([{
	id: LOOPHOLE_WIKI_VIEW_ID,
	hideByDefault: false,
	name: localize2('loopholeWiki', 'Repo Wiki'),
	ctorDescriptor: new SyncDescriptor(WikiViewPane),
	canToggleVisibility: false,
	canMoveView: false,
	weight: 80,
	order: 1,
	openCommandActionDescriptor: {
		id: LOOPHOLE_WIKI_VIEW_CONTAINER_ID,
		order: 6,
	},
}], wikiViewContainer);

// ─── OPEN ACTION ─────────────────────────────────────────────────────────────

export const LOOPHOLE_OPEN_WIKI_ACTION_ID = 'loophole.openWiki';
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: LOOPHOLE_OPEN_WIKI_ACTION_ID,
			title: 'Open Loophole Wiki',
		});
	}
	run(accessor: ServicesAccessor): void {
		const viewsService = accessor.get(IViewsService);
		viewsService.openViewContainer(LOOPHOLE_WIKI_VIEW_CONTAINER_ID);
	}
});
