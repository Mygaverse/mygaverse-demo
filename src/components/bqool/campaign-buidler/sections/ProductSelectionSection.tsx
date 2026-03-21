'use client';
import React, { useState, useMemo } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Search, ChevronRight, Trash3, CaretUpFill, CaretDownFill } from "react-bootstrap-icons";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { useCampaignBuilder } from '../data/CampaignBuilderContext';
import { CompetingCampaignsModal } from '../modals/CompetingCampaignsModal';

// --- HELPER: Normalize Ad Type ---
const normalizeAdType = (input: string): 'SP' | 'SB' | 'SD' => {
    const lower = input.toLowerCase().replace(/\s+/g, '');
    if (lower.includes('brand') || lower === 'sb') return 'SB';
    if (lower.includes('display') || lower === 'sd') return 'SD';
    return 'SP'; 
};

export const ProductSelectionSection = () => {    
    const { storeId, selectedProducts, setSelectedProducts, competingCampaigns, adType } = useCampaignBuilder();

    /// View State
    const [viewMode, setViewMode] = useState<'child' | 'parent'>('child');
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Selection State (IDs of checked items in Left Pane)
    const [checkedIds, setCheckedIds] = useState<string[]>([]);
    // UI State for Parent Accordion
    const [expandedParentAsins, setExpandedParentAsins] = useState<string[]>(['B00PARENT1', 'B00PARENT2']);

    // Modal State
    const [isCompetingModalOpen, setIsCompetingModalOpen] = useState(false);

    // --- REAL SEARCH ---
    const triggerSearch = async () => {
        if (!searchTerm.trim() || !storeId) return;
        setHasSearched(true);
        setIsLoading(true);
        setCheckedIds([]);

        try {
            const targetType = normalizeAdType(adType);

            // Firestore text search is limited (prefix only). 
            // Query products by storeId, then client-filter for better demo UX
            const q = query(
                collection(db, 'product_ads'),
                where('storeId', '==', storeId),
                limit(100) // Limit fetch
            );
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            
            // Client filter
            const lower = searchTerm.toLowerCase();

            const filtered = all.filter(p => {
                // Check Search Term
                const matchesSearch = (p.name && p.name.toLowerCase().includes(lower)) || 
                                      (p.asin && p.asin.toLowerCase().includes(lower)) ||
                                      (p.sku && p.sku.toLowerCase().includes(lower));
                
                // Check Campaign Type (if field exists, default to match if missing for safety)
                // We check 'campaignType' or 'type' fields which usually store 'SP'/'SB'
                const pType = p.campaignType || p.type || 'SP'; 
                const matchesType = pType === targetType;

                return matchesSearch && matchesType;
            });
            
            // Map to expected format if needed, ensuring image/parentAsin exists
            const mapped = filtered.map(p => ({
                id: p.id, // product_ad ID
                name: p.productName || p.name || 'Unknown Product',
                asin: p.asin,
                sku: p.sku || '-',
                image: p.productImage || 'https://placehold.co/40x40',

                // Hierarchy Data
                //parentAsin: p.parentAsin || 'UNKNOWN_PARENT',
                //parentName: p.parentName || p.productName || 'Unknown Parent',
                campaignId: p.campaignId,       
                campaignName: p.campaignName, 
                adGroupId: p.adGroupId,
                adGroupName: p.adGroupName
            }));

            setSearchResults(mapped);

        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsLoading(false);
        }
    };

   // Toggle Single Child Selection
    const toggleChildSelection = (id: string) => {
        setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // Toggle Parent (Bulk Select Children)
    const toggleParentSelection = (groupId: string, children: any[]) => {
        const childrenIds = children.map(c => c.id);
        const allSelected = childrenIds.every(id => checkedIds.includes(id));
        if (allSelected) {
            setCheckedIds(prev => prev.filter(id => !childrenIds.includes(id)));
        } else {
            setCheckedIds(prev => Array.from(new Set([...prev, ...childrenIds])));
        }
    };

    // Move to Right Pane
    const handleMoveRight = () => {
        const itemsToAdd = searchResults.filter(p => checkedIds.includes(p.id));
        const uniqueNew = itemsToAdd.filter(
            newItem => !selectedProducts.find(existing => existing.id === newItem.id)
        );
        setSelectedProducts([...selectedProducts, ...uniqueNew]);
        setCheckedIds([]); 
    };

    const handleRemoveFromRight = (id: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    // --- GROUPING LOGIC FOR PARENT VIEW ---
    const groupedProducts = useMemo(() => {
        const groups: Record<string, any[]> = {};
        searchResults.forEach(prod => {
            const key = prod.campaignId;
            if (!groups[key]) groups[key] = [];
            groups[key].push(prod);
        });
        return groups;
    }, [searchResults]);

    // --- RENDERERS ---

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <Search size={32} className="text-[#4aaada]" />
             </div>
             <span className="text-sm font-medium">
                {storeId ? "Search the products that you want to advertise" : "Please select a Store in Step 1 first"}
             </span>
        </div>
    );

    const renderChildView = () => (
        <div className="space-y-2">
            {searchResults.map(prod => {
                const isChecked = checkedIds.includes(prod.id);
                return (
                    <div key={prod.id} onClick={() => toggleChildSelection(prod.id)} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${isChecked ? 'border-[#4aaada] bg-blue-50 ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isChecked ? 'border-[#4aaada] bg-[#4aaada]' : 'border-gray-300 bg-white'}`}>
                            {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <img src={prod.image} className="w-10 h-10 border rounded bg-white object-contain" />
                        <div className="min-w-0">
                            <div className="text-sm text-gray-800 font-medium truncate">{prod.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{prod.asin}</div>
                            {/* Show Campaign Hint */}
                            <div className="text-[10px] text-gray-400 truncate">{prod.campaignName}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderParentView = () => (
        <div className="space-y-3">
            {Object.entries(groupedProducts).map(([campaignId, children]) => {
                const isExpanded = expandedParentAsins.includes(campaignId);
                const childrenIds = children.map(c => c.id);
                const selectedCount = childrenIds.filter(id => checkedIds.includes(id)).length;
                const isAllSelected = selectedCount === children.length && children.length > 0;
                const isPartialSelected = selectedCount > 0 && !isAllSelected;

                // Get Campaign Name from the first child
                const campaignName = children[0]?.campaignName || 'Unassigned';

                return (
                    <div key={campaignId} className={`rounded border transition-all overflow-hidden ${isPartialSelected || isAllSelected ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200'}`}>
                        <div className={`p-3 flex items-start gap-3 bg-gray-50 hover:bg-gray-100 transition-colors`}>
                            <div onClick={() => toggleParentSelection(campaignId, children)} className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 cursor-pointer ${isAllSelected || isPartialSelected ? 'border-[#4aaada] bg-[#4aaada]' : 'border-gray-300 bg-white'}`}>
                                {isAllSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                {isPartialSelected && <div className="w-2 h-0.5 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedParentAsins(p => p.includes(campaignId) ? p.filter(x=>x!==campaignId) : [...p, campaignId])}>
                                <div className="text-sm font-medium text-gray-900 truncate">{campaignId}</div>
                                <div className="text-xs text-[#4aaada] font-bold">{campaignId}</div>
                            </div>
                            <button className="text-gray-400">{isExpanded ? <CaretUpFill/> : <CaretDownFill/>}</button>
                        </div>
                        {isExpanded && (
                            <div className="bg-white border-t border-gray-200">
                                {children.map(child => (
                                    <div key={child.id} onClick={() => toggleChildSelection(child.id)} className={`flex items-center gap-3 pl-7 py-2 border-t border-gray-100 cursor-pointer ${checkedIds.includes(child.id)?'bg-blue-50':''}`}>
                                        <div className={`w-3 h-3 rounded-full border ${checkedIds.includes(child.id)?'bg-[#4aaada] border-[#4aaada]':'bg-white border-gray-300'}`} />
                                        <div className="text-xs text-gray-700 truncate">{child.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div id="products" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">
                Products
            </div>
            
            {/* Controls Row */}
            <div className="p-4 border-0 border-[#e2e2e2] flex items-center gap-4 bg-white">
                {/* View Tabs */}
                <div className="flex rounded-md border border-[#4aaada] overflow-hidden">
                    <button 
                        onClick={() => setViewMode('child')}
                        className={`px-4 py-3 text-sm font-medium ${viewMode === 'child' ? 'bg-[#4aaada] text-white' : 'text-[#4aaada] hover:bg-blue-50'}`}
                    >
                        Child View
                    </button>
                    <button 
                        onClick={() => setViewMode('parent')}
                        className={`px-4 py-3 text-sm font-medium ${viewMode === 'parent' ? 'bg-[#4aaada] text-white' : 'text-[#4aaada] hover:bg-blue-50'}`}
                    >
                        Parent View
                    </button>
                </div>

                {/* Search */}
                <div className="flex-1 h-[48px]">
                    <SearchInputGroup 
                        options={['ASIN', 'SKU', 'Name']} 
                        selectedOption="ASIN" 
                        onOptionChange={()=>{}} 
                        searchTerm={searchTerm} 
                        onSearchChange={setSearchTerm}
                        onSearch={triggerSearch} 
                        placeholder="ASIN, SKU or Product Name"
                    />
                </div>

                {/* Badge */}
                
                <div 
                    onClick={() => setIsCompetingModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-3 bg-white border border-[#4aaada] rounded-full text-[#4aaada] text-xs font-medium cursor-pointer hover:bg-blue-50 transition-colors"
                >
                    Competing Campaigns 
                    <span className="bg-gray-200 p-1 rounded-full text-gray-600 min-w-[24px] text-center">
                        +{competingCampaigns.length}
                    </span>
                </div>
                
            </div>

            {/* Transfer List Area */}
            <div className="flex p-4 h-[500px] gap-4 bg-white">
                {/* Left Pane (Results) */}
                <div className="flex-1 bg-white border border-[#e2e2e2] rounded-md flex flex-col overflow-hidden">
                    <div className="bg-[#F1F7FF] px-4 py-4 border-b border-[#e2e2e2] text-xs font-semibold text-gray-500 uppercase">
                        Product
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                        {isLoading ? <div className="text-center p-4">Loading...</div> : (!hasSearched ? renderEmptyState() : (viewMode === 'child' ? renderChildView() : renderParentView()))}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col justify-center">
                    <button 
                        onClick={handleMoveRight} 
                        disabled={checkedIds.length === 0} 
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:text-[#4aaada] hover:border-[#4aaada] disabled:opacity-50"
                    >
                        <ChevronRight />
                    </button>
                </div>

                {/* Right Pane (Selected) */}
                <div className="flex-1 bg-white border border-[#e2e2e2] rounded-md flex flex-col overflow-hidden">
                    <div className="bg-[#F1F7FF] px-4 py-4 border-b border-[#e2e2e2] flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                            Selected
                        </span>
                        <span className="text-xs text-[#0066b7]">{selectedProducts.length}</span>
                    </div>
                    <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center bg-[#EFF1F5]">
                         <span className="text-xs font-medium text-gray-500">Child ASIN</span>
                         {selectedProducts.length > 0 && (
                             <button onClick={() => setSelectedProducts([])} className="text-xs text-[#0066b7] hover:underline font-medium">Remove all</button>
                         )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {selectedProducts.map(prod => (
                            <div key={prod.id} className="flex items-start gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 group transition-colors">
                                <img src={prod.image} className="w-10 h-10 border rounded bg-white object-contain shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-800 font-medium words-no-wrap truncate">{prod.name}</div>
                                    <div className="text-sm text-[#0066b7] mt-1">{prod.asin} <span className="text-sm text-gray-500 mx-1"> SKU: {prod.sku}</span></div>
                                    {/* Show Campaign in Selected view too */}
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{prod.campaignName}</div>
                                </div>
                                <button 
                                    onClick={() => handleRemoveFromRight(prod.id)} 
                                    className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    <Trash3 size={14} />
                                </button>
                            </div>
                        ))}
                        {selectedProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 opacity-50">
                                <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full" />
                                <span className="text-xs">No products selected</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. RENDER MODAL */}
            <CompetingCampaignsModal 
                isOpen={isCompetingModalOpen}
                onClose={() => setIsCompetingModalOpen(false)}
                data={competingCampaigns}
            />
        </div>
    );
};