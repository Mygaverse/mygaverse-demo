'use client';

import React from 'react';
import { usePilot, AnalyzerResult } from './PilotContext';
import { useDataAnalyzer } from './useDataAnalyzer';
import { BarChartFill, GraphUpArrow, TrophyFill, ExclamationTriangleFill, Lightbulb, DashCircle, ArrowCounterclockwise } from 'react-bootstrap-icons';

function OpportunityCard({ op }: { op: { category: string; message: string; cta: string } }) {
    const colors = {
        'Good Trend': { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: <GraphUpArrow className="text-green-500" size={16} /> },
        'Possible Trend': { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: <Lightbulb className="text-amber-500" size={16} /> },
        'Caution Terms': { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: <DashCircle className="text-red-500" size={16} /> },
    };
    const style = colors[op.category as keyof typeof colors] || colors['Possible Trend'];

    return (
        <div className={`${style.bg} ${style.border} border rounded-xl p-3 space-y-2`}>
            <div className="flex items-start gap-2">
                <div className="shrink-0 mt-0.5">{style.icon}</div>
                <div className="flex-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${style.badge}`}>
                        {op.category}
                    </span>
                    <p className="text-gray-800 text-sm mt-1.5 leading-snug">{op.message}</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                    {op.cta}
                </span>
            </div>
        </div>
    );
}

export function DataAnalyzerResults() {
    const { analyzerResult } = usePilot();
    const { resetAnalyzer, startSelecting } = useDataAnalyzer();

    if (!analyzerResult) return null;
    const r = analyzerResult;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-indigo-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChartFill size={14} className="text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-800">Data Analyzer</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={startSelecting}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                    >
                        <ArrowCounterclockwise size={12} />
                        Analyze Again
                    </button>
                    <button
                        onClick={resetAnalyzer}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Scrollable results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Zone info */}
                <div className="text-xs text-gray-500 font-medium">
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{r.zoneLabel}</span>
                    {' '}&bull;{' '}{r.rowCount} row{r.rowCount !== 1 ? 's' : ''} analyzed
                </div>

                {/* Metric Summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        <BarChartFill size={12} className="text-blue-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Metric Overview</span>
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">{r.metricSummary}</p>
                </div>

                {/* Chart / Trend Analysis */}
                {r.chartAnalysis && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <GraphUpArrow size={12} className="text-indigo-600" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Trend Analysis</span>
                        </div>
                        <p className="text-sm text-indigo-900 leading-relaxed">{r.chartAnalysis}</p>
                    </div>
                )}

                {/* Entity Spotlight */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Entity Spotlight</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                                <TrophyFill size={10} className="text-green-600" />
                                <span className="text-[9px] font-bold uppercase text-green-700">Top</span>
                            </div>
                            <p className="text-xs text-green-900 font-medium leading-snug">{r.entityPerformance.top}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                                <ExclamationTriangleFill size={10} className="text-red-500" />
                                <span className="text-[9px] font-bold uppercase text-red-600">Needs Attention</span>
                            </div>
                            <p className="text-xs text-red-900 font-medium leading-snug">{r.entityPerformance.worst}</p>
                        </div>
                    </div>
                </div>

                {/* Opportunities */}
                {r.opportunities.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                            Actionable Opportunities
                        </div>
                        <div className="space-y-2">
                            {r.opportunities.map((op, i) => (
                                <OpportunityCard key={i} op={op} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
