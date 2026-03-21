'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Trash, Check } from "react-bootstrap-icons";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Badge } from "@/components/bqool/ui/Badge";
import { Button } from "@/components/bqool/ui/Button";
import { BudgetCell } from "@/components/bqool/tables/cells/BudgetCell"; 
import { Portal } from "@/components/bqool/ui/Portal";
import { StoreSelector } from "@/components/bqool/ui/StoreSelector"; 

interface AddAsTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    searchTerm: string;
    type: 'keyword' | 'neg-keyword' | 'product' | 'neg-product';
    storeId: string;
}

type WizardStep = 1 | 2 | 3;

export const AddAsTargetModal = ({ isOpen, onClose, onSave, searchTerm, type, storeId }: AddAsTargetModalProps) => {
    // --- STATE ---
    const [step, setStep] = useState<WizardStep>(1);
    
    // Data
    const [activeStoreId, setActiveStoreId] = useState(storeId);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [adGroups, setAdGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Selections
    // We store matchTypes here. Default to 'Broad' for keywords, 'Negative Exact' for neg keywords
    const [matchTypes, setMatchTypes] = useState<string[]>([]);
    const [bid, setBid] = useState<number>(1.00);

    const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
    const [selectedAdGroupIds, setSelectedAdGroupIds] = useState<Set<string>>(new Set());

    // Panel Accordion State
    const [rightPanelOpen, setRightPanelOpen] = useState<{target: boolean, camp: boolean, ag: boolean}>({
        target: true, camp: true, ag: true
    });

    // --- INIT ---
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setActiveStoreId(storeId);
            setSelectedCampaignIds(new Set());
            setSelectedAdGroupIds(new Set());
            
            // Initialize Defaults based on Type
            if (type === 'keyword') setMatchTypes(['Broad']);
            else if (type === 'neg-keyword') setMatchTypes(['Negative Exact']);
            else setMatchTypes([]); // Product targets don't use match types here usually
            
            setBid(1.00);
            loadCampaigns(storeId);
        }
    }, [isOpen, storeId, type]);

    // --- DATA LOADING ---
    const loadCampaigns = async (sid: string) => {
        setLoading(true);
        try {
            const q = query(collection(db, 'campaigns'), where('storeId', '==', sid), where('enabled', '==', true));
            const snap = await getDocs(q);
            setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadAdGroups = async () => {
        if (selectedCampaignIds.size === 0) { setAdGroups([]); return; }
        setLoading(true);
        try {
            const q = query(collection(db, 'ad_groups'), where('storeId', '==', activeStoreId), where('enabled', '==', true));
            const snap = await getDocs(q);
            const allAgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAdGroups(allAgs.filter((ag: any) => selectedCampaignIds.has(ag.campaignId)));
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => {
        if (step === 3) loadAdGroups();
    }, [step]);

    // --- HANDLERS ---
    const handleStoreChange = (ids: string[]) => {
        if (ids.length > 0) {
            setActiveStoreId(ids[0]);
            loadCampaigns(ids[0]);
            setSelectedCampaignIds(new Set());
            setSelectedAdGroupIds(new Set());
        }
    };

    const toggleCampaign = (id: string) => {
        const next = new Set(selectedCampaignIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedCampaignIds(next);
    };

    const toggleAdGroup = (id: string) => {
        const next = new Set(selectedAdGroupIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedAdGroupIds(next);
    };

    const toggleMatchType = (m: string) => {
        if (matchTypes.includes(m)) setMatchTypes(matchTypes.filter(x => x !== m));
        else setMatchTypes([...matchTypes, m]);
    };

    // --- DYNAMIC TEXT ---
    const getTitles = () => {
        switch(type) {
            case 'keyword': return { modal: 'Add as Keyword Target', step1: 'Add as Keyword Target', label: 'Keyword' };
            case 'neg-keyword': return { modal: 'Add as Negative Keyword Target', step1: 'Add as Negative Keyword Target', label: 'Negative Keyword' };
            case 'neg-product': return { modal: 'Add as Negative Product Target', step1: 'Add as Negative Product Target', label: 'Negative Product' };
            case 'product': default: return { modal: 'Add as Product Target', step1: 'Add as Product Target', label: 'Product' };
        }
    };
    const TEXT = getTitles();

    // --- RENDERERS ---

    const renderProgressBar = () => (
        <div className="bg-[#f5f8fa] border-b border-gray-200 pt-8 pb-4 px-12">
            <div className="relative flex items-center justify-between">
                <div className="absolute top-[7px] left-0 w-full h-[4px] bg-gray-200 rounded-full z-0"></div>
                <div className="absolute top-[7px] left-0 h-[4px] bg-[#4aaada] rounded-full z-0 transition-all duration-300 ease-in-out" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                {[
                    { s: 1, label: TEXT.step1 },
                    { s: 2, label: 'Select Campaign' },
                    { s: 3, label: 'Select Ad Group' }
                ].map((item) => (
                    <div key={item.s} className="z-10 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => item.s < step && setStep(item.s as WizardStep)}>
                        <div className={`w-4 h-4 rounded-full border-[3px] transition-colors duration-200 ${step >= item.s ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}></div>
                        <span className={`text-sm font-medium ${step === item.s ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    // STEP 1: CONFIGURATION
    const renderStep1 = () => {
        const isKeyword = type.includes('keyword');
        const isNegative = type.includes('neg');
        
        // Define options based on type
        const matchOptions = type === 'keyword' 
            ? ['Broad', 'Phrase', 'Exact'] 
            : type === 'neg-keyword' 
            ? ['Negative Exact', 'Negative Phrase'] 
            : [];

        return (
            <div className="p-8">
                {/* Visual Search Bar */}
                <div className="relative mb-6">
                    <input disabled className="w-full border border-gray-200 rounded-md py-2 px-3 pl-3 text-gray-400 text-sm bg-white cursor-not-allowed" placeholder="Search Campaign Name..." />
                    <Search className="absolute right-3 top-2.5 text-gray-400" size={16}/>
                </div>

                {/* Table Layout */}
                <div className="border border-gray-200 rounded-sm overflow-hidden">
                    {/* Row 1: Target Name */}
                    <div className="flex border-b border-gray-200">
                        <div className="w-[160px] bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 flex items-center">
                            {TEXT.label}
                        </div>
                        <div className="flex-1 px-4 py-3 text-sm text-gray-900 font-medium bg-white flex items-center">
                            {searchTerm}
                        </div>
                    </div>

                    {/* Row 2: Match Types (Keywords Only) */}
                    {isKeyword && (
                        <div className="flex border-b border-gray-200">
                            <div className="w-[160px] bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 flex items-center">
                                Match Type
                            </div>
                            <div className="flex-1 px-4 py-3 bg-white flex items-center gap-4">
                                {matchOptions.map(m => (
                                    <label key={m} className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${matchTypes.includes(m) ? 'bg-[#4aaada]' : 'bg-gray-200'}`}>
                                            {matchTypes.includes(m) && <Check className="text-white" size={14} />}
                                        </div>
                                        <span className="text-sm text-gray-700">{m}</span>
                                        {/* Hidden Checkbox for logic */}
                                        <input type="checkbox" className="hidden" checked={matchTypes.includes(m)} onChange={() => toggleMatchType(m)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Row 3: Bid (Positive Only) */}
                    {!isNegative && (
                        <div className="flex">
                            <div className="w-[160px] bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 flex items-center">
                                Bid
                            </div>
                            <div className="flex-1 px-4 py-2 bg-white flex items-center">
                                <div className="w-32">
                                    <BudgetCell value={bid} isAuto={false} onChange={setBid} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button variant="primary" className="px-6 h-[36px]" onClick={() => setStep(2)}>Add</Button>
                </div>
            </div>
        );
    };

    // STEP 2: SELECT CAMPAIGNS (Unchanged logic, just ensure UI consistency)
    const renderStep2 = () => {
        return (
            <div className="flex flex-col h-full bg-[#f8f9fa]">
                <div className="bg-white p-3 border-b border-gray-200 flex gap-3 items-center">
                    <div className="w-[220px] h-full mr-2">
                        <StoreSelector mode="single" selectedStoreIds={[activeStoreId]} onSelect={handleStoreChange} showLabel={false} />
                    </div>
                    {/* Mock Filters for visual match */}
                    <select className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-600 bg-white"><option>Sponsored Products</option></select>
                    <select className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-600 bg-white"><option>All Status</option></select>
                    <select className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-600 bg-white"><option>Goal: No</option></select>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {campaigns.map(camp => {
                        const isSel = selectedCampaignIds.has(camp.id);
                        return (
                            <div key={camp.id} onClick={() => toggleCampaign(camp.id)} className={`bg-white border rounded-md p-4 cursor-pointer transition-all flex items-start gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 shrink-0 ${isSel ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                                    {isSel && <Check className="text-white" size={14} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900 text-sm">Campaign</span>
                                        <span className="text-sm text-gray-800">{camp.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                                            <img src={`https://flagcdn.com/w20/${camp.flag}.png`} className="w-3 h-2 rounded-[1px]"/>
                                            <span className="text-[10px] text-gray-600">{camp.storeName}</span>
                                        </div>
                                        <Badge variant="neutral" size="sm">{camp.type}</Badge>
                                        <Badge variant={camp.enabled ? 'status-enabled' : 'neutral'} size="sm">{camp.enabled ? 'Enabled' : 'Paused'}</Badge>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-gray-200 bg-white flex justify-between">
                    <Button variant="ghostOutline" onClick={() => setStep(1)}>Prev</Button>
                    <Button variant="primary" onClick={() => setStep(3)} disabled={selectedCampaignIds.size === 0}>Next</Button>
                </div>
            </div>
        );
    };

    // STEP 3: SELECT AD GROUPS (Unchanged logic)
    const renderStep3 = () => {
        type GroupedCampaigns = { name: string; ags: any[]; };
        const grouped = adGroups.reduce((acc, ag) => {
            if (!acc[ag.campaignId]) acc[ag.campaignId] = { name: ag.campaignName, ags: [] };
            acc[ag.campaignId].ags.push(ag);
            return acc;
        }, {} as Record<string, GroupedCampaigns>);

        return (
            <div className="flex-col h-full flex bg-[#f8f9fa]">
                <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                    <h3 className="font-bold text-gray-800">Select Ad Groups</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {Object.entries(grouped).map(([campId, group]) => {
                        const typedGroup = group as GroupedCampaigns;
                        return (
                            <div key={campId} className="space-y-2">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Campaign: {typedGroup.name}</span>
                                </div>
                                {typedGroup.ags.map((ag: any) => {
                                    const isSel = selectedAdGroupIds.has(ag.id);
                                    return (
                                        <div key={ag.id} onClick={() => toggleAdGroup(ag.id)} className={`bg-white border rounded-md p-3 ml-4 cursor-pointer transition-all flex items-center gap-3 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                                                {isSel && <Check className="text-white" size={14} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-sm">Ad Group</span>
                                                    <span className="text-sm text-gray-800">{ag.name}</span>
                                                </div>
                                                <div className="mt-1"><Badge variant={ag.enabled ? 'status-enabled' : 'neutral'} size="sm">{ag.enabled ? 'Enabled' : 'Paused'}</Badge></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-gray-200 bg-white flex justify-between">
                    <Button variant="ghostOutline" onClick={() => setStep(2)}>Prev</Button>
                </div>
            </div>
        );
    };

    // RIGHT PANEL (Summary)
    const renderRightPanel = () => {
        const selCamps = campaigns.filter(c => selectedCampaignIds.has(c.id));
        const selAgs = adGroups.filter(a => selectedAdGroupIds.has(a.id));
        const isNegative = type.includes('neg');

        return (
            <div className="w-[320px] bg-[#f0f6fa] border-l border-gray-200 flex flex-col h-full overflow-y-auto">
                {/* 1. Target Summary */}
                <div className="border-b border-gray-200">
                    <button onClick={() => setRightPanelOpen({...rightPanelOpen, target: !rightPanelOpen.target})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-medium text-gray-700">Selected {TEXT.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">1</span>
                            <ChevronDown size={12} className={`text-gray-500 transition-transform ${rightPanelOpen.target ? '' : '-rotate-90'}`} />
                        </div>
                    </button>
                    {rightPanelOpen.target && (
                        <div className="p-3 bg-white">
                            <div className="border border-gray-200 rounded p-3 relative">
                                <div className="text-sm font-bold text-gray-900 mb-2">{searchTerm}</div>
                                
                                <div className="flex flex-wrap gap-2 items-center">
                                    {/* Match Type Badges */}
                                    {matchTypes.map(m => (
                                        <span key={m} className="px-2 py-0.5 border border-gray-300 rounded-full text-[10px] text-gray-600 bg-white font-medium">
                                            {m}
                                        </span>
                                    ))}
                                    
                                    {/* Enabled Badge (Static for now) */}
                                    <span className="px-2 py-0.5 border border-gray-300 rounded-full text-[10px] text-gray-600 bg-white font-medium">
                                        Enabled
                                    </span>

                                    {/* Bid Badge */}
                                    {!isNegative && (
                                        <div className="px-2 py-0.5 border border-gray-300 rounded-full text-[10px] text-gray-900 bg-white font-bold flex items-center gap-1">
                                            Bid ${bid.toFixed(2)} 
                                            {/* Edit Icon could go here */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Campaign Summary */}
                <div className="border-b border-gray-200">
                    <button onClick={() => setRightPanelOpen({...rightPanelOpen, camp: !rightPanelOpen.camp})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-medium text-gray-700">Selected Campaigns</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{selCamps.length}</span>
                            <ChevronDown size={12} className={`text-gray-500 transition-transform ${rightPanelOpen.camp ? '' : '-rotate-90'}`} />
                        </div>
                    </button>
                    {rightPanelOpen.camp && selCamps.length > 0 && (
                        <div className="p-3 bg-white space-y-2">
                            {selCamps.map(c => (
                                <div key={c.id} className="border border-gray-200 rounded p-2 relative group">
                                    <div className="text-xs font-bold text-gray-800 line-clamp-1 pr-6">{c.name}</div>
                                    <div className="flex gap-1 mt-1">
                                        <Badge size="sm" variant="neutral">{c.type}</Badge>
                                        <Badge size="sm" variant="status-enabled">Enabled</Badge>
                                    </div>
                                    <button onClick={() => toggleCampaign(c.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Ad Group Summary */}
                <div className="border-b border-gray-200">
                    <button onClick={() => setRightPanelOpen({...rightPanelOpen, ag: !rightPanelOpen.ag})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-medium text-gray-700">Selected Ad Groups</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{selAgs.length}</span>
                            <ChevronDown size={12} className={`text-gray-500 transition-transform ${rightPanelOpen.ag ? '' : '-rotate-90'}`} />
                        </div>
                    </button>
                    {rightPanelOpen.ag && selAgs.length > 0 && (
                        <div className="p-3 bg-white space-y-2">
                            {selAgs.map(a => (
                                <div key={a.id} className="border border-gray-200 rounded p-2 relative group">
                                    <div className="text-xs font-bold text-gray-800 line-clamp-1 pr-6">{a.name}</div>
                                    <div className="text-[10px] text-gray-500 line-clamp-1">Camp: {a.campaignName}</div>
                                    <div className="mt-1"><Badge size="sm" variant="status-enabled">Enabled</Badge></div>
                                    <button onClick={() => toggleAdGroup(a.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1100px] h-[650px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-[#4aaada] px-5 py-4 flex items-center justify-between shrink-0">
                        <h2 className="text-white font-bold text-lg">{TEXT.modal}</h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        <div className="flex-1 flex flex-col min-w-0">
                            {renderProgressBar()}
                            <div className="flex-1 overflow-hidden relative">
                                {step === 1 && renderStep1()}
                                {step === 2 && renderStep2()}
                                {step === 3 && renderStep3()}
                            </div>
                        </div>
                        {renderRightPanel()}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                        <Button variant="ghost" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</Button>
                        <Button variant="primary" onClick={() => { onSave(); onClose(); }} disabled={step < 3 || selectedAdGroupIds.size === 0} className="bg-[#4aaada] hover:bg-[#3a9ad0] text-white px-8" icon={<Check size={18} />}>Save</Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};