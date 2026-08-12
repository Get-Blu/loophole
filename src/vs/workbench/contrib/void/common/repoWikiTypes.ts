/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Garv Agnihotri, Inc. All rights reserved.
 *--------------------------------------------------------------------------------------*/

export type WikiPageStatus = 'pending' | 'generating' | 'ready' | 'stale' | 'error'

export type WikiPage = {
	id: string              // slug e.g. "architecture-overview"
	title: string           // "Architecture Overview"
	description: string     // one-line summary of what the page covers
	content: string         // full markdown content
	sourceFiles: string[]   // file paths read during generation — used for stale detection
	status: WikiPageStatus
	generatedAt: number     // unix ms timestamp
	errorMessage?: string
}

export type WikiGraph = {
	nodes: WikiGraphNode[]
	edges: WikiGraphEdge[]
}

export type WikiGraphNode = {
	id: string      // matches WikiPage.id
	title: string
	group: string   // broad category for color grouping e.g. "services" "ui" "types"
}

export type WikiGraphEdge = {
	source: string  // WikiPage.id
	target: string  // WikiPage.id
	label: string   // e.g. "depends on" "extends" "uses"
}

export type WikiStatus =
	| 'idle'         // no wiki exists yet
	| 'planning'     // first LLM call — figuring out page structure
	| 'generating'   // writing pages one by one
	| 'ready'        // all pages done
	| 'error'        // something went wrong at the top level

export type WikiState = {
	status: WikiStatus
	pages: WikiPage[]
	graph: WikiGraph | null
	selectedPageId: string | null
	errorMessage?: string
}

export const defaultWikiState: WikiState = {
	status: 'idle',
	pages: [],
	graph: null,
	selectedPageId: null,
}
