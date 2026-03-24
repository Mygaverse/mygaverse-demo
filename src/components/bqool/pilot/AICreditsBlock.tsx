'use client';

import React from 'react';
import { Stars, CreditCard2Front, Infinity } from 'react-bootstrap-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AIFeatureUsage {
    /** Display label for this feature row */
    label: string;
    /** Times used this month (free tier) */
    freeUsed: number;
    /** Monthly free allowance (0 = feature is always free) */
    freeLimit: number;
    /** Always free = no limit counter shown */
    alwaysFree?: boolean;
}

export interface AICreditsBlockProps {
    /** Per-feature monthly free usage */
    features: AIFeatureUsage[];
    /** AI credits consumed this month */
    creditsUsed: number;
    /** Total credits available in current plan */
    creditsTotal: number;
    /** Current plan label */
    plan?: string;
    /** Visual variant */
    variant?: 'dark' | 'light';
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────
function UsageBar({ used, total, color }: { used: number; total: number; color: string }) {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return (
        <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AICreditsBlock({
    features,
    creditsUsed,
    creditsTotal,
    plan = 'Basic',
    variant = 'dark',
}: AICreditsBlockProps) {
    const isDark = variant === 'dark';

    const wrap = isDark
        ? 'bg-white/10 border border-white/15 text-white'
        : 'bg-gray-50 border border-gray-200 text-gray-800';

    const labelClass = isDark ? 'text-white/70' : 'text-gray-500';
    const valueClass = isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold';
    const barFree = isDark ? 'bg-yellow-300' : 'bg-indigo-400';
    const barCredit = isDark ? 'bg-green-400' : 'bg-green-500';
    const dividerClass = isDark ? 'border-white/10' : 'border-gray-200';

    const creditPct = creditsTotal > 0 ? Math.min(100, Math.round((creditsUsed / creditsTotal) * 100)) : 0;

    return (
        <div className={`rounded-xl p-3 ${wrap} text-xs`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <Stars size={12} className={isDark ? 'text-yellow-300' : 'text-indigo-500'} />
                    <span className={`font-bold uppercase tracking-wide text-[10px] ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                        AI Usage
                    </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border
          ${isDark ? 'bg-white/10 border-white/20 text-white/70' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                    {plan}
                </span>
            </div>

            {/* Per-feature free usage */}
            <div className="space-y-2 mb-3">
                {features.map(f => (
                    <div key={f.label}>
                        <div className="flex items-center justify-between mb-0.5">
                            <span className={labelClass}>{f.label}</span>
                            {f.alwaysFree ? (
                                <span className={`flex items-center gap-0.5 ${isDark ? 'text-green-300' : 'text-green-600'} font-semibold`}>
                                    <Infinity size={10} /> Free
                                </span>
                            ) : (
                                <span className={valueClass}>
                                    {f.freeUsed}<span className={`font-normal ${labelClass}`}>/{f.freeLimit} free</span>
                                </span>
                            )}
                        </div>
                        {!f.alwaysFree && <UsageBar used={f.freeUsed} total={f.freeLimit} color={barFree} />}
                    </div>
                ))}
            </div>

            {/* Credits section */}
            <div className={`border-t pt-2 ${dividerClass}`}>
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`flex items-center gap-1 ${labelClass}`}>
                        <CreditCard2Front size={10} /> Credits
                    </span>
                    <span className={valueClass}>
                        {creditsUsed}<span className={`font-normal ${labelClass}`}>/{creditsTotal}</span>
                    </span>
                </div>
                <UsageBar used={creditsUsed} total={creditsTotal} color={barCredit} />
                <p className={`mt-1 text-[10px] ${labelClass}`}>
                    {creditPct >= 80
                        ? '⚠ Credits running low — consider upgrading.'
                        : `${creditsTotal - creditsUsed} credits remaining this month.`}
                </p>
            </div>
        </div>
    );
}

// ─── Default mock data for Basic plan ────────────────────────────────────────
export const BASIC_PLAN_USAGE: Omit<AICreditsBlockProps, 'variant'> = {
    plan: 'Basic',
    features: [
        { label: 'Insight', freeUsed: 0, freeLimit: 1 },
        { label: 'Data Analyzer', freeUsed: 0, freeLimit: 1 },
        { label: 'Data Finder', freeUsed: 0, freeLimit: 1 },
        { label: 'Help Center', freeUsed: 0, freeLimit: 0, alwaysFree: true },
    ],
    creditsUsed: 2,
    creditsTotal: 10,
};
