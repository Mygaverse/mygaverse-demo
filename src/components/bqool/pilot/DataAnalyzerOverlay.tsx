'use client';

import React from 'react';
import { usePilot } from './PilotContext';
import { useDataAnalyzer } from './useDataAnalyzer';
import { BarChartFill, XCircle, CheckCircle, ArrowRight } from 'react-bootstrap-icons';

/**
 * Lightweight overlay — NO backdrop/blur.
 * Just a top instruction banner + floating Analyze button.
 * Zone rings are applied by each tab's parent wrapper using useAnalyzerZone().
 */
export function DataAnalyzerOverlay() {
    const { analyzerMode, pendingSelectedIds } = usePilot();
    const { cancelSelecting, runAnalysis } = useDataAnalyzer();

    if (analyzerMode === 'idle' || analyzerMode === 'results') return null;

    const selectedCount = pendingSelectedIds.size;

    return (
        <>
            {/* Top instruction banner */}
            <div className="fixed top-0 left-0 right-0 z-[2100] flex items-center justify-center p-2 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-2xl border border-indigo-500/50">
                    <BarChartFill size={16} className="text-yellow-300 shrink-0" />
                    <span className="text-sm font-semibold">
                        {analyzerMode === 'analyzing'
                            ? 'Analyzing selected data...'
                            : selectedCount > 0
                                ? `${selectedCount} row${selectedCount !== 1 ? 's' : ''} selected`
                                : 'Click a highlighted table, then click rows to select'}
                    </span>
                    <button
                        onClick={cancelSelecting}
                        className="ml-1 p-1 hover:bg-white/20 rounded-lg transition-colors"
                        title="Cancel"
                    >
                        <XCircle size={16} />
                    </button>
                </div>
            </div>

            {/* Floating Analyze button (bottom center) — only shown in selecting mode */}
            {analyzerMode === 'selecting' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2100] pointer-events-auto">
                    {selectedCount > 0 ? (
                        <button
                            onClick={runAnalysis}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm transition-all hover:scale-105 border border-indigo-400"
                        >
                            <CheckCircle size={16} />
                            Analyze {selectedCount} row{selectedCount !== 1 ? 's' : ''}
                            <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={runAnalysis}
                            className="flex items-center gap-2 bg-white/90 hover:bg-indigo-50 text-indigo-700 border border-indigo-300 px-5 py-2.5 rounded-xl shadow-lg font-semibold text-sm transition-all"
                        >
                            <CheckCircle size={16} />
                            Analyze all rows in selected table
                        </button>
                    )}
                </div>
            )}

            {/* Analyzing spinner */}
            {analyzerMode === 'analyzing' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2100]">
                    <div className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating insights...
                    </div>
                </div>
            )}
        </>
    );
}
