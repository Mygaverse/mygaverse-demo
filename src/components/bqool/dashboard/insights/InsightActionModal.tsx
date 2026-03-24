import React, { useState } from 'react';
import { X, Lightbulb, ExclamationTriangle, CheckCircle, FileEarmarkText, Bullseye, Search, DashCircle, GraphUpArrow } from 'react-bootstrap-icons';
import { Insight, InsightTab } from './useBQoolInsight';
import { UnifiedCampaign, UnifiedAdGroup, UnifiedProductAd, UnifiedTargeting, UnifiedSearchTerm } from '@/components/bqool/ad-manager/data/unifiedAdManagerData';

interface InsightActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    insight: Insight;
    activeTab: InsightTab;
    // Campaign tab data
    campaign?: UnifiedCampaign;
    adGroups: UnifiedAdGroup[];
    products: UnifiedProductAd[];
    targeting: UnifiedTargeting[];
    searchTerms: UnifiedSearchTerm[];
    // Targeting tab data
    matchedTargeting?: UnifiedTargeting[];
    // ASIN tab data
    matchedProducts?: UnifiedProductAd[];
}

function NoContextCard({ label }: { label: string }) {
    return (
        <div className="bg-amber-50 rounded-xl p-8 border border-amber-100 flex flex-col items-center justify-center text-center">
            <ExclamationTriangle size={32} className="text-amber-400 mb-3" />
            <h3 className="text-amber-800 font-bold mb-1">{label} Context Not Found</h3>
            <p className="text-amber-700 max-w-md">
                We couldn't automatically link this insight to a specific {label.toLowerCase()} in your current view.
                Please use the button below to visit the relevant page manually.
            </p>
        </div>
    );
}

export function InsightActionModal({
    isOpen, onClose, insight, activeTab,
    campaign, adGroups, products, targeting, searchTerms,
    matchedTargeting, matchedProducts
}: InsightActionModalProps) {
    if (!isOpen) return null;

    // Campaign controls
    const [budget, setBudget] = useState(campaign?.budget || 50);
    const [bidAdj, setBidAdj] = useState(0);
    const [autoHarvest, setAutoHarvest] = useState(false);
    // Targeting controls
    const [targetingBid, setTargetingBid] = useState(0.50);
    const [targetingPaused, setTargetingPaused] = useState(false);
    const [addAsNegative, setAddAsNegative] = useState(false);
    // ASIN controls
    const [asinEnabled, setAsinEnabled] = useState(true);
    const [asinBidAdj, setAsinBidAdj] = useState(0);
    const [asinAutoHarvest, setAsinAutoHarvest] = useState(false);

    const getColor = () => {
        if (insight.category === 'Good Trend') return 'bg-green-600';
        if (insight.category === 'Possible Trend') return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getIcon = () => {
        if (insight.category === 'Good Trend') return <GraphUpArrow size={20} className="text-white" />;
        if (insight.category === 'Possible Trend') return <Lightbulb size={20} className="text-white" />;
        return <ExclamationTriangle size={20} className="text-white" />;
    };

    const tabLabel =
        activeTab === 'campaigns' ? 'Campaign'
            : activeTab === 'targeting' ? 'Targeting'
                : 'ASIN';

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`${getColor()} px-6 py-4 flex items-center justify-between shadow-md z-10`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">{getIcon()}</div>
                        <div>
                            <h2 className="text-white font-bold text-lg">{insight.category}</h2>
                            <p className="text-white/80 text-xs font-medium">{tabLabel} Analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-gray-50/50">

                    {/* Analysis + Recommended Action — same for all tabs */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Analysis</h3>
                        <p className="text-gray-800 text-lg font-medium leading-relaxed mb-4">{insight.message}</p>
                        <div className="flex items-start gap-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <div className="shrink-0 mt-1 text-indigo-600"><CheckCircle size={20} /></div>
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">Recommended Action</h4>
                                <p className="text-indigo-700 text-sm">{insight.cta} to improve performance based on current trends.</p>
                            </div>
                        </div>
                    </div>

                    {/* ── CAMPAIGNS TAB ── */}
                    {activeTab === 'campaigns' && (
                        campaign ? (
                            <>
                                {/* Campaign header */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{campaign.name}</h3>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="px-2 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">{campaign.storeName}</span>
                                                    <span className={`px-2 py-0.5 rounded font-medium ${campaign.status === 'ENABLED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {campaign.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-center">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">ACOS</p>
                                                <p className={`font-bold ${campaign.acos > 30 ? 'text-red-600' : 'text-gray-800'}`}>{campaign.acos.toFixed(1)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">ROAS</p>
                                                <p className="font-bold text-gray-800">{campaign.roas.toFixed(2)}x</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Sales</p>
                                                <p className="font-bold text-gray-800">${campaign.sales.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign controls */}
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Daily Budget</label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setBudget(b => Math.max(1, b - 5))} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">-</button>
                                                <div className="flex-1 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-700">${budget}</div>
                                                <button onClick={() => setBudget(b => b + 5)} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">+</button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Adjust Base Bids</label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setBidAdj(b => b - 0.05)} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">-</button>
                                                <div className="flex-1 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-700">{bidAdj > 0 ? '+' : ''}{bidAdj.toFixed(2)}</div>
                                                <button onClick={() => setBidAdj(b => b + 0.05)} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">+</button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Auto-Harvesting</label>
                                            <div className="flex items-center gap-3 h-8">
                                                <div
                                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${autoHarvest ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    onClick={() => setAutoHarvest(!autoHarvest)}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${autoHarvest ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">{autoHarvest ? 'Enabled' : 'Disabled'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Campaign structure table */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-bold text-gray-700 text-sm">Campaign Structure Details</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">Ad Group</th>
                                                    <th className="px-5 py-3 font-medium">Products</th>
                                                    <th className="px-5 py-3 font-medium">Targeting</th>
                                                    <th className="px-5 py-3 font-medium">Search Terms</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {adGroups.map(ag => {
                                                    const agProducts = products.filter(p => p.adGroupId === ag.id);
                                                    const agTargeting = targeting.filter(t => t.adGroupId === ag.id);
                                                    const agSearchTerms = searchTerms.filter(st => st.adGroupId === ag.id);
                                                    return (
                                                        <tr key={ag.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-4 align-top">
                                                                <div className="font-medium text-gray-800">{ag.name}</div>
                                                                <div className="text-xs text-gray-500 mt-1">Default Bid: ${ag.defaultBid}</div>
                                                            </td>
                                                            <td className="px-5 py-4 align-top">
                                                                <div className="space-y-1">
                                                                    {agProducts.slice(0, 3).map(p => (
                                                                        <div key={p.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 w-fit">
                                                                            <FileEarmarkText size={10} />
                                                                            <span className="truncate max-w-[150px]">{p.productName || p.asin}</span>
                                                                        </div>
                                                                    ))}
                                                                    {agProducts.length > 3 && <div className="text-xs text-gray-400 pl-1">+{agProducts.length - 3} more</div>}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 align-top">
                                                                <div className="space-y-1">
                                                                    {agTargeting.slice(0, 3).map(t => (
                                                                        <div key={t.id} className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit">
                                                                            <Bullseye size={10} className="text-blue-400" />
                                                                            <span className="truncate max-w-[150px]">{t.targetingText}</span>
                                                                        </div>
                                                                    ))}
                                                                    {agTargeting.length > 3 && <div className="text-xs text-gray-400 pl-1">+{agTargeting.length - 3} more</div>}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 align-top">
                                                                <div className="space-y-1">
                                                                    {agSearchTerms.slice(0, 3).map(st => (
                                                                        <div key={st.id} className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 px-2 py-1 rounded border border-green-100 w-fit">
                                                                            <Search size={10} className="text-green-400" />
                                                                            <span className="truncate max-w-[150px]">{st.searchTerm}</span>
                                                                        </div>
                                                                    ))}
                                                                    {agSearchTerms.length > 3 && <div className="text-xs text-gray-400 pl-1">+{agSearchTerms.length - 3} more</div>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {adGroups.length === 0 && (
                                                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 italic">No ad groups found in this campaign.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <NoContextCard label="Campaign" />
                        )
                    )}

                    {/* ── TARGETING TAB ── */}
                    {activeTab === 'targeting' && (
                        matchedTargeting && matchedTargeting.length > 0 ? (
                            <>
                                {/* Targeting Action Controls */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-bold text-gray-700 text-sm">Targeting Actions</h3>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Bid stepper */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Set Keyword Bid</label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setTargetingBid(b => parseFloat(Math.max(0.02, b - 0.05).toFixed(2)))} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">-</button>
                                                <div className="flex-1 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-700">${targetingBid.toFixed(2)}</div>
                                                <button onClick={() => setTargetingBid(b => parseFloat((b + 0.05).toFixed(2)))} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">+</button>
                                            </div>
                                        </div>
                                        {/* Pause toggle */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Pause Targeting</label>
                                            <div className="flex items-center gap-3 h-8">
                                                <div
                                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${targetingPaused ? 'bg-amber-500' : 'bg-gray-300'}`}
                                                    onClick={() => setTargetingPaused(!targetingPaused)}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${targetingPaused ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">{targetingPaused ? 'Paused' : 'Active'}</span>
                                            </div>
                                        </div>
                                        {/* Add as negative */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Add as Negative</label>
                                            <div className="flex items-center gap-3 h-8">
                                                <div
                                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${addAsNegative ? 'bg-red-500' : 'bg-gray-300'}`}
                                                    onClick={() => setAddAsNegative(!addAsNegative)}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${addAsNegative ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">{addAsNegative ? 'Will Negate' : 'Keep Active'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Targeting table */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-bold text-gray-700 text-sm">Matched Targeting Entries ({matchedTargeting.length})</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">Keyword / Target</th>
                                                    <th className="px-5 py-3 font-medium">Match Type</th>
                                                    <th className="px-5 py-3 font-medium">Spend</th>
                                                    <th className="px-5 py-3 font-medium">Sales</th>
                                                    <th className="px-5 py-3 font-medium">ACOS</th>
                                                    <th className="px-5 py-3 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {matchedTargeting.map(t => {
                                                    const acos = t.sales > 0 ? (t.spend / t.sales) * 100 : 0;
                                                    return (
                                                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Bullseye size={12} className="text-blue-400 shrink-0" />
                                                                    <span className="font-medium text-gray-800 truncate max-w-[200px]">{t.targetingText}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-gray-500 font-mono text-xs">{(t as any).matchType || '—'}</td>
                                                            <td className="px-5 py-3 text-gray-700">${t.spend.toFixed(2)}</td>
                                                            <td className="px-5 py-3 text-gray-700">${t.sales.toFixed(2)}</td>
                                                            <td className="px-5 py-3">
                                                                <span className={`font-bold ${acos > 50 ? 'text-red-600' : acos > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                                                                    {t.sales > 0 ? acos.toFixed(1) + '%' : 'No Sales'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.status === 'ENABLED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {t.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <NoContextCard label="Targeting" />
                        )
                    )}

                    {/* ── ASINS TAB ── */}
                    {activeTab === 'asins' && (
                        matchedProducts && matchedProducts.length > 0 ? (
                            <>
                                {/* ASIN Action Controls */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-bold text-gray-700 text-sm">ASIN Actions</h3>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Enable/Disable toggle */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Ad Status</label>
                                            <div className="flex items-center gap-3 h-8">
                                                <div
                                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${asinEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    onClick={() => setAsinEnabled(!asinEnabled)}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${asinEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">{asinEnabled ? 'Enabled' : 'Paused'}</span>
                                            </div>
                                        </div>
                                        {/* Bid adjustment */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Adjust Bid</label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setAsinBidAdj(b => parseFloat((b - 0.05).toFixed(2)))} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">-</button>
                                                <div className="flex-1 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-700">{asinBidAdj > 0 ? '+' : ''}{asinBidAdj.toFixed(2)}</div>
                                                <button onClick={() => setAsinBidAdj(b => parseFloat((b + 0.05).toFixed(2)))} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">+</button>
                                            </div>
                                        </div>
                                        {/* Auto-Harvesting */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Auto-Harvesting</label>
                                            <div className="flex items-center gap-3 h-8">
                                                <div
                                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${asinAutoHarvest ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    onClick={() => setAsinAutoHarvest(!asinAutoHarvest)}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${asinAutoHarvest ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">{asinAutoHarvest ? 'Enabled' : 'Disabled'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ASIN table */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-bold text-gray-700 text-sm">Matched ASINs / Products ({matchedProducts.length})</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">ASIN / SKU</th>
                                                    <th className="px-5 py-3 font-medium">Product Name</th>
                                                    <th className="px-5 py-3 font-medium">Spend</th>
                                                    <th className="px-5 py-3 font-medium">Sales</th>
                                                    <th className="px-5 py-3 font-medium">ACOS</th>
                                                    <th className="px-5 py-3 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {matchedProducts.map(p => {
                                                    const acos = p.sales > 0 ? (p.spend / p.sales) * 100 : 0;
                                                    return (
                                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-800 font-mono text-xs">{p.asin}</span>
                                                                    <span className="text-gray-400 text-xs">{p.sku || '—'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-gray-700">
                                                                <span className="truncate max-w-[180px] block">{p.productName || '—'}</span>
                                                            </td>
                                                            <td className="px-5 py-3 text-gray-700">${p.spend.toFixed(2)}</td>
                                                            <td className="px-5 py-3 text-gray-700">${p.sales.toFixed(2)}</td>
                                                            <td className="px-5 py-3">
                                                                <span className={`font-bold ${acos > 50 ? 'text-red-600' : acos > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                                                                    {p.sales > 0 ? acos.toFixed(1) + '%' : 'No Sales'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {p.enabled ? 'Enabled' : 'Disabled'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <NoContextCard label="ASIN" />
                        )
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-200 flex justify-end gap-3 z-10">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                    <button
                        className={`px-5 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2 ${getColor()}`}
                        onClick={onClose}
                    >
                        Apply Changes &amp; {insight.cta}
                    </button>
                </div>
            </div>
        </div>
    );
}
