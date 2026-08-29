/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Garv Agnihotri, Inc. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessor, useIsDark } from '../util/services.js';
import { DailyTokenEntry, formatTokenCount, formatDollarCount } from '../../../../common/tokenUsageService.js';
import { X } from 'lucide-react';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateLabel(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function yAxisTicks(_maxTokens: number): number[] {
    return [0, 250_000, 500_000, 1_000_000, 3_000_000, 5_000_000, 10_000_000];
}

// ─── model colour palette (matches the OpenRouter style) ────────────────────

const MODEL_COLORS = [
    '#3b82f6', // blue
    '#f97316', // orange
    '#eab308', // yellow
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f43f5e', // rose
    '#84cc16', // lime
    '#a855f7', // purple
    '#14b8a6', // teal
    '#fb923c', // light orange
    '#6366f1', // indigo
    '#22c55e', // green
    '#e879f9', // fuchsia
];

function getModelColor(index: number): string {
    return MODEL_COLORS[index % MODEL_COLORS.length];
}

// Build stable model→color map from the full dataset
function buildColorMap(data: DailyTokenEntry[]): Map<string, string> {
    // Collect all models, sorted by total usage descending so top models get consistent colours
    const totals = new Map<string, number>();
    for (const day of data) {
        for (const m of day.models) {
            totals.set(m.modelName, (totals.get(m.modelName) ?? 0) + m.tokens);
        }
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const map = new Map<string, string>();
    sorted.forEach(([name], i) => map.set(name, getModelColor(i)));
    return map;
}

const PAD = { top: 28, right: 20, bottom: 44, left: 68 };
const CHART_HEIGHT = 320;

// ─── stacked bar chart ───────────────────────────────────────────────────────

interface ChartProps {
    data: DailyTokenEntry[];
    colorMap: Map<string, string>;
}

const UsageChart = ({ data, colorMap }: ChartProps) => {
    const [svgWidth, setSvgWidth] = useState(720);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;
        const ro = new ResizeObserver(es => setSvgWidth(es[0].contentRect.width));
        ro.observe(svgRef.current);
        return () => ro.disconnect();
    }, []);

    const [tooltip, setTooltip] = useState<{
        px: number; barRight: number;
        entry: DailyTokenEntry; cumulative: number;
    } | null>(null);

    const plotW = svgWidth - PAD.left - PAD.right;
    const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

    const maxTok = data.length ? Math.max(...data.map(d => d.tokens)) : 1_000_000;
    const ticks = yAxisTicks(maxTok);
    const yMax = ticks[ticks.length - 1];

    const yOf = (tok: number) => PAD.top + plotH - (tok / yMax) * plotH;

    // Bar geometry
    const totalBars = data.length || 1;
    const barGap = Math.max(1, plotW / totalBars * 0.15);
    const barW = Math.max(2, plotW / totalBars - barGap);

    const xOf = (i: number) => PAD.left + i * (barW + barGap) + barGap / 2;

    // Cumulative totals
    let cum = 0;
    const cumByIdx = data.map(d => { cum += d.tokens; return cum; });

    const mutedColor = 'var(--loophole-fg-3)';

    const xStep = Math.max(1, Math.ceil(data.length / 9));

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        // Find closest bar centre
        let ni = 0, nd = Infinity;
        data.forEach((_, i) => {
            const cx = xOf(i) + barW / 2;
            const dist = Math.abs(cx - mx);
            if (dist < nd) { nd = dist; ni = i; }
        });
        const bx = xOf(ni);
        setTooltip({ px: bx + barW / 2, barRight: bx + barW, entry: data[ni], cumulative: cumByIdx[ni] });
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width='100%'
                height={CHART_HEIGHT}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
                style={{ display: 'block', overflow: 'visible' }}
            >
                {/* Y axis labels only — no grid lines */}
                {ticks.map(tick => {
                    const y = yOf(tick);
                    return (
                        <text key={tick} x={PAD.left - 8} y={y + 4} textAnchor='end'
                            fontSize={10} fill={mutedColor}>
                            {formatTokenCount(tick)}
                        </text>
                    );
                })}

                {/* X axis date labels */}
                {data.map((d, i) => {
                    if (i % xStep !== 0 && i !== data.length - 1) return null;
                    return (
                        <text key={d.date} x={xOf(i) + barW / 2} y={PAD.top + plotH + 18}
                            textAnchor='middle' fontSize={10} fill={mutedColor}>
                            {toDateLabel(d.date)}
                        </text>
                    );
                })}

                {/* Stacked bars */}
                {data.map((day, i) => {
                    const bx = xOf(i);
                    let yBottom = PAD.top + plotH; // start from baseline

                    // Sort models for stable stacking (largest at bottom)
                    const sorted = [...day.models].sort((a, b) => b.tokens - a.tokens);

                    return (
                        <g key={day.date}>
                            {sorted.map(model => {
                                const segH = (model.tokens / yMax) * plotH;
                                const segY = yBottom - segH;
                                yBottom -= segH;
                                const color = colorMap.get(model.modelName) ?? '#888';
                                const isHovered = tooltip?.entry.date === day.date;
                                return (
                                    <rect
                                        key={model.modelName}
                                        x={bx} y={segY}
                                        width={barW} height={Math.max(0, segH)}
                                        fill={color}
                                        opacity={isHovered ? 1 : 0.85}
                                        rx={i === 0 || i === data.length - 1 ? 1 : 0}
                                    />
                                );
                            })}
                            {/* Invisible wide hover target */}
                            <rect
                                x={bx - barGap / 2} y={PAD.top}
                                width={barW + barGap} height={plotH}
                                fill='transparent'
                            />
                        </g>
                    );
                })}

                {/* Hover highlight line at top of bar */}
                {tooltip && (() => {
                    const bx = xOf(data.findIndex(d => d.date === tooltip.entry.date));
                    return (
                        <rect
                            x={bx} y={PAD.top}
                            width={barW} height={plotH}
                            fill='white' fillOpacity={0.06}
                            pointerEvents='none'
                        />
                    );
                })()}
            </svg>

            {/* Floating tooltip card — fully clamped so it never escapes the container */}
            {tooltip && (() => {
                const cardW = 220;
                const containerH = containerRef.current?.offsetHeight ?? CHART_HEIGHT;
                const tooltipH = tooltipRef.current?.offsetHeight ?? 160;

                // Horizontal: prefer right of bar, flip left if it would clip
                const spaceRight = svgWidth - tooltip.barRight;
                const preferRight = spaceRight >= cardW + 12;
                let left = preferRight
                    ? tooltip.barRight + 8
                    : tooltip.px - barW / 2 - cardW - 8;
                // Hard clamp so it never exits the container on either side
                left = Math.max(0, Math.min(left, svgWidth - cardW));

                // Vertical: start at top of chart area, clamp so bottom never exits container
                let top = PAD.top + 4;
                top = Math.min(top, containerH - tooltipH - 8);
                top = Math.max(0, top);

                return (
                    <div
                        ref={tooltipRef}
                        style={{
                            position: 'absolute', top, left,
                            width: cardW, pointerEvents: 'none',
                            background: 'var(--vscode-editorWidget-background)',
                            border: '1px solid var(--loophole-border-3)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                            fontSize: 11, zIndex: 10001,
                            // Never let tooltip itself overflow its parent
                            maxHeight: containerH - 16,
                            overflowY: 'auto',
                        }}
                    >
                        <div style={{ fontWeight: 700, color: 'var(--loophole-fg-1)', marginBottom: 8 }}>
                            {toDateLabel(tooltip.entry.date)}
                        </div>

                        {/* Per-model rows */}
                        {[...tooltip.entry.models]
                            .sort((a, b) => b.tokens - a.tokens)
                            .map(model => (
                                <div key={model.modelName} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                                        background: colorMap.get(model.modelName) ?? '#888',
                                    }} />
                                    <span style={{ color: 'var(--loophole-fg-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {model.modelName}
                                    </span>
                                    <span style={{ color: 'var(--loophole-fg-1)', fontWeight: 600, flexShrink: 0 }}>
                                        {formatTokenCount(model.tokens)}
                                    </span>
                                </div>
                            ))}

                        <div style={{ borderTop: '1px solid var(--loophole-border-4)', marginTop: 6, paddingTop: 6 }}>
                            <Row label='Total' value={formatTokenCount(tooltip.entry.tokens)} fg />
                            {tooltip.entry.cost > 0 && (
                                <Row label='Est. cost' value={formatDollarCount(tooltip.entry.cost)} fg />
                            )}
                            <Row label='Cumulative' value={formatTokenCount(tooltip.cumulative)} accent />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

const Row = ({ label, value, fg, accent }: { label: string; value: string; fg?: boolean; accent?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ color: 'var(--loophole-fg-3)' }}>{label}</span>
        <span style={{
            color: accent ? '#10b981' : fg ? 'var(--loophole-fg-1)' : 'var(--loophole-fg-2)',
            fontWeight: 600,
        }}>{value}</span>
    </div>
);

// ─── model legend ────────────────────────────────────────────────────────────

const Legend = ({ colorMap }: { colorMap: Map<string, string> }) => {
    if (colorMap.size === 0) return null;
    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
            padding: '0 24px 16px',
        }}>
            {Array.from(colorMap.entries()).map(([name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--loophole-fg-2)' }}>{name}</span>
                </div>
            ))}
        </div>
    );
};

// ─── dialog shell ────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    _ts?: number;
}

export const TokenUsageDialog = ({ isOpen: isOpenProp, _ts }: Props) => {
    const [isOpen, setIsOpen] = useState(isOpenProp);
    const isDark = useIsDark();
    const accessor = useAccessor();
    const tokenUsageService = accessor.get('ITokenUsageService');

    useEffect(() => {
        if (isOpenProp) setIsOpen(true);
    }, [isOpenProp, _ts]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    const [dailyData, setDailyData] = useState<DailyTokenEntry[]>(() =>
        tokenUsageService.getDailyUsage()
    );

    useEffect(() => {
        const d = tokenUsageService.onTokenUsageChanged(() =>
            setDailyData(tokenUsageService.getDailyUsage())
        );
        return () => d.dispose();
    }, [tokenUsageService]);

    const close = useCallback(() => setIsOpen(false), []);

    const totalTokens = tokenUsageService.getTotalTokensUsed();
    const totalCost = tokenUsageService.getEstimatedCost();

    // Build stable colour map from full dataset
    const colorMap = buildColorMap(dailyData);

    return (
        <div className={`@@loophole-scope ${isDark ? 'dark' : ''}`}>
            <div
                style={{
                    position: 'fixed', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    zIndex: 9999,
                    pointerEvents: isOpen ? 'all' : 'none',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                }}
                onClick={close}
            >
                <div
                    style={{
                        background: 'var(--loophole-bg-2)',
                        border: '1px solid var(--loophole-border-3)',
                        borderRadius: 12,
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                        width: 'min(880px, 92vw)',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        transform: isOpen ? 'scale(1)' : 'scale(0.97)',
                        transition: 'transform 0.15s ease',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{ padding: '20px 24px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--loophole-fg-1)' }}>
                                Your Usage
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--loophole-fg-3)', marginTop: 2 }}>
                                Daily token usage by model
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Pill label='Total tokens' value={formatTokenCount(totalTokens)} />
                            {totalCost > 0 && <Pill label='Est. cost' value={formatDollarCount(totalCost)} />}
                            <button
                                onClick={close}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--loophole-fg-3)', padding: '4px 6px', borderRadius: 6,
                                    display: 'flex', alignItems: 'center',
                                }}
                                title='Close (Esc)'
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Chart */}
                    <div style={{ padding: '12px 24px 8px' }}>
                        <ErrorBoundary>
                            {dailyData.length === 0 ? (
                                <div style={{
                                    height: CHART_HEIGHT,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--loophole-fg-3)', fontSize: 13,
                                }}>
                                    No usage recorded yet. Start a chat to see your token usage here.
                                </div>
                            ) : (
                                <UsageChart data={dailyData} colorMap={colorMap} />
                            )}
                        </ErrorBoundary>
                    </div>

                    {/* Legend */}
                    <Legend colorMap={colorMap} />
                </div>
            </div>
        </div>
    );
};

const Pill = ({ label, value }: { label: string; value: string }) => (
    <div style={{
        background: 'var(--loophole-bg-1)',
        borderRadius: 6, padding: '5px 12px', fontSize: 11,
        display: 'flex', gap: 6,
    }}>
        <span style={{ color: 'var(--loophole-fg-3)' }}>{label}</span>
        <span style={{ color: 'var(--loophole-fg-1)', fontWeight: 600 }}>{value}</span>
    </div>
);