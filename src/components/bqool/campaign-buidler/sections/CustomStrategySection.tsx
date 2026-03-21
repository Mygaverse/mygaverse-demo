'use client';
import React, { useState, useEffect } from 'react';
import { Circle, RecordCircle, Trash3, Plus, PlusCircleFill } from "react-bootstrap-icons";
import { NumberStepper } from "../../ui/NumberStepper";
import { Toggle } from "../../ui/Toggle";
import { Badge } from "../../ui/Badge";

import { useCampaignBuilder } from '../data/CampaignBuilderContext';

// --- TYPES ---
interface TargetItem {
    id: string;
    text: string;
    type: string; // 'Exact', 'Phrase', 'Broad' or 'Expanded'
    bid: number;
}

// --- SUB-COMPONENTS ---

// 1. Radio Tab (The big box selectors)
const RadioTab = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`
            flex-1 flex items-center gap-2 p-4 border rounded-md cursor-pointer transition-all
            ${selected ? 'border-[#4aaada] bg-[#f0f7ff]' : 'border-gray-200 bg-white hover:border-gray-300'}
        `}
    >
        {selected ? <RecordCircle className="text-[#4aaada]" size={20} /> : <Circle className="text-gray-300" size={20} />}
        <span className={`font-medium ${selected ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
    </div>
);

// 2. Checkbox Group
const CheckboxGroup = ({ options, selected, onChange }: { options: string[], selected: string[], onChange: (val: string[]) => void }) => (
    <div className="flex items-center gap-4">
        {options.map(opt => {
            const isChecked = selected.includes(opt);
            return (
                <div 
                    key={opt} 
                    onClick={() => onChange(isChecked ? selected.filter(s => s !== opt) : [...selected, opt])}
                    className="flex items-center gap-2 cursor-pointer select-none"
                >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                        {/* Checkmark simulation */}
                        {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />} 
                    </div>
                    <span className="text-sm text-gray-700">{opt}</span>
                </div>
            );
        })}
    </div>
);

// --- MAIN COMPONENT ---

export const CustomStrategySection = () => {

    // 1. Consume Context
    const { customConfig, setCustomConfig } = useCampaignBuilder();

    // 2. Destructure for easier access (read-only for rendering)
    const { mode, autoGroups, manualType, addedKeywords, addedProducts } = customConfig;
    
    // Keyword Form State
    const [kwMatchTypes, setKwMatchTypes] = useState<string[]>(['Exact', 'Phrase', 'Broad']);
    const [kwBid, setKwBid] = useState(1.00);
    const [kwInput, setKwInput] = useState("");

    // Product Form State
    const [prodFilters, setProdFilters] = useState<string[]>(['Exact', 'Expanded']);
    const [prodBid, setProdBid] = useState(1.00);
    const [prodInput, setProdInput] = useState("");

    // --- HELPERS TO UPDATE CONTEXT ---
    const updateAutoGroup = (index: number, field: string, value: any) => {
        const newGroups = [...autoGroups];
        (newGroups[index] as any)[field] = value;
        setCustomConfig({ ...customConfig, autoGroups: newGroups });
    };

    // --- HANDLERS ---
    const handleAdd = () => {
        const isKeyword = manualType === 'keyword';
        const input = isKeyword ? kwInput : prodInput;
        const types = isKeyword ? kwMatchTypes : prodFilters;
        const bid = isKeyword ? kwBid : prodBid;
        const setInput = isKeyword ? setKwInput : setProdInput;

        if (!input.trim() || types.length === 0) return;
        
        const lines = input.split('\n').filter(l => l.trim());
        const newItems: TargetItem[] = [];
        
        lines.forEach(line => {
            types.forEach(type => {
                newItems.push({
                    id: Date.now() + Math.random().toString(),
                    text: line.trim(),
                    type,
                    bid
                });
            });
        });

        // Update Context
        if (isKeyword) {
            setCustomConfig({ ...customConfig, addedKeywords: [...addedKeywords, ...newItems] });
        } else {
            setCustomConfig({ ...customConfig, addedProducts: [...addedProducts, ...newItems] });
        }
        setInput("");
    };

    const handleRemoveItem = (id: string, listType: 'keyword' | 'product') => {
        if (listType === 'keyword') {
            setCustomConfig({ ...customConfig, addedKeywords: addedKeywords.filter(k => k.id !== id) });
        } else {
            setCustomConfig({ ...customConfig, addedProducts: addedProducts.filter(p => p.id !== id) });
        }
    };

    const handleRemoveAll = (listType: 'keyword' | 'product') => {
        if (listType === 'keyword') {
            setCustomConfig({ ...customConfig, addedKeywords: [] });
        } else {
            setCustomConfig({ ...customConfig, addedProducts: [] });
        }
    };

    // --- RENDERERS ---

    const renderAutoContent = () => (
        <div className="bg-blue-50/30 border border-blue-100 rounded-sm p-0 overflow-hidden">
            <div className="flex bg-[#f1f7ff] border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
                <div className="flex w-[300px]">Targeting Groups</div>
                <div className="w-fit">Bid</div>
            </div>
            <div className="bg-white">
                {autoGroups.map((group, idx) => (
                    <div key={group.id} className={`flex items-center px-4 py-4 ${idx !== autoGroups.length - 1 ? 'border-b border-[#e2e2e2]' : ''}`}>
                        <div className="flex gap-2 w-[300px] items-center">
                            <Toggle 
                                checked={group.enabled} 
                                onChange={(val) => updateAutoGroup(idx, 'enabled', val)} 
                            />
                            <span className="text-sm text-gray-700 font-medium">{group.label}</span>
                        </div>
                        <div className="w-[120px]">
                            <NumberStepper 
                                value={group.bid} 
                                onChange={(val) => updateAutoGroup(idx, 'bid', val)}
                                prefix="$"
                                step={0.01}
                                disabled={!group.enabled}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderManualContent = () => {
        const isKeyword = manualType === 'keyword';
        const list = isKeyword ? addedKeywords : addedProducts;

        // Dynamic Labels
        const typeLabel = isKeyword ? "Match Type :" : "Filter by :";
        const options = isKeyword ? ['Exact', 'Phrase', 'Broad'] : ['Exact', 'Expanded'];
        const selectedOptions = isKeyword ? kwMatchTypes : prodFilters;
        const setSelectedOptions = isKeyword ? setKwMatchTypes : setProdFilters;
        const bid = isKeyword ? kwBid : prodBid;
        const setBid = isKeyword ? setKwBid : setProdBid;
        const inputVal = isKeyword ? kwInput : prodInput;
        const setInputVal = isKeyword ? setKwInput : setProdInput;
        const btnLabel = isKeyword ? "Add Keywords" : "Add ASIN";
        const placeholder = isKeyword ? "Please separate each target by pressing Enter" : "Enter ASINs separated by Enter";

        return (
            <div className="border border-[#e2e2e2] rounded-md bg-white shadow-sm">
                
                {/* Dual Pane Container */}
                <div className="flex flex-col lg:flex-row gap-0 h-[450px]">
                    
                    {/* LEFT PANE: Input Form */}
                    <div className="flex-1 flex flex-col border-r border-[#e2e2e2]">
                        
                        {/* Row 1: Match Types */}
                        <div className="flex items-center p-4 gap-4 border-b border-[#e2e2e2]">
                            <span className="text-sm font-medium text-gray-900 min-w-[90px]">{typeLabel}</span>
                            <CheckboxGroup 
                                options={options} 
                                selected={selectedOptions} 
                                onChange={setSelectedOptions} 
                            />
                        </div>

                        {/* Row 2: Bid */}
                        <div className="flex items-center gap-4 p-4 border-b border-[#e2e2e2]">
                            <span className="text-sm font-medium text-gray-900 min-w-[90px]">Default Bid :</span>
                            <div className="w-[120px]">
                                <NumberStepper value={bid} onChange={setBid} prefix="$" step={0.01} />
                            </div>
                        </div>

                        {/* Row 3: Text Area */}
                        <div className="flex-1 relative px-6 py-4">
                            <textarea 
                                className="w-full h-full resize-none border border-[#e2e2e2] rounded-md p-4 text-sm focus:outline-none focus:border-[#4aaada] focus:ring-1 focus:ring-[#4aaada] bg-[#fafafa]"
                                placeholder={placeholder}
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                            />
                        </div>

                        {/* Row 4: Button */}
                        <div className="flex justify-end px-6 pb-4">
                            <button 
                                onClick={handleAdd}
                                className="bg-[#4aaada] hover:bg-[#3a9aca] text-white px-5 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <PlusCircleFill size={18} /> {btnLabel}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANE: Added List */}
                    <div className="flex-1 flex flex-col bg-white">
                        
                        {/* Header */}
                        <div className="bg-[#f1f7ff] px-4 py-4 flex justify-between items-center border-b border-[#e2e2e2]">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">Added</span>
                                <Badge variant="neutral" size="sm">{list.length.toString()}</Badge>
                            </div>
                            
                        </div>

                        {/* Table Head */}
                        <div className="flex items-center px-4 py-4 border-b border-[#e2e2e2] bg-white text-sm text-gray-900 font-medium">
                            <div className="flex flex-1">{isKeyword ? "Keywords" : "ASINs"}</div>
                            <div className="w-[250px] text-start">{isKeyword ? "Match Type" : "Filter by"}</div>
                            <div className="w-[120px] text-start">Bid</div>
                            <div className="w-[150px] justify-center flex">
                                {list.length > 0 && (
                                <button 
                                    onClick={() => handleRemoveAll(isKeyword ? 'keyword' : 'product')} 
                                    className="text-sm text-[#0066b7] hover:underline font-medium">Remove all</button>
                            )}
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="flex-1 overflow-y-auto">
                            {list.map(item => (
                                <div key={item.id} className="flex items-center px-4 py-3 border-b border-[#e2e2e2] hover:bg-gray-50 transition-colors group h-[60px]">
                                    <div className="flex flex-1 text-sm text-gray-800 truncate pr-2" title={item.text}>{item.text}</div>
                                    <div className="w-[250px] flex justify-start">
                                        <span className="border border-gray-300 rounded-full px-3 py-0.5 text-xs text-gray-600 bg-white shadow-sm">
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="w-[120px] flex justify-center">
                                        <NumberStepper value={item.bid} onChange={()=>{}} prefix="$" step={0.01} size="md" />
                                    </div>
                                    <div className="w-[150px] flex justify-center">
                                        <button 
                                            onClick={() => handleRemoveItem(item.id, isKeyword ? 'keyword' : 'product')}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                        >
                                            <Trash3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {list.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                                    <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-full" />
                                    <span className="text-xs">No items added</span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> One auto campaign or one manual campaign.
            </div>

            {/* Main Tabs */}
            <div className="flex gap-4">
                <RadioTab label="Auto Campaign" selected={mode === 'auto'} onClick={() => setCustomConfig({ ...customConfig, mode: 'auto' })} />
                <RadioTab label="Manual Campaign" selected={mode === 'manual'} onClick={() => setCustomConfig({ ...customConfig, mode: 'manual' })} />
            </div>

            {/* Content Area */}
            <div className="mt-2">
                {mode === 'auto' && renderAutoContent()}

                {mode === 'manual' && (
                <div className="mt-2">
                    {/* Manual Sub-Tabs */}
                    <div className="flex mb-3 px-2 font-semibold text-gray-900 text-sm">Targeting</div>
                        <div className="flex gap-4 mb-4">
                            <RadioTab label="Keyword Targeting" selected={manualType === 'keyword'} onClick={() => setCustomConfig({ ...customConfig, manualType: 'keyword' })} />
                            <RadioTab label="Product Targeting" selected={manualType === 'product'} onClick={() => setCustomConfig({ ...customConfig, manualType: 'product' })} />
                        </div>
                    
                    {renderManualContent()}
                </div>
            )}
            </div>
        </div>
    );
};