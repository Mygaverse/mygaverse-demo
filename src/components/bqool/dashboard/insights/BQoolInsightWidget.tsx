import React, { useState, useMemo } from 'react';
import { Lightbulb, ArrowRight, Stars, ArrowRepeat, GraphUpArrow, DashCircle, BarChartFill, TrophyFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { useBQoolInsight, Insight, InsightTab, SummarySection } from './useBQoolInsight';
import { UnifiedCampaign, UnifiedAdGroup, UnifiedProductAd, UnifiedTargeting, UnifiedSearchTerm } from '@/components/bqool/ad-manager/data/unifiedAdManagerData';
import { ParticleBackground } from '@/components/bqool/ui/ParticleBackground';
import { InsightActionModal } from './InsightActionModal';
import { AICreditsBlock, BASIC_PLAN_USAGE } from '@/components/bqool/pilot/AICreditsBlock';

interface BQoolInsightWidgetProps {
    campaigns: UnifiedCampaign[];
    adGroups: UnifiedAdGroup[];
    products: UnifiedProductAd[];
    targeting: UnifiedTargeting[];
    searchTerms: UnifiedSearchTerm[];
    stats: any[];
}

const TABS: { id: InsightTab; label: string }[] = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'targeting', label: 'Targeting' },
    { id: 'asins', label: 'ASINs' },
];

function SectionCard({ icon, title, text, className }: { icon: React.ReactNode; title: string; text: string; className: string }) {
    return (
        <div className={`rounded-lg p-3 border ${className}`}>
            <div className="flex items-center gap-2 mb-1.5">
                {icon}
                <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
            </div>
            <p className="text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function EntitySpotlight({ top, worst }: { top: string; worst: string }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 border border-green-200 bg-green-50 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <TrophyFill size={12} className="text-green-600 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-green-700">Top Performer</span>
                </div>
                <p className="text-xs text-green-800 font-medium leading-snug">{top}</p>
            </div>
            <div className="rounded-lg p-3 border border-red-200 bg-red-50 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <ExclamationTriangleFill size={12} className="text-red-500 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">Needs Attention</span>
                </div>
                <p className="text-xs text-red-800 font-medium leading-snug">{worst}</p>
            </div>
        </div>
    );
}

function SummaryContent({ summary }: { summary: SummarySection }) {
    return (
        <div className="space-y-3">
            <SectionCard
                icon={<BarChartFill size={13} className="text-blue-600" />}
                title="Metric Overview"
                text={summary.metricSummary}
                className="bg-blue-50 border-blue-100 text-blue-900"
            />
            <SectionCard
                icon={<GraphUpArrow size={13} className="text-indigo-600" />}
                title="Trend Analysis"
                text={summary.chartAnalysis}
                className="bg-indigo-50 border-indigo-100 text-indigo-900"
            />
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Stars size={12} className="text-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-600">Entity Spotlight</span>
                </div>
                <EntitySpotlight top={summary.entityPerformance.top} worst={summary.entityPerformance.worst} />
            </div>
        </div>
    );
}

export function BQoolInsightWidget({ campaigns, adGroups, products, targeting, searchTerms, stats }: BQoolInsightWidgetProps) {
    const [activeTab, setActiveTab] = useState<InsightTab>('campaigns');
    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

    const { summary, insights, loading, error, refetch } = useBQoolInsight({
        campaigns,
        searchTerms,
        targeting,
        productAds: products,
        stats,
        activeTab,
    });

    const demoSummary: SummarySection = {
        metricSummary: "Account ROAS is stable at 3.8 with $6,200 total spend and $23,560 in sales over the past 14 days. ACOS sits at 26%, which is within target range.",
        chartAnalysis: "Spend spiked mid-week (+18%) while sales remained flat, suggesting bid volatility. ROAS has been gradually declining over the last 5 days — monitor closely.",
        entityPerformance: {
            top: "Office Chair — ROAS 5.2, Spend $420",
            worst: "Gaming Headsets — ACOS 72%, wasted $310",
        }
    };

    const demoInsights: Insight[] = [
        { category: 'Caution Terms', message: 'High ACOS detected in "Gaming Headsets" campaign (45% vs 30% target).', cta: 'Add Negative Keyword', targetPage: '/bqool/ad-manager?tab=Campaigns&search=Gaming%20Headsets', metric: 'ACOS 45%', campaignName: 'Gaming Headsets' },
        { category: 'Possible Trend', message: 'Impressions rising for "Wireless Mouse" but conversion is low.', cta: 'Refine Targeting', targetPage: '/bqool/ad-manager?tab=Targeting', metric: 'CTR 0.2%', campaignName: 'Wireless Mouse' },
        { category: 'Good Trend', message: 'ROAS for "Office Chair" trending up (4.5x). Scale this winner.', cta: 'Increase Budget', targetPage: '/bqool/budget-manager', metric: 'ROAS 4.5', campaignName: 'Office Chair' },
    ];

    const shouldUseDemoData = error || campaigns.length === 0;
    const displaySummary: SummarySection | null = summary || (shouldUseDemoData ? demoSummary : null);
    const displayInsights: Insight[] = insights.length > 0 ? insights : (shouldUseDemoData ? demoInsights : []);

    const modalData = useMemo(() => {
        if (!selectedInsight) return null;

        if (activeTab === 'campaigns') {
            const campaign = campaigns.find(c => c.name === selectedInsight.campaignName)
                || campaigns.find(c => selectedInsight.message.includes(c.name));
            if (!campaign) return { campaign: undefined, adGroups: [], products: [], targeting: [], searchTerms: [], matchedTargeting: [], matchedProducts: [] };
            return {
                campaign,
                adGroups: adGroups.filter(ag => ag.campaignId === campaign.id),
                products: products.filter(p => p.campaignId === campaign.id),
                targeting: targeting.filter(t => t.campaignId === campaign.id),
                searchTerms: searchTerms.filter(st => st.campaignId === campaign.id),
                matchedTargeting: [],
                matchedProducts: [],
            };
        }

        if (activeTab === 'targeting') {
            const entityName = selectedInsight.campaignName || '';
            const matched = targeting.filter(t =>
                entityName && t.targetingText?.toLowerCase().includes(entityName.toLowerCase())
            );
            const rows = matched.length > 0 ? matched : [...targeting].sort((a, b) => b.spend - a.spend).slice(0, 10);
            return { campaign: undefined, adGroups: [], products: [], targeting: [], searchTerms: [], matchedTargeting: rows, matchedProducts: [] };
        }

        if (activeTab === 'asins') {
            const entityName = selectedInsight.campaignName || '';
            const matched = products.filter(p =>
                entityName && (p.asin?.toLowerCase().includes(entityName.toLowerCase()) || p.productName?.toLowerCase().includes(entityName.toLowerCase()))
            );
            const rows = matched.length > 0 ? matched : [...products].sort((a, b) => b.spend - a.spend).slice(0, 10);
            return { campaign: undefined, adGroups: [], products: [], targeting: [], searchTerms: [], matchedTargeting: [], matchedProducts: rows };
        }

        return null;
    }, [selectedInsight, activeTab, campaigns, adGroups, products, targeting, searchTerms]);

    if (!displaySummary && displayInsights.length === 0 && !loading) return null;

    return (
        <>
            <div className="relative group mb-8 rounded-xl overflow-hidden shadow-xl border border-indigo-900/20">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 z-0">
                    <ParticleBackground speed={loading ? 4 : 0.5} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-border-flow pointer-events-none z-10" style={{ backgroundSize: '200% 100%' }}></div>

                <div className="relative z-20 p-6 md:p-8">

                    {/* Header: title/icon left | tabs + regenerate right */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-white">
                        {/* Left: icon + title + credit chips */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm border border-indigo-400/30">
                                <Stars size={20} className="text-yellow-300" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl tracking-wide text-white">BQool Insight</h2>
                                <p className="text-indigo-200 text-xs font-medium">AI-Powered Optimization by Gemini 2.5 Flash</p>
                            </div>
                            {/* Credit chips — right of title */}
                            <div className="flex items-center gap-2 text-[11px] ml-1">
                                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5">
                                    <Stars size={11} className="text-yellow-300 shrink-0" />
                                    <span className="text-white/70">Insight</span>
                                    <span className="font-bold text-white">0</span>
                                    <span className="text-white/50">/1 free</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5">
                                    <span className="text-white/70">Credits</span>
                                    <span className="font-bold text-white">2</span>
                                    <span className="text-white/50">/10</span>
                                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden ml-0.5">
                                        <div className="h-full bg-green-400 rounded-full" style={{ width: '20%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: tabs + regenerate */}
                        <div className="flex items-center gap-5">
                            {/* Tab pills — each tab fixed equal width */}
                            <div className="flex items-center bg-white/10 rounded-lg p-1 backdrop-blur-sm border border-white/10">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        disabled={loading}
                                        className={`w-24 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed text-center
                                            ${activeTab === tab.id
                                                ? 'bg-white/20 text-white shadow-sm'
                                                : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Regenerate button */}
                            <button
                                onClick={refetch}
                                disabled={loading}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
                            >
                                {loading ? <Stars className="animate-spin" size={16} /> : <ArrowRepeat size={16} />}
                                <span className="hidden sm:inline">{loading ? 'Generating...' : 'Regenerate'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Two-panel grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

                        {/* LEFT: Structured Summary */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-indigo-100 flex flex-col transform transition-all hover:scale-[1.01]">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 shrink-0">
                                Executive Summary
                            </h3>
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 gap-3 py-8">
                                    <Stars size={32} className="animate-pulse" />
                                    <p className="text-sm">Scanning for opportunities...</p>
                                </div>
                            ) : displaySummary ? (
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <SummaryContent summary={displaySummary} />
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No data available.</div>
                            )}
                        </div>

                        {/* RIGHT: Actionable Opportunities */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-indigo-100 flex flex-col transform transition-all hover:scale-[1.01]">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 shrink-0">
                                Actionable Opportunities
                            </h3>
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 gap-3 py-8">
                                    <Stars size={32} className="animate-pulse" />
                                    <p className="text-sm">Scanning for opportunities...</p>
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar flex-1">
                                    {displayInsights.map((insight, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white group/card">
                                            <div className="flex items-start gap-3 w-full">
                                                <div className="shrink-0 mt-1">
                                                    {insight.category === 'Caution Terms' && <DashCircle className="text-red-500 drop-shadow-sm" size={18} />}
                                                    {insight.category === 'Possible Trend' && <Lightbulb className="text-amber-500 drop-shadow-sm" size={18} />}
                                                    {insight.category === 'Good Trend' && <GraphUpArrow className="text-green-500 drop-shadow-sm" size={18} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded
                                                            ${insight.category === 'Caution Terms' ? 'bg-red-100 text-red-600' : ''}
                                                            ${insight.category === 'Possible Trend' ? 'bg-amber-100 text-amber-600' : ''}
                                                            ${insight.category === 'Good Trend' ? 'bg-green-100 text-green-600' : ''}
                                                        `}>
                                                            {insight.category}
                                                        </span>
                                                        {insight.metric && <span className="text-xs text-gray-400 font-mono">{insight.metric}</span>}
                                                    </div>
                                                    <p className="text-gray-800 text-sm font-medium leading-relaxed">{insight.message}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedInsight(insight)}
                                                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 px-4 py-2.5 rounded-lg shadow-sm transition-all hover:border-indigo-300 mt-1"
                                            >
                                                {insight.cta}
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <style jsx>{`
                    @keyframes border-flow {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 200% 50%; }
                    }
                    .animate-border-flow {
                        animation: border-flow 4s linear infinite;
                    }
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
                `}</style>
            </div>

            {selectedInsight && modalData && (
                <InsightActionModal
                    isOpen={!!selectedInsight}
                    onClose={() => setSelectedInsight(null)}
                    insight={selectedInsight!}
                    activeTab={activeTab}
                    campaign={modalData!.campaign}
                    adGroups={modalData!.adGroups}
                    products={modalData!.products}
                    targeting={modalData!.targeting}
                    searchTerms={modalData!.searchTerms}
                    matchedTargeting={modalData!.matchedTargeting}
                    matchedProducts={modalData!.matchedProducts}
                />
            )}
        </>
    );
}
