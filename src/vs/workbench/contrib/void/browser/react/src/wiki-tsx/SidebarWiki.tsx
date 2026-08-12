/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Garv Agnihotri, Inc. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAccessor, useWikiState } from '../util/services.js';
import { WikiPage, WikiPageStatus } from '../../../../common/repoWikiTypes.js';

// ─── STATUS INDICATOR ────────────────────────────────────────────────────────

const StatusDot = ({ status }: { status: WikiPageStatus }) => {
	const color =
		status === 'ready' ? 'bg-green-500' :
		status === 'stale' ? 'bg-yellow-400' :
		status === 'generating' ? 'bg-blue-400 animate-pulse' :
		status === 'error' ? 'bg-red-400' :
		'bg-loophole-fg-3'

	return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${color}`} />
}

// ─── DEPENDENCY GRAPH ────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
	overview: '#6366f1',
	services: '#0ea5e9',
	ui: '#f59e0b',
	types: '#10b981',
	tools: '#8b5cf6',
	config: '#f43f5e',
	testing: '#06b6d4',
}

const WikiGraph = ({ onSelectPage }: { onSelectPage: (id: string) => void }) => {
	const wikiState = useWikiState()
	const graph = wikiState?.graph
	const canvasRef = useRef<SVGSVGElement>(null)

	if (!graph || graph.nodes.length === 0) {
		return (
			<div className="flex items-center justify-center h-48 text-loophole-fg-3 text-sm">
				Graph will appear after wiki is generated.
			</div>
		)
	}

	// Simple force-directed-like layout: arrange nodes in a circle
	const W = 560
	const H = 340
	const cx = W / 2
	const cy = H / 2
	const r = Math.min(W, H) * 0.36

	const nodePositions: Record<string, { x: number; y: number }> = {}
	graph.nodes.forEach((node, i) => {
		if (node.id === 'overview') {
			nodePositions[node.id] = { x: cx, y: cy }
		} else {
			const nonOverview = graph.nodes.filter(n => n.id !== 'overview')
			const idx = nonOverview.findIndex(n => n.id === node.id)
			const angle = (idx / nonOverview.length) * 2 * Math.PI - Math.PI / 2
			nodePositions[node.id] = {
				x: cx + r * Math.cos(angle),
				y: cy + r * Math.sin(angle),
			}
		}
	})

	return (
		<div className="w-full overflow-x-auto">
			<svg
				ref={canvasRef}
				viewBox={`0 0 ${W} ${H}`}
				className="w-full"
				style={{ maxHeight: 340 }}
			>
				<defs>
					<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
						<polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
					</marker>
				</defs>

				{/* Edges */}
				{graph.edges.map((edge, i) => {
					const s = nodePositions[edge.source]
					const t = nodePositions[edge.target]
					if (!s || !t) return null
					const mx = (s.x + t.x) / 2
					const my = (s.y + t.y) / 2
					return (
						<g key={i}>
							<line
								x1={s.x} y1={s.y}
								x2={t.x} y2={t.y}
								stroke="#374151"
								strokeWidth={1.2}
								markerEnd="url(#arrowhead)"
							/>
							<text
								x={mx} y={my - 4}
								fontSize={8}
								fill="#6b7280"
								textAnchor="middle"
							>
								{edge.label}
							</text>
						</g>
					)
				})}

				{/* Nodes */}
				{graph.nodes.map((node) => {
					const pos = nodePositions[node.id]
					if (!pos) return null
					const isOverview = node.id === 'overview'
					const nodeR = isOverview ? 38 : 30
					const color = GROUP_COLORS[node.group] ?? '#6366f1'

					const words = node.title.split(' ')
					const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ')
					const line2 = words.slice(Math.ceil(words.length / 2)).join(' ')

					return (
						<g
							key={node.id}
							style={{ cursor: 'pointer' }}
							onClick={() => onSelectPage(node.id)}
						>
							<circle
								cx={pos.x} cy={pos.y}
								r={nodeR}
								fill={color + '22'}
								stroke={color}
								strokeWidth={isOverview ? 2 : 1.5}
							/>
							<text x={pos.x} y={pos.y - (line2 ? 4 : 0)} textAnchor="middle" fontSize={9} fill="#e5e7eb" fontWeight={isOverview ? 700 : 400}>
								{line1}
							</text>
							{line2 && (
								<text x={pos.x} y={pos.y + 9} textAnchor="middle" fontSize={9} fill="#e5e7eb">
									{line2}
								</text>
							)}
						</g>
					)
				})}
			</svg>
		</div>
	)
}

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────

const MarkdownContent = ({ content }: { content: string }) => {
	// Simple markdown renderer — handles headings, bold, code, lists
	const lines = content.split('\n')
	const elements: React.ReactNode[] = []
	let i = 0

	while (i < lines.length) {
		const line = lines[i]

		if (line.startsWith('## ')) {
			elements.push(<h2 key={i} className="text-base font-semibold text-loophole-fg-1 mt-5 mb-2 border-b border-loophole-border pb-1">{line.slice(3)}</h2>)
		} else if (line.startsWith('### ')) {
			elements.push(<h3 key={i} className="text-sm font-semibold text-loophole-fg-1 mt-4 mb-1">{line.slice(4)}</h3>)
		} else if (line.startsWith('- ') || line.startsWith('* ')) {
			// Collect list items
			const items: string[] = []
			while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
				items.push(lines[i].slice(2))
				i++
			}
			elements.push(
				<ul key={`list-${i}`} className="list-disc list-inside space-y-0.5 text-sm text-loophole-fg-2 my-2 pl-2">
					{items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
				</ul>
			)
			continue
		} else if (line.startsWith('```')) {
			// Collect code block
			const lang = line.slice(3).trim()
			const codeLines: string[] = []
			i++
			while (i < lines.length && !lines[i].startsWith('```')) {
				codeLines.push(lines[i])
				i++
			}
			elements.push(
				<pre key={i} className="bg-loophole-bg-1 border border-loophole-border rounded text-xs text-loophole-fg-2 p-3 my-3 overflow-x-auto">
					<code>{codeLines.join('\n')}</code>
				</pre>
			)
		} else if (line.trim() === '') {
			elements.push(<div key={i} className="h-2" />)
		} else {
			elements.push(<p key={i} className="text-sm text-loophole-fg-2 leading-relaxed">{inlineFormat(line)}</p>)
		}
		i++
	}

	return <div className="space-y-0.5">{elements}</div>
}

function inlineFormat(text: string): React.ReactNode {
	// Handle **bold** and `code` inline
	const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
	return parts.map((part, i) => {
		if (part.startsWith('**') && part.endsWith('**')) {
			return <strong key={i} className="text-loophole-fg-1 font-semibold">{part.slice(2, -2)}</strong>
		}
		if (part.startsWith('`') && part.endsWith('`')) {
			return <code key={i} className="bg-loophole-bg-1 text-loophole-fg-1 text-xs px-1 py-0.5 rounded font-mono">{part.slice(1, -1)}</code>
		}
		return part
	})
}

// ─── PAGE LIST ITEM ──────────────────────────────────────────────────────────

const PageListItem = ({
	page,
	isSelected,
	onSelect,
	onUpdate,
}: {
	page: WikiPage
	isSelected: boolean
	onSelect: () => void
	onUpdate: () => void
}) => {
	return (
		<div
			className={`
				flex items-start gap-2 px-3 py-2 cursor-pointer rounded text-sm
				${isSelected ? 'bg-loophole-bg-1 text-loophole-fg-1' : 'text-loophole-fg-2 hover:bg-loophole-bg-1 hover:text-loophole-fg-1'}
				transition-colors
			`}
			onClick={onSelect}
		>
			<StatusDot status={page.status} />
			<div className="flex-1 min-w-0">
				<div className="truncate font-medium text-xs">{page.title}</div>
				{page.status === 'stale' && (
					<button
						className="text-xs text-yellow-400 hover:text-yellow-300 mt-0.5"
						onClick={(e) => { e.stopPropagation(); onUpdate() }}
					>
						Update
					</button>
				)}
				{page.status === 'error' && (
					<div className="text-xs text-red-400 mt-0.5 truncate">{page.errorMessage}</div>
				)}
			</div>
			{page.status === 'generating' && (
				<span className="text-xs text-blue-400 flex-shrink-0">writing...</span>
			)}
		</div>
	)
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

type WikiView = 'pages' | 'graph'

export const SidebarWiki = () => {
	const accessor = useAccessor()
	const wikiState = useWikiState()
	const [view, setView] = useState<WikiView>('pages')

	const repoWikiService = accessor.get('IRepoWikiService')

	const handleGenerate = useCallback(() => {
		repoWikiService.generateWiki()
	}, [repoWikiService])

	const handleSelectPage = useCallback((id: string) => {
		repoWikiService.selectPage(id)
		setView('pages')
	}, [repoWikiService])

	const handleUpdatePage = useCallback((id: string) => {
		repoWikiService.updateStalePage(id)
	}, [repoWikiService])

	const handleClear = useCallback(() => {
		repoWikiService.clearWiki()
	}, [repoWikiService])

	if (!wikiState) {
		return (
			<div className="flex items-center justify-center h-full text-loophole-fg-3 text-sm">
				Loading...
			</div>
		)
	}

	const { status, pages, selectedPageId } = wikiState
	const selectedPage = pages.find(p => p.id === selectedPageId) ?? null
	const staleCount = pages.filter(p => p.status === 'stale').length
	const isRunning = status === 'planning' || status === 'generating'
	const hasWiki = pages.length > 0

	return (
		<div className="flex flex-col h-full w-full overflow-hidden text-loophole-fg-1">

			{/* ─── Header ──────────────────────────────────────────────── */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-loophole-border flex-shrink-0">
				<div className="text-sm font-semibold">Repo Wiki</div>
				<div className="flex items-center gap-2">
					{hasWiki && (
						<>
							<button
								className={`text-xs px-2 py-1 rounded ${view === 'pages' ? 'bg-loophole-bg-1 text-loophole-fg-1' : 'text-loophole-fg-3 hover:text-loophole-fg-2'}`}
								onClick={() => setView('pages')}
							>
								Pages
							</button>
							<button
								className={`text-xs px-2 py-1 rounded ${view === 'graph' ? 'bg-loophole-bg-1 text-loophole-fg-1' : 'text-loophole-fg-3 hover:text-loophole-fg-2'}`}
								onClick={() => setView('graph')}
							>
								Graph
							</button>
						</>
					)}
				</div>
			</div>

			{/* ─── Action bar ──────────────────────────────────────────── */}
			<div className="flex items-center gap-2 px-4 py-2 border-b border-loophole-border flex-shrink-0">
				{status === 'idle' && (
					<button
						className="text-xs bg-loophole-accent text-white px-3 py-1.5 rounded hover:opacity-90 font-medium"
						onClick={handleGenerate}
					>
						Generate Wiki
					</button>
				)}

				{status === 'planning' && (
					<span className="text-xs text-loophole-fg-3 animate-pulse">Planning pages...</span>
				)}

				{status === 'generating' && (
					<span className="text-xs text-loophole-fg-3 animate-pulse">
						Writing pages... ({pages.filter(p => p.status === 'ready').length}/{pages.length})
					</span>
				)}

				{status === 'ready' && (
					<>
						<button
							className="text-xs text-loophole-fg-3 hover:text-loophole-fg-2 px-2 py-1 rounded hover:bg-loophole-bg-1"
							onClick={handleGenerate}
						>
							Regenerate
						</button>
						{staleCount > 0 && (
							<span className="text-xs text-yellow-400">
								{staleCount} page{staleCount > 1 ? 's' : ''} stale
							</span>
						)}
					</>
				)}

				{status === 'error' && (
					<>
						<span className="text-xs text-red-400">{wikiState.errorMessage ?? 'Error'}</span>
						<button
							className="text-xs text-loophole-fg-3 hover:text-loophole-fg-2 ml-2"
							onClick={handleGenerate}
						>
							Retry
						</button>
					</>
				)}

				{hasWiki && (
					<button
						className="text-xs text-loophole-fg-3 hover:text-red-400 ml-auto"
						onClick={handleClear}
					>
						Clear
					</button>
				)}
			</div>

			{/* ─── Body ────────────────────────────────────────────────── */}
			{!hasWiki && status === 'idle' && (
				<div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-3">
					<div className="text-loophole-fg-3 text-xs leading-relaxed max-w-xs">
						Generate a structured wiki for this repository. Loophole analyzes the codebase, writes documentation pages, and builds a dependency graph automatically.
					</div>
				</div>
			)}

			{hasWiki && view === 'graph' && (
				<div className="flex-1 overflow-y-auto p-4">
					<div className="text-xs text-loophole-fg-3 mb-3">Click a node to open the page.</div>
					<WikiGraph onSelectPage={handleSelectPage} />
					{wikiState.graph && (
						<div className="mt-4 flex flex-wrap gap-2">
							{Object.entries(GROUP_COLORS).map(([group, color]) => (
								<span key={group} className="flex items-center gap-1 text-xs text-loophole-fg-3">
									<span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
									{group}
								</span>
							))}
						</div>
					)}
				</div>
			)}

			{hasWiki && view === 'pages' && (
				<div className="flex flex-1 overflow-hidden">

					{/* Page list */}
					<div className="w-36 flex-shrink-0 border-r border-loophole-border overflow-y-auto py-1">
						{pages.map(page => (
							<PageListItem
								key={page.id}
								page={page}
								isSelected={page.id === selectedPageId}
								onSelect={() => handleSelectPage(page.id)}
								onUpdate={() => handleUpdatePage(page.id)}
							/>
						))}
					</div>

					{/* Page content */}
					<div className="flex-1 overflow-y-auto p-4">
						{selectedPage ? (
							<>
								<h1 className="text-base font-semibold text-loophole-fg-1 mb-1">{selectedPage.title}</h1>
								<div className="text-xs text-loophole-fg-3 mb-4">{selectedPage.description}</div>

								{selectedPage.status === 'generating' && (
									<div className="text-xs text-blue-400 animate-pulse mb-4">Writing this page...</div>
								)}

								{selectedPage.status === 'pending' && (
									<div className="text-xs text-loophole-fg-3 mb-4">Queued...</div>
								)}

								{(selectedPage.status === 'ready' || selectedPage.status === 'stale') && selectedPage.content && (
									<MarkdownContent content={selectedPage.content} />
								)}

								{selectedPage.status === 'error' && (
									<div className="text-xs text-red-400">{selectedPage.errorMessage}</div>
								)}

								{selectedPage.sourceFiles.length > 0 && (
									<div className="mt-6 pt-4 border-t border-loophole-border">
										<div className="text-xs text-loophole-fg-3 mb-1">Source files read</div>
										{selectedPage.sourceFiles.map(f => (
											<div key={f} className="text-xs text-loophole-fg-3 font-mono truncate">{f}</div>
										))}
									</div>
								)}
							</>
						) : (
							<div className="flex items-center justify-center h-full text-loophole-fg-3 text-sm">
								Select a page
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
