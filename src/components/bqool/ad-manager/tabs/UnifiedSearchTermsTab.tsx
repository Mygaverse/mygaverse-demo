'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Funnel, LayoutThreeColumns, Download, BarChart, Search } from "react-bootstrap-icons";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { Button } from "../../ui/Button";
import { DynamicTable, ColumnDef } from "../../tables/DynamicTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { Portal } from "../../ui/Portal";
import { AdvancedFilterPanel } from "../modals/AdvancedFilterPanel";
import { FilterBar } from "../../ui/FilterBar";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { CAMPAIGNS_OPTIONS } from "../data/ad-status-constants";
import { AddAsTargetModal } from "../modals/AddAsTargetModal";

// Import Columns
import { getSPSearchTermsColumns } from "../columns/sp/sp-searchterms-columns";
import { getSBSearchTermsColumns } from "../columns/sb/sb-searchterms-columns";

interface UnifiedSearchTermsTabProps {
    adType: string;
    storeIds: string[];
    dateRange: string;
}

const normalizeAdType = (input: string): 'SP' | 'SB' => {
    const lower = input.toLowerCase().replace(/\s+/g, '');
    if (lower.includes('brand') || lower === 'sb') return 'SB';
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

export function UnifiedSearchTermsTab({ adType, storeIds, dateRange }: UnifiedSearchTermsTabProps) {
    const { user } = useAuth();
    const dbType = useMemo(() => normalizeAdType(adType), [adType]);

    // State
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("Search by Search Terms Keyword");
    const [statusIds, setStatusIds] = useState<string[]>(['All']);

    // --- FILTER STATE ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [activeFilters, setActiveFilters] = useState<any[]>([]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ 
        key: '', 
        direction: null 
    });
    
    // Modal State - Now includes storeId
    const [modalConfig, setModalConfig] = useState<{ 
        isOpen: boolean; 
        id: string | null; 
        term: string; 
        type: any; 
        storeId: string; // Added to fetch correct campaigns
    }>({
        isOpen: false, id: null, term: '', type: 'product', storeId: ''
    });

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            if (adType === "Sponsored Display") {
                setTableData([]); setLoading(false); return;
            }
            
            // Validate Store Selection
            if (!storeIds || storeIds.length === 0) {
                setTableData([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setTableData([]);

            try {
                //const dbType = AD_TYPE_MAP[adType] || 'SP';
                
                // Multi-store query
                const q = query(
                    collection(db, 'search_terms'),
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
                console.error(error); 
            } finally { 
                setLoading(false); 
            }
        };
        loadData();
    }, [user, adType, storeIds, dateRange]);

    // --- Actions ---
    const handleAddAs = (id: string, action: string) => {
        // Find the search term row to get the context (Store ID is crucial here)
        const row = tableData.find(r => r.id === id);
        if (!row) return;

        setModalConfig({
            isOpen: true,
            id: id,
            term: row.searchTerm,
            type: action as any,
            storeId: row.storeId // <--- Pass the store ID from the row
        });
    };

    const handleModalSave = async () => {
        if (!modalConfig.id || !user) return;

        // 1. Determine Badge Text
        let badgeText = '';
        switch(modalConfig.type) {
            case 'keyword': badgeText = 'Keyword'; break;
            case 'neg-keyword': badgeText = 'Negative Keyword'; break;
            case 'product': badgeText = 'Product Target'; break;
            case 'neg-product': badgeText = 'Negative Product'; break;
        }

        // 2. Find Context (Campaign/AdGroup Names) from Table Data
        const row = tableData.find(r => r.id === modalConfig.id);
        const campaignName = row?.campaignName || 'Unknown Campaign';
        const adGroupName = row?.adGroupName || 'Unknown Ad Group';

        // Optimistic Update
        setTableData(prev => prev.map(row => {
            if (row.id === modalConfig.id) {
                const currentBadges = row.addedAsTypes || [];
                if (!currentBadges.includes(badgeText)) {
                    return { ...row, addedAsTypes: [...currentBadges, badgeText] };
                }
            }
            return row;
        }));

        // DB Update
        try {
            const batch = writeBatch(db);

            // Operation A: Update Search Term Document (Add Badge)
            const termRef = doc(db, 'search_terms', modalConfig.id);
            batch.update(termRef, {
                addedAsTypes: arrayUnion(badgeText)
            });

            // Operation B: Create Change History Record
            const historyRef = doc(collection(db, 'change_history'));
            const historyData = {
                entityId: modalConfig.id,
                entityName: modalConfig.term, // The Search Term Text
                entityType: 'Search Term',
                storeId: modalConfig.storeId,
                userId: user.uid,

                changeType: 'Term Harvest',      // Specific type for Ad History filtering
                fieldName: 'addedAsTypes',
                newValue: badgeText,             // The specific action taken (e.g. "Negative Keyword")
                
                // Context for easy display in history table
                campaignName: campaignName,
                adGroupName: adGroupName,
                
                timestamp: new Date().toISOString()
            };
            batch.set(historyRef, historyData);

            // Commit Batch
            await batch.commit();
            console.log("Search term harvest logged.");

            /*
            await updateDoc(doc(db, 'search_terms', modalConfig.id), {
                addedAsTypes: arrayUnion(badgeText)
            });
            */
        } catch (e) { 
            console.error("Error saving search term action:", e); 
            // Optional: Revert UI state on error
        }

        setModalConfig(prev => ({ ...prev, isOpen: false }));
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

    // --- Summary ---
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
            sales: `$${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
            spend: `$${totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
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

    if (adType === "Sponsored Display") {
        return <div className="flex items-center justify-center h-full text-gray-500 min-h-[200px]">Search Terms not available for Sponsored Display.</div>;
    }

    const columns = adType === "Sponsored Brands" ? getSBSearchTermsColumns(handleAddAs, sortConfig, handleSort) : getSPSearchTermsColumns(handleAddAs, sortConfig, handleSort);

    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        let data = [...tableData];

        // 1. Search
        if (searchTerm) {
            data = data.filter(r => 
                r.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // 2. Status Dropdown
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

        // 3. Advanced Filters
        if (activeFilters.length > 0) {
            data = data.filter(row => {
                // Must match ALL active filters (AND logic)
                return activeFilters.every(filter => {
                    const val = filter.value;
                    
                    if (filter.field === 'Status') {
                        if (val === 'Active') return row.enabled === true;
                        if (val === 'Paused') return row.enabled === false;
                    }
                    if (filter.field === 'Campaign Type') {
                        // Assuming val is 'SP', 'SB', etc. or 'Manual'/'Auto'
                        // Simple check if the type string exists in row type
                        return row.type === val || (row.type === 'SP' && val === 'SP'); 
                    }
                    if (filter.field === 'Budget') {
                        // Example: "Budget > 50" -> parse logic
                        // For demo simple check:
                        return row.budget > 0; 
                    }
                    return true;
                });
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
        return filteredData.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
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

    return (
        <div className="flex flex-col h-full gap-4 pb-0 relative">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 h-[48px] z-60 relative">
                    <div className="flex-1 h-full z-[100] relative">
                        <SearchInputGroup 
                            options={['Search by Search Terms Keyword','Search by Search Terms Product ASIN','Search by Targeting Keyword','Search by Targeting ASIN','Search by Targeting Category', 'Search by Ad Group','Search by Campaign']} selectedOption={searchType} onOptionChange={setSearchType}
                            searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search Terms Keyword" 
                        />
                    </div>
                    <div className="w-[280px]"><MultipleSelector label="Filter Status" options={CAMPAIGNS_OPTIONS} selectedIds={statusIds} onChange={setStatusIds} width="w-full" /></div>
                    <div className="flex items-center gap-2">
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

            {/* Table */}
            <div className="min-h-0 bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden flex flex-col">
                {loading ? <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div> : 
                (filteredData.length === 0 ? <div className="flex-1 flex items-center justify-center text-gray-500">No search terms found.</div> :
                <DynamicTable data={paginatedData} columns={columns} className="flex-1" summaryData={summaryData} />)}
            </div>
            <div className="sticky bottom-0 border-t border-[#e2e2e2] z-[400] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
                <Pagination currentPage={page} totalItems={tableData.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </div>

            {/* NEW: Wizard Modal */}
            {modalConfig.isOpen && (
                <AddAsTargetModal 
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                    onSave={handleModalSave}
                    searchTerm={modalConfig.term}
                    type={modalConfig.type}
                    storeId={modalConfig.storeId} // Pass correct store ID
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