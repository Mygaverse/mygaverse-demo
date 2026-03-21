'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Trash, Check, Grid, ListUl } from "react-bootstrap-icons";
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Badge } from "@/components/bqool/ui/Badge";
import { Button } from "@/components/bqool/ui/Button";
import { Portal } from "@/components/bqool/ui/Portal";
import { StoreSelector } from "@/components/bqool/ui/StoreSelector"; 

interface AddProductAdsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedAds: any[]) => Promise<void>;
    storeId: string;
}

type WizardStep = 1 | 2 | 3;

export const AddProductAdsModal = ({ isOpen, onClose, onSave, storeId }: AddProductAdsModalProps) => {
    // --- STATE ---
    const [step, setStep] = useState<WizardStep>(1);
    const [activeStoreId, setActiveStoreId] = useState(storeId);
    
    // Data State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [adGroups, setAdGroups] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]); // These are potential products to add
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
    const [selectedAdGroupIds, setSelectedAdGroupIds] = useState<Set<string>>(new Set());
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    // View State (Step 3)
    const [viewMode, setViewMode] = useState<'child' | 'parent'>('child');
    const [searchTerm, setSearchTerm] = useState('');

    // Right Panel Accordion
    const [rightPanelOpen, setRightPanelOpen] = useState({ camp: true, ag: true, ads: true });

    // --- INIT ---
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setActiveStoreId(storeId);
            setSelectedCampaignIds(new Set());
            setSelectedAdGroupIds(new Set());
            setSelectedProductIds(new Set());
            loadCampaigns(storeId);
        }
    }, [isOpen, storeId]);

    // --- DATA LOADING ---
    const loadCampaigns = async (sid: string) => {
        setLoading(true);
        try {
            // Fetch only SP campaigns for Product Ads usually
            const q = query(collection(db, 'campaigns'), 
                where('storeId', '==', sid), 
                where('enabled', '==', true)
            );
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

    const loadProducts = async () => {
        // In a real app, this might fetch from a 'products' catalog collection
        // For now, we mock fetching 'available' products or query existing ones to add
        setLoading(true);
        try {
            // Mocking a fetch of "Available Products" from the store
            // Ideally you query a 'products' collection. 
            // Here I'll just query existing product_ads as a proxy for catalog for demo purposes
            const q = query(collection(db, 'product_ads'), where('storeId', '==', activeStoreId));
            const snap = await getDocs(q);
            const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            // Deduplicate by ASIN for catalog view
            const unique = Array.from(new Map(raw.map(item => [item['asin'], item])).values());
            setProducts(unique);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Trigger Loads on Step Change
    useEffect(() => {
        if (step === 2) loadAdGroups();
        if (step === 3) loadProducts();
    }, [step]);

    // --- HANDLERS ---
    const handleStoreChange = (ids: string[]) => {
        if (ids.length > 0) {
            setActiveStoreId(ids[0]);
            loadCampaigns(ids[0]);
            setSelectedCampaignIds(new Set());
            setSelectedAdGroupIds(new Set());
            setSelectedProductIds(new Set());
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

    const toggleProduct = (asin: string) => {
        const next = new Set(selectedProductIds);
        if (next.has(asin)) next.delete(asin); else next.add(asin);
        setSelectedProductIds(next);
    };

    const handleSave = () => {
        // Collect selected product data to pass back
        const selectedItems = products.filter(p => selectedProductIds.has(p.asin));
        onSave(selectedItems);
    };

    // --- RENDERERS ---

    const renderProgressBar = () => (
        <div className="bg-[#f5f8fa] border-b border-gray-200 pt-8 pb-4 px-12">
            <div className="relative flex items-center justify-between">
                <div className="absolute top-[7px] left-0 w-full h-[4px] bg-gray-200 rounded-full z-0"></div>
                <div className="absolute top-[7px] left-0 h-[4px] bg-[#4aaada] rounded-full z-0 transition-all duration-300 ease-in-out" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                {[
                    { s: 1, label: 'Select Campaign' },
                    { s: 2, label: 'Select Ad Group' },
                    { s: 3, label: 'Add Product Ads' }
                ].map((item) => (
                    <div key={item.s} className="z-10 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => item.s < step && setStep(item.s as WizardStep)}>
                        <div className={`w-4 h-4 rounded-full border-[3px] transition-colors duration-200 ${step >= item.s ? 'bg-[#4aaada] border-[#4aaada]' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}></div>
                        <span className={`text-sm font-medium ${step === item.s ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    // STEP 1: SELECT CAMPAIGN
    const renderStep1 = () => (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="bg-white p-3 border-b border-gray-200 flex gap-3 items-center">
                <div className="w-[220px] h-full mr-2">
                    <StoreSelector mode="single" selectedStoreIds={[activeStoreId]} onSelect={handleStoreChange} showLabel={false} />
                </div>
                <input className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 outline-none" placeholder="Search Campaign Name..." />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? <div className="text-center p-4 text-gray-500">Loading Campaigns...</div> : 
                campaigns.map(camp => {
                    const isSel = selectedCampaignIds.has(camp.id);
                    return (
                        <div key={camp.id} onClick={() => toggleCampaign(camp.id)} className={`bg-white border rounded-md p-4 cursor-pointer transition-all flex items-start gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
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

    // STEP 2: SELECT AD GROUP
    const renderStep2 = () => (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="bg-white p-3 border-b border-gray-200 font-medium text-gray-700">Select Ad Groups</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? <div className="text-center p-4 text-gray-500">Loading Ad Groups...</div> :
                adGroups.map(ag => {
                    const isSel = selectedAdGroupIds.has(ag.id);
                    return (
                        <div key={ag.id} onClick={() => toggleAdGroup(ag.id)} className={`bg-white border rounded-md p-4 cursor-pointer transition-all flex items-start gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
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

    // STEP 3: SELECT PRODUCTS (Child/Parent View)
    const renderStep3 = () => {
        const filteredProducts = products.filter(p => 
            p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.asin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="flex flex-col h-full bg-[#f8f9fa]">
                <div className="bg-white p-3 border-b border-gray-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex bg-gray-100 rounded p-1">
                            <button onClick={() => setViewMode('child')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'child' ? 'bg-white text-[#4aaada] shadow-sm' : 'text-gray-600'}`}>Child View</button>
                            <button onClick={() => setViewMode('parent')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'parent' ? 'bg-white text-[#4aaada] shadow-sm' : 'text-gray-600'}`}>Parent View</button>
                        </div>
                        <div className="relative w-64">
                            <input className="w-full border border-gray-200 rounded pl-8 pr-3 py-1.5 text-sm outline-none" placeholder="Search by ASIN, SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <Search className="absolute left-2.5 top-2 text-gray-400" size={14}/>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? <div className="text-center p-4 text-gray-500">Loading Products...</div> :
                    filteredProducts.map(prod => {
                        const isSel = selectedProductIds.has(prod.asin);
                        return (
                            <div key={prod.id} onClick={() => toggleProduct(prod.asin)} className={`bg-white border rounded-md p-3 cursor-pointer flex items-center gap-4 hover:shadow-sm ${isSel ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
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
        const selProds = products.filter(p => selectedProductIds.has(p.asin));

        return (
            <div className="w-[320px] bg-[#f0f6fa] border-l border-gray-200 flex flex-col h-full overflow-y-auto">
                
                {/* 1. Campaigns */}
                <div className="border-b border-gray-200">
                    <button onClick={() => setRightPanelOpen({...rightPanelOpen, camp: !rightPanelOpen.camp})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100">
                        <span className="text-sm font-medium text-gray-700">Selected Campaigns</span>
                        <div className="flex items-center gap-2"><span className="text-xs font-bold">{selCamps.length}</span><ChevronDown size={12}/></div>
                    </button>
                    {rightPanelOpen.camp && (
                        <div className="p-2 bg-white space-y-1">
                            {selCamps.map(c => <div key={c.id} className="text-xs text-gray-600 px-2 py-1 border-b border-gray-50 last:border-0">{c.name}</div>)}
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
                        <div className="p-2 bg-white space-y-1">
                            {selAgs.map(a => <div key={a.id} className="text-xs text-gray-600 px-2 py-1 border-b border-gray-50 last:border-0">{a.name}</div>)}
                        </div>
                    )}
                </div>

                {/* 3. Products */}
                <div className="border-b border-gray-200 flex-1">
                    <button onClick={() => setRightPanelOpen({...rightPanelOpen, ads: !rightPanelOpen.ads})} className="w-full flex items-center justify-between p-3 hover:bg-gray-100">
                        <span className="text-sm font-medium text-gray-700">Selected Product Ads</span>
                        <div className="flex items-center gap-2"><span className="text-xs font-bold">{selProds.length}</span><ChevronDown size={12}/></div>
                    </button>
                    {rightPanelOpen.ads && (
                        <div className="p-2 bg-white space-y-2">
                            {selProds.map(p => (
                                <div key={p.id} className="flex gap-2 items-start border border-gray-100 rounded p-2 relative group">
                                    <img src={p.productImage} className="w-8 h-8 rounded border border-gray-200" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-800 line-clamp-1">{p.productName}</div>
                                        <div className="text-[10px] text-gray-500">{p.asin}</div>
                                    </div>
                                    <button onClick={() => toggleProduct(p.asin)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500"><Trash size={10}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={selProds.length === 0}>Save</Button>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1100px] h-[700px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-[#4aaada] px-5 py-4 flex items-center justify-between shrink-0">
                        <h2 className="text-white font-bold text-lg">Add Product Ads</h2>
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
                </div>
            </div>
        </Portal>
    );
};