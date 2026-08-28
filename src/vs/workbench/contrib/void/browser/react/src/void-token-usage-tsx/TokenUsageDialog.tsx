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
    // 'YYYY-MM-DD' → 'Mar 29'
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Returns 5-6 nice Y-axis tick values covering 0..maxTokens */
function yAxisTicks(maxTokens: number): number[] {
    const steps = [
        100_000, 250_000, 500_000, 750_000,
        1_000_000, 1_500_000, 2_000_000, 5_000_000, 10_000_000,
    ];
    for (const step of steps) {
        const ticks: number[] = [];
        for (let v = 0; v <= maxTokens * 1.2; v += step) ticks.push(v);
        if (ticks.length >= 4 && ticks.length <= 7) return ticks;
    }
    const step = Math.ceil(maxTokens / 5 / 100_000) * 100_000 || 100_000;
    return Array.from({ length: 6 }, (_, i) => i * step);
}

const PAD = { top: 28, right: 20, bottom: 44, left: 68 };
const CHART_HEIGHT = 300; // SVG height in px

// ─── inner chart (memoisation-friendly) ─────────────────────────────────────

interface ChartProps {
    data: DailyTokenEntry[];
}

const UsageChart = ({ data }: ChartProps) => {
    const [svgWidth, setSvgWidth] = useState(720);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;
        const ro = new ResizeObserver(es => setSvgWidth(es[0].contentRect.width));
        ro.observe(svgRef.current);
        return () => ro.disconnect();
    }, []);

    const [tooltip, setTooltip] = useState<{
        px: number; py: number;
        entry: DailyTokenEntry; cumulative: number;
    } | null>(null);

    const plotW = svgWidth - PAD.left - PAD.right;
    const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

    const maxTok = data.length ? Math.max(...data.map(d => d.tokens)) : 1_000_000;
    const ticks = yAxisTicks(maxTok);
    const yMax = ticks[ticks.length - 1];

    const xOf = (i: number) =>
        PAD.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const yOf = (tok: number) =>
        PAD.top + plotH - (tok / yMax) * plotH;

    // SVG path strings
    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.tokens), d }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPath = pts.length
        ? `${linePath} L${pts.at(-1)!.x.toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.top + plotH).toFixed(1)}Z`
        : '';

    // Cumulative array
    let cum = 0;
    const cumByIdx = data.map(d => { cum += d.tokens; return cum; });

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        let ni = 0, nd = Infinity;
        pts.forEach((p, i) => {
            const dist = Math.abs(p.x - mx);
            if (dist < nd) { nd = dist; ni = i; }
        });
        setTooltip({ px: pts[ni].x, py: pts[ni].y, entry: data[ni], cumulative: cumByIdx[ni] });
    };

    const accent = '#10b981';
    const mutedColor = 'var(--loophole-fg-3)';
    const gridColor = 'var(--loophole-border-4)';

    // X label decimation
    const xStep = Math.max(1, Math.ceil(data.length / 9));

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width='100%'
                height={CHART_HEIGHT}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
                style={{ display: 'block', overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id='tug' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor={accent} stopOpacity={0.4} />
                        <stop offset='100%' stopColor={accent} stopOpacity={0.03} />
                    </linearGradient>
                </defs>

                {/* Y axis grid + labels */}
                {ticks.map(tick => {
                    const y = yOf(tick);
                    return (
                        <g key={tick}>
                            <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y}
                                stroke={gridColor} strokeWidth={1} strokeDasharray='4 4' />
                            <text x={PAD.left - 8} y={y + 4} textAnchor='end'
                                fontSize={10} fill={mutedColor}>
                                {formatTokenCount(tick)}
                            </text>
                        </g>
                    );
                })}

                {/* X axis date labels */}
                {data.map((d, i) => {
                    if (i % xStep !== 0 && i !== data.length - 1) return null;
                    return (
                        <text key={d.date} x={xOf(i)} y={PAD.top + plotH + 18}
                            textAnchor='middle' fontSize={10} fill={mutedColor}>
                            {toDateLabel(d.date)}
                        </text>
                    );
                })}

                {/* Area + line */}
                {areaPath && <path d={areaPath} fill='url(#tug)' />}
                {linePath && (
                    <path d={linePath} fill='none' stroke={accent}
                        strokeWidth={2.5} strokeLinejoin='round' strokeLinecap='round' />
                )}

                {/* Hover indicator */}
                {tooltip && (
                    <>
                        <line x1={tooltip.px} y1={PAD.top} x2={tooltip.px} y2={PAD.top + plotH}
                            stroke={accent} strokeWidth={1} strokeDasharray='4 3' opacity={0.6} />
                        <circle cx={tooltip.px} cy={tooltip.py} r={5}
                            fill={accent} stroke='var(--loophole-bg-2)' strokeWidth={2} />
                    </>
                )}
            </svg>

            {/* Floating tooltip card */}
            {tooltip && (() => {
                const cardW = 200;
                const flipLeft = tooltip.px + cardW + 20 > svgWidth;
                const left = flipLeft ? tooltip.px - cardW - 12 : tooltip.px + 12;
                const top = Math.max(PAD.top, tooltip.py - 52);
                return (
                    <div style={{
                        position: 'absolute', top, left,
                        width: cardW, pointerEvents: 'none',
                        background: 'var(--vscode-editorWidget-background)',
                        border: '1px solid var(--loophole-border-3)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                        fontSize: 11, zIndex: 10001,
                    }}>
                        <div style={{ fontWeight: 700, color: 'var(--loophole-fg-1)', marginBottom: 7 }}>
                            {toDateLabel(tooltip.entry.date)}
                        </div>
                        <Row label='Tokens' value={formatTokenCount(tooltip.entry.tokens)} fg />
                        {tooltip.entry.cost > 0 && (
                            <Row label='Est. cost' value={formatDollarCount(tooltip.entry.cost)} fg />
                        )}
                        <div style={{ borderTop: '1px solid var(--loophole-border-4)', marginTop: 7, paddingTop: 7 }}>
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

// ─── dialog shell ────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    _ts?: number; // changes every open so useEffect always fires
}

export const TokenUsageDialog = ({ isOpen: isOpenProp, _ts }: Props) => {
    const [isOpen, setIsOpen] = useState(isOpenProp);
    const isDark = useIsDark();
    const accessor = useAccessor();
    const tokenUsageService = accessor.get('ITokenUsageService');

    // Open when parent calls rerender({ isOpen: true })
    useEffect(() => {
        if (isOpenProp) setIsOpen(true);
    }, [isOpenProp, _ts]);

    // Close on Escape key
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

    return (
        // @@loophole-scope + dark class — same pattern as VoidOnboarding.tsx
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
                {/* Dialog card */}
                <div
                    style={{
                        background: 'var(--loophole-bg-2)',
                        border: '1px solid var(--loophole-border-3)',
                        borderRadius: 12,
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                        width: 'min(860px, 92vw)',
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
                                Daily token usage
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {/* Summary pills */}
                            <Pill label='Total tokens' value={formatTokenCount(totalTokens)} />
                            {totalCost > 0 && <Pill label='Est. cost' value={formatDollarCount(totalCost)} />}

                            {/* Close button */}
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
                    <div style={{ padding: '12px 24px 24px' }}>
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
                                <UsageChart data={dailyData} />
                            )}
                        </ErrorBoundary>
                    </div>
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
