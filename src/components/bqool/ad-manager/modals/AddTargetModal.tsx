'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Trash, Check, Search } from "react-bootstrap-icons";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Badge } from "@/components/bqool/ui/Badge";
import { Button } from "@/components/bqool/ui/Button";
import { Portal } from "@/components/bqool/ui/Portal";
import { StoreSelector } from "@/components/bqool/ui/StoreSelector";
import { BudgetCell } from "@/components/bqool/tables/cells/BudgetCell";

// Define the 4 types of targeting actions
export type AddTargetType = 'keyword' | 'neg-keyword' | 'product' | 'neg-product' | null;

interface AddTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    storeId: string;
    type: AddTargetType; // Crucial prop determining behavior
}

type WizardStep = 1 | 2 | 3;

export const AddTargetModal = ({ isOpen, onClose, onSave, storeId, type }: AddTargetModalProps) => {
    if (!type) return null;

    const isNegative = type.includes('neg');
    const isKeywordType = type.includes('keyword');
    const titleMap: Record<string, string> = {
        'keyword': 'Add Keyword Target',
        'neg-keyword': 'Add Negative Keyword Target',
        'product': 'Add Product Target',
        'neg-product': 'Add Negative Product Target'
    };

    // --- STATE ---
    const [step, setStep] = useState<WizardStep>(1);
    const [activeStoreId, setActiveStoreId] = useState(storeId);
    const [loading, setLoading] = useState(false);

    // Data State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [adGroups, setAdGroups] = useState<any[]>([]);
    const [availableProducts, setAvailableProducts] = useState<any[]>([]); // For product targeting

    // Selection State (Steps 1 & 2)
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
    const [selectedAdGroupIds, setSelectedAdGroupIds] = useState<Set<string>>(new Set());

    // Step 3 State (Keywords)
    const [keywordText, setKeywordText] = useState('');
    const [selectedMatchTypes, setSelectedMatchTypes] = useState<Set<string>>(new Set(isKeywordType ? (isNegative ? ['negativeExact'] : ['broad']) : []));
    const [bid, setBid] = useState<number>(0.50);;

    // Step 3 State (Products)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductAsins, setSelectedProductAsins] = useState<Set<string>>(new Set());

    // Right Panel State
    const [rightPanelOpen, setRightPanelOpen] = useState({ camp: true, ag: true, summary: true });

    // --- INIT ---
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setActiveStoreId(storeId);
            // Reset selections
            setSelectedCampaignIds(new Set());
            setSelectedAdGroupIds(new Set());
            setKeywordText('');
            setSelectedProductAsins(new Set());
            // Set default match types based on negative/positive
            setSelectedMatchTypes(new Set(isKeywordType ? (isNegative ? ['negativeExact'] : ['broad']) : []));
            setBid(0.50);
            loadCampaigns(storeId);
        }
    }, [isOpen, storeId, type]);

    // --- DATA LOADING (Same as AddProductAdsModal) ---
    const loadCampaigns = async (sid: string) => {
        setLoading(true);
        try {
            // Filter by SP only for targeting generally, adjust if needed for SB/SD
            const q = query(collection(db, 'campaigns'), where('storeId', '==', sid), where('enabled', '==', true), where('type', '==', 'SP'));
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

    const loadAvailableProducts = async () => {
        setLoading(true);
        try {
            // Mocking fetching products from existing product_ads for demo
            const q = query(collection(db, 'product_ads'), where('storeId', '==', activeStoreId));
            const snap = await getDocs(q);
            const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            const unique = Array.from(new Map(raw.map(item => [item['asin'], item])).values());
            setAvailableProducts(unique);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    // Trigger loads
    useEffect(() => {
        if (step === 2) loadAdGroups();
        if (step === 3 && !isKeywordType) loadAvailableProducts();
    }, [step, isKeywordType]);


    // --- HANDLERS ---
    const handleStoreChange = (ids: string[]) => {
        if (ids.length > 0) {
            setActiveStoreId(ids[0]);
            loadCampaigns(ids[0]);
            setSelectedCampaignIds(new Set());
            setSelectedAdGroupIds(new Set());
        }
    };

    const toggleSelection = (id: string, set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        const next = new Set(set);
        if (next.has(id)) next.delete(id); else next.add(id);
        setFn(next);
    };

    const handleFinalSave = () => {
        // Package data for parent
        const data = {
            type,
            adGroupIds: Array.from(selectedAdGroupIds),
            // Keyword Data
            keywords: isKeywordType ? keywordText.split('\n').filter(k => k.trim() !== '') : [],
            matchTypes: Array.from(selectedMatchTypes),
            // Product Data
            productAsins: !isKeywordType ? Array.from(selectedProductAsins) : [],
            // Bid (only if positive)
            bid: !isNegative ? bid : null
        };
        onSave(data);
    };


    // --- RENDERERS ---

    // Renders match type checkboxes based on positive/negative type
    const renderMatchTypeSelector = () => {
        const positiveTypes = [
            { id: 'broad', label: 'Broad' },
            { id: 'phrase', label: 'Phrase' },
            { id: 'exact', label: 'Exact' },
        ];
        const negativeTypes = [
            { id: 'negativePhrase', label: 'Negative Phrase' },
            { id: 'negativeExact', label: 'Negative Exact' },
        ];
        const options = isNegative ? negativeTypes : positiveTypes;

        return (
            <div className="flex items-center gap-4 mt-4 bg-white p-3 border border-gray-200 rounded-md">
                 <span className="text-sm font-medium text-gray-700 mr-2">Match Type:</span>
                 {options.map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMatchTypes.has(opt.id) ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                            {selectedMatchTypes.has(opt.id) && <Check className="text-white" size={14} />}
                        </div>
                        <span className="text-sm text-gray-700">{opt.label}</span>
                        <input type="checkbox" className="hidden" checked={selectedMatchTypes.has(opt.id)} onChange={() => toggleSelection(opt.id, selectedMatchTypes, setSelectedMatchTypes)} />
                    </label>
                 ))}
            </div>
        );
    }


    // Step 1 & 2 are identical visually to previous modals, code omitted for brevity but assumed present.
    // Using placeholder renders for Steps 1 & 2 to focus on Step 3 variation.

    // REUSING RENDER LOGIC FROM AddProductAdsModal for uniformity
    const renderStep1 = () => (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="bg-white p-3 border-b border-gray-200 flex gap-3 items-center">
                <div className="w-[220px] h-full mr-2">
                    <StoreSelector mode="single" selectedStoreIds={[activeStoreId]} onSelect={handleStoreChange} showLabel={false} />
                </div>
                <input className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 outline-none" placeholder="Search Campaign Name..." disabled />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? <div className="text-center p-4 text-gray-500">Loading Campaigns...</div> : 
                campaigns.map(camp => {
                    const isSel = selectedCampaignIds.has(camp.id);
                    return (
                        <div key={camp.id} onClick={() => toggleSelection(camp.id, selectedCampaignIds, setSelectedCampaignIds)} className={`bg-white border rounded-md p-4 cursor-pointer transition-all flex items-start gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 shrink-0 ${isSel ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                                {isSel && <Check className="text-white" size={14} />}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 text-sm mb-1">{camp.name}</div>
                                <div className="flex gap-2">
                                    <Badge variant="neutral" size="sm">{camp.type}</Badge>
                                    <Badge variant={camp.enabled ? 'status-enabled' : 'neutral'} size="sm">{camp.enabled ? 'Enabled' : 'Paused'}</Badge>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
                <Button variant="primary" onClick={() => setStep(2)} disabled={selectedCampaignIds.size === 0}>Next</Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
             <div className="bg-white p-3 border-b border-gray-200 font-medium text-gray-700">Select Ad Groups</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? <div className="text-center p-4 text-gray-500">Loading Ad Groups...</div> :
                adGroups.map(ag => {
                    const isSel = selectedAdGroupIds.has(ag.id);
                    return (
                        <div key={ag.id} onClick={() => toggleSelection(ag.id, selectedAdGroupIds, setSelectedAdGroupIds)} className={`bg-white border rounded-md p-4 cursor-pointer transition-all flex items-start gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 shrink-0 ${isSel ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                                {isSel && <Check className="text-white" size={14} />}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 text-sm mb-1">{ag.name}</div>
                                <div className="text-xs text-gray-500">Campaign: {ag.campaignName}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white flex justify-between">
                <Button variant="ghostOutline" onClick={() => setStep(1)}>Prev</Button>
                <Button variant="primary" onClick={() => setStep(3)} disabled={selectedAdGroupIds.size === 0}>Next</Button>
            </div>
        </div>
    );


    // --- STEP 3 VARIANTS ---

    const renderStep3Keyword = () => (
        <div className="flex flex-col h-full bg-[#f8f9fa] p-6">
             <h3 className="text-sm font-bold text-gray-800 mb-4">Enter Keywords (One per line)</h3>
             
             {/* Text Area */}
             <textarea 
                className="w-full h-64 border border-gray-300 rounded-md p-3 text-sm outline-none focus:border-[#4aaada] resize-none font-mono"
                placeholder="e.g. running shoes&#10;blue sneakers"
                value={keywordText}
                onChange={(e) => setKeywordText(e.target.value)}
             />

            {/* Match Types */}
            {renderMatchTypeSelector()}

            {/* Bid Input (Positive Only) */}
            {!isNegative && (
                <div className="mt-4 bg-white p-3 border border-gray-200 rounded-md flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Default Bid:</span>
                    <div className="w-32">
                        <BudgetCell value={bid} isAuto={false} onChange={setBid} />
                    </div>
                </div>
            )}

             <div className="flex-1"></div> {/* Spacer */}
             <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between">
                <Button variant="ghostOutline" onClick={() => setStep(2)}>Prev</Button>
            </div>
        </div>
    );

    const renderStep3Product = () => {
         const filteredProducts = availableProducts.filter(p => 
            p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.asin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="bg-white p-3 border-b border-gray-200 flex flex-col gap-3">
                 {/* Search Bar only */}
                <div className="relative w-full">
                    <input className="w-full border border-gray-200 rounded pl-8 pr-3 py-2 text-sm outline-none focus:border-[#4aaada]" placeholder="Search by ASIN, SKU, Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16}/>
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? <div className="text-center p-4 text-gray-500">Loading Products...</div> :
                    filteredProducts.map(prod => {
                        const isSel = selectedProductAsins.has(prod.asin);
                        return (
                            <div key={prod.id} onClick={() => toggleSelection(prod.asin, selectedProductAsins, setSelectedProductAsins)} className={`bg-white border rounded-md p-3 cursor-pointer flex items-center gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300'}`}>
                                    {isSel && <Check className="text-white" size={14} />}
                                </div>
                                <img src={prod.productImage || "https://placehold.co/40"} className="w-10 h-10 object-cover rounded border border-gray-200" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{prod.productName}</div>
                                    <div className="text-xs text-gray-500 flex gap-2">
                                        <span className="text-[#0066b7]">{prod.asin}</span>
                                        <span>SKU: {prod.sku}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

             {/* Bid Input (Positive Only) placed at bottom for product view */}
             {!isNegative && (
                <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-4 justify-end">
                    <span className="text-sm font-medium text-gray-700">Default Bid:</span>
                    <div className="w-32">
                        <BudgetCell value={bid} isAuto={false} onChange={setBid} />
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-gray-200 bg-white flex justify-between">
                <Button variant="ghostOutline" onClick={() => setStep(2)}>Prev</Button>
            </div>
        </div>
    )};

    // --- RIGHT PANEL (SUMMARY) ---
    const renderRightPanel = () => {
        const selCamps = campaigns.filter(c => selectedCampaignIds.has(c.id));
        const selAgs = adGroups.filter(a => selectedAdGroupIds.has(a.id));
        
        // Calculate Summary Metrics based on Type
        let summaryCount = 0;
        let summaryLabel = 'Items';

        if (isKeywordType) {
            const keywordCount = keywordText.split('\n').filter(k => k.trim() !== '').length;
            const matchTypeCount = selectedMatchTypes.size;
            // Total targets = keywords * match types * ad groups
            summaryCount = keywordCount * matchTypeCount * selAgs.length;
            summaryLabel = isNegative ? 'Negative Keywords' : 'Keywords';
        } else {
            // Total targets = products * ad groups
            summaryCount = selectedProductAsins.size * selAgs.length;
            summaryLabel = isNegative ? 'Negative Products' : 'Products';
        }
        
        const isSaveDisabled = step < 3 || selectedAdGroupIds.size === 0 || summaryCount === 0;


        return (
            <div className="w-[320px] bg-[#f0f6fa] border-l border-gray-200 flex flex-col h-full overflow-y-auto justify-between">
                <div className="flex-1 overflow-y-auto">
                    {/* 1. Campaigns */}
                    <div className="border-b border-gray-200">
                        <button onClick={() => setRightPanelOpen({...rightPanelOpen, camp: !rightPanelOpen.camp})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100">
                            <span className="text-sm font-medium text-gray-700">Selected Campaigns</span>
                            <div className="flex items-center gap-2"><span className="text-xs font-bold">{selCamps.length}</span><ChevronDown size={12}/></div>
                        </button>
                        {rightPanelOpen.camp && (
                            <div className="p-2 bg-white space-y-1 max-h-40 overflow-y-auto">
                                {selCamps.map(c => <div key={c.id} className="text-xs text-gray-600 px-2 py-1 border-b border-gray-50">{c.name}</div>)}
                            </div>
                        )}
                    </div>

                    {/* 2. Ad Groups */}
                    <div className="border-b border-gray-200">
                        <button onClick={() => setRightPanelOpen({...rightPanelOpen, ag: !rightPanelOpen.ag})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100">
                            <span className="text-sm font-medium text-gray-700">Selected Ad Groups</span>
                            <div className="flex items-center gap-2"><span className="text-xs font-bold">{selAgs.length}</span><ChevronDown size={12}/></div>
                        </button>
                        {rightPanelOpen.ag && (
                            <div className="p-2 bg-white space-y-1 max-h-40 overflow-y-auto">
                                {selAgs.map(a => <div key={a.id} className="text-xs text-gray-600 px-2 py-1 border-b border-gray-50">{a.name}</div>)}
                            </div>
                        )}
                    </div>

                    {/* 3. Target Summary */}
                     <div className="border-b border-gray-200 flex-1">
                        <button onClick={() => setRightPanelOpen({...rightPanelOpen, summary: !rightPanelOpen.summary})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100">
                            <span className="text-sm font-medium text-gray-700">Summary</span>
                             <ChevronDown size={12} className={`text-gray-500 transition-transform ${rightPanelOpen.summary ? '' : '-rotate-90'}`} />
                        </button>
                         {rightPanelOpen.summary && (
                            <div className="p-4 bg-white space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Target Type:</span><span className="font-medium">{isKeywordType ? 'Keyword' : 'Product'}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Action:</span><span className={`font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>{isNegative ? 'Negative' : 'Positive'}</span></div>
                                
                                {isKeywordType && (
                                     <div className="flex justify-between text-sm"><span className="text-gray-600">Match Types:</span><span className="font-medium">{Array.from(selectedMatchTypes).join(', ') || '-'}</span></div>
                                )}

                                {!isNegative && (
                                     <div className="flex justify-between text-sm"><span className="text-gray-600">Default Bid:</span><span className="font-medium">${bid.toFixed(2)}</span></div>
                                )}

                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-800">Total Targets to Add:</span>
                                    <Badge variant="status-enabled" size="lg">{summaryCount}</Badge>
                                </div>
                            </div>
                         )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-2 shrink-0">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleFinalSave} disabled={isSaveDisabled} icon={<Check size={18}/>}>Save Targets</Button>
                </div>
            </div>
        );
    };


    const renderProgressBar = () => (
        <div className="bg-[#f5f8fa] border-b border-gray-200 pt-8 pb-4 px-12">
            <div className="relative flex items-center justify-between">
                <div className="absolute top-[7px] left-0 w-full h-[4px] bg-gray-200 rounded-full z-0"></div>
                <div className="absolute top-[7px] left-0 h-[4px] bg-[#4aaada] rounded-full z-0 transition-all duration-300 ease-in-out" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                {[
                    { s: 1, label: 'Select Campaign' },
                    { s: 2, label: 'Select Ad Group' },
                    { s: 3, label: titleMap[type].replace('Add ', '') }
                ].map((item) => (
                    <div key={item.s} className="z-10 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => item.s < step && setStep(item.s as WizardStep)}>
                        <div className={`w-4 h-4 rounded-full border-[3px] transition-colors duration-200 ${step >= item.s ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}></div>
                        <span className={`text-sm font-medium ${step === item.s ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1100px] h-[700px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-[#4aaada] px-5 py-4 flex items-center justify-between shrink-0">
                        <h2 className="text-white font-bold text-lg">{titleMap[type]}</h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        <div className="flex-1 flex flex-col min-w-0">
                            {renderProgressBar()}
                            <div className="flex-1 overflow-hidden relative">
                                {step === 1 && renderStep1()}
                                {step === 2 && renderStep2()}
                                {step === 3 && (isKeywordType ? renderStep3Keyword() : renderStep3Product())}
                            </div>
                        </div>
                        {renderRightPanel()}
                    </div>
                </div>
            </div>
        </Portal>
    );
};