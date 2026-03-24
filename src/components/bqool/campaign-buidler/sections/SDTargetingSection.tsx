'use client';
import React, { useState } from 'react';
import {
    Trash3,
    PlusCircleFill,
    ChevronDown,
    ChevronRight,
    CheckCircleFill,
    Circle,
    InfoCircle
} from "react-bootstrap-icons";
import { NumberStepper } from "../../ui/NumberStepper";
import { Badge } from "../../ui/Badge";
import { useCampaignBuilder, SDTarget } from '../data/CampaignBuilderContext';

// --- SUB-COMPONENTS ---

const TabItem = ({
    title,
    desc,
    active,
    onClick
}: {
    title: string;
    desc: string;
    active: boolean;
    onClick: () => void;
}) => (
    <div
        onClick={onClick}
        className={`flex-1 flex flex-col p-4 border-b-2 cursor-pointer transition-all ${active ? 'border-[#4aaada] bg-white' : 'border-transparent bg-white hover:bg-gray-50'}`}
    >
        <span className={`font-bold text-sm mb-1 ${active ? 'text-[#4aaada]' : 'text-gray-900'}`}>{title}</span>
        <span className="text-[11px] text-gray-400 leading-tight">{desc}</span>
    </div>
);

const Checkbox = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label?: string }) => (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChange(!checked)}>
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
            {checked && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
        </div>
        {label && <span className="text-sm text-gray-700">{label}</span>}
    </div>
);

// --- MAIN COMPONENT ---

type TabType = 'contextual' | 'remarketing' | 'in-market' | 'lifestyle';

export const SDTargetingSection = () => {
    const { sdTargeting, setSdTargeting } = useCampaignBuilder();
    const [activeTab, setActiveTab] = useState<TabType>('contextual');

    // Contextual State
    const [exactMatch, setExactMatch] = useState(true);
    const [expandedMatch, setExpandedMatch] = useState(true);
    const [contextualBid, setContextualBid] = useState(1.00);
    const [asinInput, setAsinInput] = useState("");

    // Remarketing State
    const [remBid, setRemBid] = useState(1.00);
    const [lookback1, setLookback1] = useState("30 Days");
    const [lookback2, setLookback2] = useState("30 Days");

    const handleAddTarget = (target: string, type: TabType, filter: string, bid: number, lookback?: string) => {
        const newTarget: SDTarget = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: type === 'contextual' ? 'contextual' : (type === 'remarketing' ? 'remarketing' : 'audiences'),
            subType: type === 'in-market' ? 'in-market' : (type === 'lifestyle' ? 'lifestyle' : undefined),
            targetValue: target,
            filterBy: filter,
            bid: bid,
            lookback: lookback
        };
        setSdTargeting([...sdTargeting, newTarget]);
    };

    const handleRemoveTarget = (id: string) => {
        setSdTargeting(sdTargeting.filter(t => t.id !== id));
    };

    const handleRemoveAll = () => setSdTargeting([]);

    const renderAddedTable = () => (
        <div className="flex-1 flex flex-col bg-white border-l border-[#e2e2e2]">
            <div className="bg-[#f0f7ff] px-4 py-3 flex justify-between items-center border-b border-[#e2e2e2]">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Added</span>
                    <Badge variant="neutral" size="sm">{sdTargeting.length.toString()}</Badge>
                </div>
            </div>

            <div className="flex items-center px-4 py-3 border-b border-[#e2e2e2] text-[12px] font-bold text-gray-500 bg-white uppercase">
                <div className="flex-1">Targeting</div>
                <div className="w-[120px]">Filter by</div>
                <div className="w-[100px] text-center">Bid</div>
                <div className="w-[80px] flex justify-end">
                    {sdTargeting.length > 0 && (
                        <button onClick={handleRemoveAll} className="text-[#4aaada] hover:underline font-bold capitalize">Remove all</button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[400px]">
                {sdTargeting.map(target => (
                    <div key={target.id} className="flex items-center px-4 py-4 border-b border-[#f0f0f0] hover:bg-gray-50 transition-colors group">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[13px] font-bold text-gray-900">{target.targetValue}</span>
                            {target.type === 'audiences' && (
                                <span className="text-[11px] text-gray-400 capitalize">{target.subType?.replace('-', ' ')} segment</span>
                            )}
                            {target.type === 'remarketing' && (
                                <span className="text-[11px] text-gray-400 capitalize">Views remarketing</span>
                            )}
                        </div>
                        <div className="w-[120px]">
                            <span className="border border-gray-200 rounded-full px-4 py-0.5 text-[11px] text-gray-600 bg-white">
                                {target.lookback ? target.lookback : target.filterBy}
                            </span>
                        </div>
                        <div className="w-[100px] flex justify-center">
                            <NumberStepper
                                value={target.bid}
                                onChange={(v) => {
                                    setSdTargeting(sdTargeting.map(t => t.id === target.id ? { ...t, bid: v } : t));
                                }}
                                prefix="$"
                                size="sm"
                            />
                        </div>
                        <div className="w-[80px] flex justify-end">
                            <button onClick={() => handleRemoveTarget(target.id)} className="text-gray-300 hover:text-red-500 p-1">
                                <Trash3 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {sdTargeting.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 opacity-40">
                        <span className="text-sm">No targets added yet</span>
                    </div>
                )}
            </div>
        </div>
    );

    const renderContextual = () => (
        <div className="flex-1 flex flex-col p-6">
            <div className="flex items-center gap-6 mb-8">
                <span className="text-sm font-bold text-gray-700 w-24">Filter by :</span>
                <div className="flex items-center gap-4">
                    <Checkbox checked={exactMatch} onChange={setExactMatch} label="Exact" />
                    <Checkbox checked={expandedMatch} onChange={setExpandedMatch} label="Expanded" />
                </div>
            </div>

            <div className="flex items-center gap-6 mb-8">
                <span className="text-sm font-bold text-gray-700 w-24">Default Bid :</span>
                <div className="w-[120px]">
                    <NumberStepper value={contextualBid} onChange={setContextualBid} prefix="$" />
                </div>
            </div>

            <div className="flex-1 mb-4">
                <textarea
                    className="w-full h-48 border border-[#e2e2e2] rounded p-4 text-sm outline-none focus:border-[#4aaada] bg-[#fafafa]"
                    placeholder="Press Enter to separate each ASIN."
                    value={asinInput}
                    onChange={(e) => setAsinInput(e.target.value)}
                />
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => {
                        const asins = asinInput.split('\n').filter(a => a.trim());
                        asins.forEach(asin => {
                            if (exactMatch) handleAddTarget(asin.trim(), 'contextual', 'Exact', contextualBid);
                            if (expandedMatch) handleAddTarget(asin.trim(), 'contextual', 'Expanded', contextualBid);
                        });
                        setAsinInput("");
                    }}
                    className="bg-[#4aaada] hover:bg-[#3ca0d0] text-white px-6 py-2 rounded font-bold text-sm flex items-center gap-2"
                >
                    <PlusCircleFill size={16} /> Add Targets
                </button>
            </div>
        </div>
    );

    const renderRemarketing = () => (
        <div className="flex-1 flex flex-col p-6">
            <div className="flex items-center gap-6 mb-6">
                <span className="text-sm font-bold text-gray-700 w-24">Default Bid</span>
                <div className="w-[120px]">
                    <NumberStepper value={remBid} onChange={setRemBid} prefix="$" />
                </div>
            </div>

            <div className="flex items-center gap-6 mb-8">
                <span className="text-sm font-bold text-gray-700 w-24">Lookback</span>
                <div className="flex gap-2">
                    <select className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32 outline-none">
                        <option>30 Days</option>
                        <option>14 Days</option>
                        <option>60 Days</option>
                        <option>90 Days</option>
                    </select>
                    <select className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32 outline-none">
                        <option>30 Days</option>
                        <option>14 Days</option>
                        <option>60 Days</option>
                        <option>90 Days</option>
                    </select>
                </div>
            </div>

            <div className="flex border-b border-gray-200 mb-4">
                <div className="px-4 py-2 text-sm font-bold text-[#4aaada] border-b-2 border-[#4aaada] cursor-pointer">Suggested</div>
                <div className="px-4 py-2 text-sm font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Browse</div>
            </div>

            <div className="flex-1 flex flex-col border border-[#e2e2e2] rounded overflow-hidden">
                <div className="bg-[#f0f7ff] px-4 py-2 border-b border-[#e2e2e2] font-bold text-gray-900 text-[13px]">
                    Remarketing audiences
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex flex-col gap-3">
                        <Checkbox checked={false} onChange={(v) => handleAddTarget('Advertised products', 'remarketing', 'Views remarketing', remBid, '14 Days')} label="Advertised products" />
                        <Checkbox checked={false} onChange={(v) => handleAddTarget('Similar to advertised products', 'remarketing', 'Views remarketing', remBid, '30 Days')} label="Similar to advertised products" />
                    </div>
                </div>
                <div className="bg-[#f0f7ff] px-4 py-2 border-y border-[#e2e2e2] font-bold text-gray-900 text-[13px]">
                    Audience categories
                </div>
                <div className="h-20" /> {/* Placeholder */}
            </div>
        </div>
    );

    const renderAudiences = (type: 'in-market' | 'lifestyle') => (
        <div className="flex-1 flex flex-col p-6">
             <div className="flex items-center gap-6 mb-6">
                <span className="text-sm font-bold text-gray-700 w-24">Default Bid</span>
                <div className="w-[120px]">
                    <NumberStepper value={1.00} onChange={() => {}} prefix="$" />
                </div>
            </div>

            <div className="flex border-b border-gray-200 mb-6 font-bold">
                <div className="px-4 py-2 text-sm text-gray-400 cursor-pointer hover:text-gray-600">Suggested</div>
                <div className="px-4 py-2 text-sm text-[#4aaada] border-b-2 border-[#4aaada] cursor-pointer">Browse</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                <div className="flex items-center gap-2">
                    <ChevronDown size={14} className="text-gray-400" />
                    <Checkbox checked={false} onChange={() => {}} />
                    <span className="text-sm text-gray-800">{type === 'in-market' ? 'Amazon Device Accessories' : 'Art & Design'}</span>
                </div>
                <div className="pl-6 space-y-2 border-l border-gray-100 ml-1.5 mt-1">
                     <div className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-gray-400" />
                        <Checkbox checked={false} onChange={() => {}} />
                        <span className="text-sm text-gray-800">{type === 'in-market' ? 'Amazon Device Accessories' : 'Art & Design'}</span>
                    </div>
                    <div className="pl-8 space-y-3 mt-2">
                        {type === 'in-market' ? (
                            <>
                                <Checkbox checked={false} onChange={(v) => handleAddTarget('IM - Vitamin Drinks', 'in-market', 'Category', 1.00)} label="All Kindle Skins" />
                                <Checkbox checked={false} onChange={() => {}} label="All Kindle Sleeves" />
                                <Checkbox checked={false} onChange={() => {}} label="Amazon Device Audio Accessories" />
                            </>
                        ) : (
                            <Checkbox checked={true} onChange={() => handleAddTarget('LS - Arts Enthusiasts', 'lifestyle', 'Lifestyle', 1.00)} label="LS - Arts Enthusiasts" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col">
            <div className="flex border-b border-[#e2e2e2]">
                <TabItem
                    title="Contextual"
                    desc="Reach audiences who are browsing products and content matching criteria you choose."
                    active={activeTab === 'contextual'}
                    onClick={() => setActiveTab('contextual')}
                />
                <TabItem
                    title="Remarketing Audiences"
                    desc="Reach relevant audiences who have viewed, purchased, or are browsing products and content matching criteria you choose."
                    active={activeTab === 'remarketing'}
                    onClick={() => setActiveTab('remarketing')}
                />
                <TabItem
                    title="In-market audiences"
                    desc="Reach audiences whose recent activity suggests they're likely to buy products in a certain category."
                    active={activeTab === 'in-market'}
                    onClick={() => setActiveTab('in-market')}
                />
                <TabItem
                    title="Interest and lifestyle audiences"
                    desc="Reach audiences whose shopping and entertainment activity suggests certain interest or lifestyle preferences."
                    active={activeTab === 'lifestyle'}
                    onClick={() => setActiveTab('lifestyle')}
                />
            </div>

            <div className="flex min-h-[500px]">
                {activeTab === 'contextual' && renderContextual()}
                {activeTab === 'remarketing' && renderRemarketing()}
                {activeTab === 'in-market' && renderAudiences('in-market')}
                {activeTab === 'lifestyle' && renderAudiences('lifestyle')}

                {renderAddedTable()}
            </div>
        </div>
    );
};
