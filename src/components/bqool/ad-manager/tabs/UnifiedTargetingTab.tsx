'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Funnel, LayoutThreeColumns, Download, BarChart, PlusCircleFill, ChevronDown } from "react-bootstrap-icons";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

// UI Components
import { Button } from "../../ui/Button";
import { DynamicTable, ColumnDef } from "../../tables/DynamicTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { Portal } from "../../ui/Portal";
import { AdvancedFilterPanel } from "../modals/AdvancedFilterPanel";
import { FilterBar } from "../../ui/FilterBar";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { CAMPAIGNS_OPTIONS } from "../data/ad-status-constants";

import { AddTargetModal, AddTargetType } from '../modals/AddTargetModal';

// Import Columns
import { getSPTargetingColumns } from "../columns/sp/sp-targeting-columns";
import { getSBTargetingColumns } from "../columns/sb/sb-targeting-columns";
import { getSDTargetingColumns } from "../columns/sd/sd-targeting-columns";

interface UnifiedTargetingTabProps {
    adType: string; 
    storeIds: string[];
    dateRange: string;
}

const normalizeAdType = (input: string): 'SP' | 'SB' | 'SD' => {
    const lower = input.toLowerCase().replace(/\s+/g, '');
    if (lower.includes('brand') || lower === 'sb') return 'SB';
    if (lower.includes('display') || lower === 'sd') return 'SD';
    return 'SP'; 
};

// --- HELPER: Scale Metrics for Demo Date Range ---
const applyDateRangeFactor = (data: any[], range: string) => {
    let factor = 1.0; 
    if (range.includes('30')) factor = 0.5;   
    else if (range.includes('14')) factor = 0.25; 
    else if (range.includes('7')) factor = 0.12;  

    return data.map(row => {
        const sales = row.sales * factor;
        const spend = row.spend * factor;
        const clicks = Math.round(row.clicks * factor);
        const impressions = Math.round(row.impressions * factor);
        const orders = Math.round(row.orders * factor);
        const units = Math.round(row.units * factor);

        // Recalc Ratios
        const acos = sales > 0 ? (spend / sales) * 100 : 0;
        const roas = spend > 0 ? sales / spend : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cvr = clicks > 0 ? (orders / clicks) * 100 : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;

        return { ...row, sales, spend, clicks, impressions, orders, units, acos, roas, ctr, cvr, cpc };
    });
};

export function UnifiedTargetingTab({ adType, storeIds, dateRange }: UnifiedTargetingTabProps) {
    const { user } = useAuth();
    const dbType = useMemo(() => normalizeAdType(adType), [adType]);

    // State
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("Search by Targeting Keyword");
    const [statusIds, setStatusIds] = useState<string[]>(['All']);

    // --- STATE FOR ADD TARGET ---
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);
    const [activeAddType, setActiveAddType] = useState<AddTargetType>(null);

    // --- FILTER STATE ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [activeFilters, setActiveFilters] = useState<any[]>([]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ 
        key: '', 
        direction: null 
    });

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            
            // Validate Store Selection
            if (!storeIds || storeIds.length === 0) {
                setTableData([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setTableData([]);

            try {
                // Multi-store query
                const q = query(
                    collection(db, 'targeting'),
                    where('storeId', 'in', storeIds.slice(0, 10)), // Limit 10
                    where('campaignType', '==', dbType)
                );

                const snapshot = await getDocs(q);
                const rawData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Apply Scaling
                const processedData = applyDateRangeFactor(rawData, dateRange);
                setTableData(processedData);

            } catch (error) {
                console.error("Error loading targeting:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, dbType, storeIds, dateRange]);

    // --- 2. ACTIONS ---
    const handleToggleStatus = useCallback(async (id: string, current: boolean) => {
        setTableData(prev => prev.map(row => row.id === id ? { ...row, enabled: !current } : row));
        try { await updateDoc(doc(db, 'targeting', id), { enabled: !current }); } catch (e) { console.error(e); }
    }, []);

    const handleUpdateBid = useCallback(async (id: string, field: string, val: any) => {
        setTableData(prev => prev.map(row => row.id === id ? { ...row, [field]: val } : row));
        try { await updateDoc(doc(db, 'targeting', id), { [field]: val }); } catch (e) { console.error(e); }
    }, []);

    const handleTargetingBidChange = useCallback(async (id: string, field: string, val: any) => {
        // We only care about main 'bid' updates for history logging here.
        // If updating min/max AI limits, we might skip or log differently.
        
        // 1. Optimistic Update
        setTableData(prev => prev.map(row => {
            if (row.id === id) {
                if (field === 'bid') return { ...row, bid: val };
                if (field === 'minBid') return { ...row, minBid: val };
                if (field === 'maxBid') return { ...row, maxBid: val };
            }
            return row;
        }));

        try {
            const batch = writeBatch(db);
            const targetRef = doc(db, 'targeting', id); // Assuming collection is 'targeting'

            // 2. Update Document
            batch.update(targetRef, { 
                [field]: val,
                lastUpdated: new Date().toISOString()
            });

            // 3. Log History ONLY for Main Bid Changes
            if (field === 'bid') {
                const row = tableData.find(r => r.id === id);
                if (row) {
                    const historyRef = doc(collection(db, 'change_history'));
                    
                    // RESOLVE TARGETING TEXT
                    // Check your data model: usually it's 'targetingText' based on your column definition
                    // fallback to keywordText, asin, etc.
                    const resolvedText = row.targetingText || row.keywordText || row.asin || row.text || 'Unknown Target';
                    const resolvedMatch = row.matchType || 'Target';

                    const historyData = {
                        entityId: id,
                        entityType: 'Targeting',
                        
                        // Context
                        goalName: row.goalName || 'Advanced',
                        campaignName: row.campaignName || 'Unknown Campaign',
                        adGroupName: row.adGroupName || 'Unknown Ad Group',
                        storeId: row.storeId,
                        userId: user?.uid,

                        // CRITICAL: Save the text so history table can read it
                        targetingText: resolvedText, 
                        targetingType: resolvedMatch,

                        changeType: 'Bid Update',
                        oldValue: row.bid, // Old value before update
                        newValue: val,
                        timestamp: new Date().toISOString()
                    };
                    batch.set(historyRef, historyData);
                }
            }

            await batch.commit();

        } catch (error) {
            console.error("Error updating bid:", error);
        }
    }, [tableData, user]);

    // --- 3. BULK ACTIONS ---
    const handleBulkAction = useCallback(async (action: string, ids: string[], value?: any) => {
        console.log(`Bulk Action: ${action}`, ids, value);
        
        // 1. Optimistic UI Update
        setTableData(prev => prev.map(row => {
            if (!ids.includes(row.id)) return row;

            // Handle Status Changes
            if (action === 'enable') return { ...row, enabled: true, status: 'Active' };
            if (action === 'pause') return { ...row, enabled: false, status: 'Paused' };
            if (action === 'archive') return { ...row, status: 'Archived', enabled: false };
            
            // Handle "Set Bid"
            if (action === 'bid') {
                return { ...row, bid: Number(value) };
            }

            // Handle "Set AI-Bidding"
            if (action === 'ai-bid') {
                return { 
                    ...row, 
                    minBid: value.minBid, 
                    maxBid: value.maxBid 
                };
            }

            return row;
        }));

        // 2. Database Update
        try {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const docRef = doc(db, 'targeting', id);
                
                if (action === 'enable') batch.update(docRef, { enabled: true, status: 'Active' });
                else if (action === 'pause') batch.update(docRef, { enabled: false, status: 'Paused' });
                else if (action === 'archive') batch.update(docRef, { enabled: false, status: 'Archived' });
                
                else if (action === 'bid') {
                    batch.update(docRef, { bid: Number(value) });
                }
                else if (action === 'ai-bid') {
                    batch.update(docRef, { 
                        minBid: value.minBid, 
                        maxBid: value.maxBid 
                    });
                }
            });
            await batch.commit();
        } catch (error) { console.error("Bulk update failed:", error); }
    }, []);

    // --- ADD TARGET SAVE HANDLER ---
    const handleSaveTargets = async (data: any) => {
        console.log("Saving Targets Data:", data);
        const { type, adGroupIds, keywords, matchTypes, productAsins, bid } = data;
        const isNegative = type.includes('neg');
        const isKeyword = type.includes('keyword');

        try {
            const batch = writeBatch(db);
            let targetsCreated = 0;

            // 1. Fetch Ad Group Details (to get Campaign ID/Name, Store ID, etc.)
            // Need to fetch them to populate the targeting document correctly.
            const adGroupDocs = await Promise.all(adGroupIds.map((id: string) => getDoc(doc(db, 'ad_groups', id))));
            const adGroupsMap = adGroupDocs.reduce((acc: any, curr) => {
                if(curr.exists()) acc[curr.id] = curr.data();
                return acc;
            }, {});


            // 2. Iterate and Create Targets
            adGroupIds.forEach((agId: string) => {
                const agData = adGroupsMap[agId];
                if (!agData) return;

                const baseTargetData = {
                    storeId: agData.storeId,
                    campaignId: agData.campaignId,
                    campaignName: agData.campaignName,
                    adGroupId: agId,
                    adGroupName: agData.name,
                    campaignType: dbType, // 'SP', 'SB', etc.
                    enabled: true,
                    status: 'Enabled',
                    createdAt: new Date().toISOString(),
                    // Metrics defaults
                    impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0, units: 0
                };

                if (isKeyword) {
                    // Create target for EACH keyword + match type combination
                    keywords.forEach((kw: string) => {
                        matchTypes.forEach((mt: string) => {
                            const newDocRef = doc(collection(db, 'targeting'));
                            batch.set(newDocRef, {
                                ...baseTargetData,
                                id: newDocRef.id,
                                type: isNegative ? 'NEGATIVE_KEYWORD' : 'KEYWORD',
                                targetingText: kw, // The actual keyword
                                matchType: mt,
                                bid: isNegative ? null : bid // Only positive has bid
                            });
                            targetsCreated++;
                        });
                    });
                } else {
                     // Create target for EACH product ASIN
                     productAsins.forEach((asin: string) => {
                        const newDocRef = doc(collection(db, 'targeting'));
                        batch.set(newDocRef, {
                            ...baseTargetData,
                            id: newDocRef.id,
                            type: isNegative ? 'NEGATIVE_PRODUCT' : 'PRODUCT',
                            targetingText: `asin="${asin}"`, // Standard format
                            asin: asin,
                            bid: isNegative ? null : bid
                        });
                        targetsCreated++;
                     });
                }
            });

            if (targetsCreated > 0) {
                await batch.commit();
                console.log(`Successfully created ${targetsCreated} targets.`);
                // Optionally reload data here
            }
            setActiveAddType(null); // Close modal

        } catch (e) {
            console.error("Error saving targets:", e);
        }
    };


    // --- FILTER HANDLERS ---
    const handleApplyFilters = (newFilters: any[]) => {
        setActiveFilters(newFilters);
        setIsFilterPanelOpen(false);
    };

    const handleRemoveFilter = (filterId: number) => {
        setActiveFilters(prev => prev.filter(f => f.id !== filterId));
    };

    const handleResetFilters = () => {
        setActiveFilters([]);
        setStatusIds(['All']);
        setSearchTerm("");
    };

    // Sorting Handler
    const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
        setSortConfig({ key, direction });
    };

    // --- 4. DYNAMIC SUMMARY ---
    const summaryData = useMemo(() => {
        if (tableData.length === 0) return null;

        const totalSales = tableData.reduce((acc, row) => acc + (row.sales || 0), 0);
        const totalSpend = tableData.reduce((acc, row) => acc + (row.spend || 0), 0);
        const totalOrders = tableData.reduce((acc, row) => acc + (row.orders || 0), 0);
        const totalClicks = tableData.reduce((acc, row) => acc + (row.clicks || 0), 0);
        const totalImpressions = tableData.reduce((acc, row) => acc + (row.impressions || 0), 0);
        const totalUnits = tableData.reduce((acc, row) => acc + (row.units || 0), 0);

        const avgAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
        const avgRoas = totalSpend > 0 ? totalSales / totalSpend : 0;
        const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgCvr = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

        return {
            name: "Total",
            sales: `$${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            spend: `$${totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            acos: `${avgAcos.toFixed(2)}%`,
            roas: avgRoas.toFixed(2),
            orders: totalOrders.toLocaleString(),
            units: totalUnits.toLocaleString(),
            clicks: totalClicks.toLocaleString(),
            impressions: totalImpressions.toLocaleString(),
            cpc: `$${avgCpc.toFixed(2)}`,
            ctr: `${avgCtr.toFixed(2)}%`,
            cvr: `${avgCvr.toFixed(2)}%`
        };
    }, [tableData]);

    // --- 5. RENDER ---
    const columns = useMemo(() => {
        if (dbType === "SB") return getSBTargetingColumns(handleToggleStatus, handleTargetingBidChange, handleBulkAction, sortConfig, handleSort);
        if (dbType === "SD") return getSDTargetingColumns(handleToggleStatus, handleTargetingBidChange, handleBulkAction, sortConfig, handleSort);
        return getSPTargetingColumns(handleToggleStatus, handleTargetingBidChange, handleBulkAction, sortConfig, handleSort );
    }, [dbType, handleToggleStatus, handleTargetingBidChange, handleBulkAction, sortConfig]);

    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        // 1. Start with a clean copy of the data
        let data = [...tableData];

        // 2. Apply Filtering (Search, Status, etc.) - KEEP YOUR EXISTING LOGIC HERE
        if (searchTerm) {
            data = data.filter(r => 
                r.targetingText?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.adGroupName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (!statusIds.includes('All')) {
            const showEnabled = statusIds.includes('Enabled');
            const showPaused = statusIds.includes('Paused');
            const showArchived = statusIds.includes('Archived');
            data = data.filter(r => {
                if (showEnabled && r.enabled) return true;
                if (showPaused && !r.enabled && r.status !== 'Archived') return true;
                if (showArchived && r.status === 'Archived') return true;
                return false;
            });
        }

        // 3. Apply Sorting (THE FIX)
        if (sortConfig.key && sortConfig.direction) {
            data.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                // Handling undefined/null: always push to the bottom
                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;

                // For strings, make comparison case-insensitive
                if (typeof valA === 'string' && typeof valB === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                // For numbers, ensure they are numbers
                if (typeof valA === 'number' && typeof valB === 'number') {
                    // Standard numeric sort
                }

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return data;
    }, [tableData, searchTerm, statusIds, activeFilters, sortConfig]);

    // --- PAGINATION ---
    const paginatedData = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredData.slice(startIndex, startIndex + pageSize);
    }, [filteredData, page, pageSize]);

    // --- FILTER POPOVER POSITIONING ---
    const getPopoverStyles = () => {
        if (!filterButtonRef.current) return {};
        const rect = filterButtonRef.current.getBoundingClientRect();
        return {
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX - 200, // Shift left to align nicely
        };
    };

    // --- Add Menu Popover Style ---
    const getAddMenuStyles = () => {
        if (!addMenuRef.current) return {};
        const rect = addMenuRef.current.getBoundingClientRect();
        return { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX };
    };

    return (
        <div className="flex flex-col h-full gap-4 pb-0 relative">
            {/* Header Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 h-[48px] z-60 relative">
                    <div className="flex-1 h-full z-[100] relative">
                        {/* ... SearchInputGroup ... */}
                        <SearchInputGroup 
                            options={['Search by Targeting Keyword','Search by Targeting Product SKU','Search by Category','Search by Negative Keyword','Search by Negative Product ASIN','Search by Negative Brand','Search by Ad Group','Search by Campaign']} selectedOption={searchType} onOptionChange={setSearchType}
                            searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Targeting Keyword" 
                        />
                    </div>
                    <div className="w-[280px]">
                        {/* ... MultipleSelector ... */}
                        <MultipleSelector 
                            label="Target Status" options={CAMPAIGNS_OPTIONS} 
                            selectedIds={statusIds} onChange={setStatusIds} width="w-full" />
                    </div>

                    {/* --- MODIFIED BUTTON SECTION --- */}
                    <div className="flex items-center gap-2">
                        {/* NEW ADD TARGET DROPDOWN */}
                        <div ref={addMenuRef} className="relative">
                            <Button variant="primary" size="lg" icon={<PlusCircleFill size={16} />} rightIcon={<ChevronDown size={12}/>} onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}>
                                Add Target
                            </Button>
                            {isAddMenuOpen && (
                                <Portal>
                                    <div className="fixed inset-0 z-[998] bg-transparent" onClick={() => setIsAddMenuOpen(false)} />
                                    <div className="fixed z-[999] bg-white border border-gray-200 rounded-md shadow-xl py-1 w-56 animate-in fade-in zoom-in-95 duration-75 flex flex-col" style={getAddMenuStyles()}>
                                        <button onClick={() => { setActiveAddType('keyword'); setIsAddMenuOpen(false); }} className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add Keyword Target</button>
                                        <button onClick={() => { setActiveAddType('neg-keyword'); setIsAddMenuOpen(false); }} className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add Negative Keyword Target</button>
                                        <div className="border-b border-gray-100 my-1"></div>
                                        <button onClick={() => { setActiveAddType('product'); setIsAddMenuOpen(false); }} className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add Product Target</button>
                                        <button onClick={() => { setActiveAddType('neg-product'); setIsAddMenuOpen(false); }} className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add Negative Product Target</button>
                                    </div>
                                </Portal>
                            )}
                        </div>

                        {/* Wrapper div for ref positioning */}
                        <div ref={filterButtonRef}>
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<Funnel size={16} />}
                                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                                // Apply active styles if open or filters exist
                                className={isFilterPanelOpen || activeFilters.length > 0 
                                    ? "!bg-[#f0f9ff] !border-[#4aaada] !text-[#4aaada] shadow-none" 
                                    : ""
                                }
                            >
                                Filters
                                {activeFilters.length > 0 && (
                                    <span className="ml-1 bg-[#4aaada] text-white text-[10px] px-1.5 rounded-full">
                                        {activeFilters.length}
                                    </span>
                                )}
                            </Button>
                        </div>

                        <Button variant="secondary" size="lg" icon={<LayoutThreeColumns size={16} />}>Columns</Button>
                        <Button variant="secondary" size="lg" icon={<Download size={16} />}>Download</Button>
                        <Button variant="secondary" size="lg" icon={<BarChart size={16} />}>Chart</Button>
                    </div>
                </div>

                {/* FILTER BAR (Dynamic) */}
                <div className="w-full">
                    <FilterBar 
                        filters={activeFilters.map(f => ({
                            label: `${f.field}: ${f.value}`,
                            onRemove: () => handleRemoveFilter(f.id)
                        }))} 
                        onReset={handleResetFilters} 
                    />
                </div>
            </div>

            <div className="min-h-0 bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden flex flex-col">
                {loading ? <div className="flex-1 flex items-center justify-center text-gray-500">Loading Targeting...</div> : 
                (filteredData.length === 0 ? <div className="flex-1 flex items-center justify-center text-gray-500">No targeting found.</div> :
                <DynamicTable data={paginatedData} columns={columns} className="flex-1" summaryData={summaryData} />)}
            </div>
            
            <div className="sticky bottom-0 border-t border-[#e2e2e2] z-[400] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
                <Pagination currentPage={page} totalItems={tableData.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </div>

            {/* NEW ADD TARGET WIZARD MODAL */}
            {activeAddType && storeIds.length > 0 && (
                <AddTargetModal 
                    isOpen={!!activeAddType}
                    onClose={() => setActiveAddType(null)}
                    onSave={handleSaveTargets}
                    storeId={storeIds[0]} // Use first selected store context
                    type={activeAddType}
                />
            )}

            {/* ADVANCED FILTER PANEL (In Portal) */}
            {isFilterPanelOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[999] bg-transparent" onClick={() => setIsFilterPanelOpen(false)} />
                    <div 
                        className="fixed z-[1000] shadow-2xl rounded-lg overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-100"
                        style={getPopoverStyles()}
                    >
                        <AdvancedFilterPanel 
                            onClose={() => setIsFilterPanelOpen(false)}
                            onApply={handleApplyFilters}
                        />
                    </div>
                </Portal>
            )}
        </div>
    );
}