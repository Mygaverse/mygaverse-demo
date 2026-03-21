'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Funnel, LayoutThreeColumns, Download, BarChart, PlusCircleFill } from "react-bootstrap-icons";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

// UI Components
import { Button } from "../../ui/Button";
import { DynamicTable, ColumnDef } from "../../tables/DynamicTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { FilterBar } from "../../ui/FilterBar";
import { AdvancedFilterPanel } from "../modals/AdvancedFilterPanel";
import { Portal } from "../../ui/Portal";

import { MultipleSelector } from "../../ui/MultipleSelector";
import { CAMPAIGNS_OPTIONS } from "../data/ad-status-constants";

import { AddProductAdsModal } from '@/components/bqool/ad-manager/modals/AddProductAdsModal';

// Import Columns
import { getSPProductAdsColumns } from "../columns/sp/sp-productads-columns";
import { getSBProductAdsColumns } from "../columns/sb/sb-productads-columns";
import { getSDProductAdsColumns } from "../columns/sd/sd-productads-columns";

interface UnifiedProductAdsTabProps {
    adType: string;
    storeIds: string[]; // NEW
    dateRange: string;  // NEW
}

const normalizeAdType = (input: string): 'SP' | 'SB' | 'SD' => {
    const lower = input.toLowerCase().replace(/\s+/g, '');
    if (lower.includes('brand') || lower === 'sb') return 'SB';
    if (lower.includes('display') || lower === 'sd') return 'SD';
    return 'SP'; 
};

// --- HELPER: Scale Metrics for Demo Date Range ---
const applyDateRangeFactor = (data: any[], range: string) => {
    // DB has ~60 days of data. We scale totals to simulate ranges.
    let factor = 1.0; 
    if (range.includes('30')) factor = 0.5;   // ~30/60
    else if (range.includes('14')) factor = 0.25; // ~15/60
    else if (range.includes('7')) factor = 0.12;  // ~7/60

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

export function UnifiedProductAdsTab({ adType, storeIds, dateRange }: UnifiedProductAdsTabProps) {
    const { user } = useAuth();
    const dbType = useMemo(() => normalizeAdType(adType), [adType]);

    // State
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("Search by Product Ads ASIN");
    const [statusIds, setStatusIds] = useState<string[]>(['All']);

    // --- FILTER STATE ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [activeFilters, setActiveFilters] = useState<any[]>([]);

    // --- MODAL STATE ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Sorting state
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
                const q = query(
                    collection(db, 'product_ads'),
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
                console.error("Error loading product ads:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, dbType, storeIds, dateRange]);

    // --- 2. SINGLE ROW ACTIONS ---
    const handleToggleStatus = useCallback(async (id: string, current: boolean) => {
        setTableData(prev => prev.map(row => row.id === id ? { ...row, enabled: !current } : row));
        try {
            await updateDoc(doc(db, 'product_ads', id), { enabled: !current });
        } catch (e) { console.error(e); }
    }, []);

    // --- 3. BULK ACTIONS ---
    const handleBulkAction = useCallback(async (action: string, ids: string[], value?: any) => {
        console.log(`Bulk Action: ${action}`, ids, value);

        // Optimistic
        setTableData(prev => prev.map(row => {
            if (!ids.includes(row.id)) return row;
            if (action === 'enable') return { ...row, enabled: true, status: 'Active' };
            if (action === 'pause') return { ...row, enabled: false, status: 'Paused' };
            if (action === 'archive') return { ...row, enabled: false, status: 'Archived' };
            return row;
        }));

        // DB
        try {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const docRef = doc(db, 'product_ads', id);
                if (action === 'enable') batch.update(docRef, { enabled: true, status: 'Active' });
                else if (action === 'pause') batch.update(docRef, { enabled: false, status: 'Paused' });
                else if (action === 'archive') batch.update(docRef, { enabled: false, status: 'Archived' });
            });
            await batch.commit();
        } catch (error) { console.error("Bulk update failed:", error); }
    }, []);

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

    // Sorting handler
    const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
        setSortConfig({ key, direction });
    };

    // --- HANDLER: Add Product Ads ---
    const handleAddProductAds = async (selectedProducts: any[]) => {
        // Logic: Add new documents to 'product_ads' collection
        // The modal returns 'products', but ideally should return mapped { adGroupId, product } pairs 
        
        try {
            const batch = writeBatch(db);
            
            selectedProducts.forEach(prod => {
                // The logic here to decide which Ad Group ID to use.
                // The Modal state 'selectedAdGroupIds' has them.
                // A robust implementation would pass back an array of { adGroupId, product } objects.
                
                // Simplified creation:
                const newDocRef = doc(collection(db, 'product_ads'));
                batch.set(newDocRef, {
                    ...prod,
                    id: newDocRef.id,
                    status: 'Enabled',
                    enabled: true,
                    // adGroupId: ??? (Need to retrieve from modal context)
                    createdAt: new Date().toISOString()
                });
            });
            
            await batch.commit();
            console.log("Added products successfully");
            setIsAddModalOpen(false);
            
        } catch (e) {
            console.error("Error adding products:", e);
        }
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
        if (dbType === "SB") return getSBProductAdsColumns(handleToggleStatus, handleBulkAction, sortConfig, handleSort);
        if (dbType === "SD") return getSDProductAdsColumns(handleToggleStatus, handleBulkAction, sortConfig, handleSort);
        return getSPProductAdsColumns(handleToggleStatus, handleBulkAction, sortConfig, handleSort);
    }, [dbType, handleToggleStatus, handleBulkAction, sortConfig]);

    // --- Map Display Field to Data Key ---
    const mapFieldToData = (row: any, field: string) => {
        switch(field) {
            case 'Campaign Name': return row.name;
            case 'Campaign Type': return row.type;
            case 'Status': return row.enabled ? 'Enabled' : 'Paused';
            case 'Portfolio': return row.portfolio;
            case 'Goal': return row.goalName;
            case 'Daily Budget': return row.budget;
            case 'Ad Sales': return row.sales;
            case 'Ad Spend': return row.spend;
            case 'ACOS': return row.acos;
            case 'ROAS': return row.roas;
            case 'Ad Orders': return row.orders;
            case 'Ad Units Sold': return row.units;
            case 'Impressions': return row.impressions;
            case 'Clicks': return row.clicks;
            case 'CTR': return row.ctr;
            case 'CPC': return row.cpc;
            default: return '';
        }
    };
    
    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        let data = tableData;

        // 1. Search
        if (searchTerm) {
            data = data.filter(r => r.name?.toLowerCase().includes(searchTerm.toLowerCase()));
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

        // Apply Sorting
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
        const endIndex = startIndex + pageSize;
        return filteredData.slice(startIndex, endIndex);
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
                            options={['Search by Product Ads ASIN','Search by Product Ads SKU','Search by Product Title','Search by Ad Groups','Search by Campaigns']} selectedOption={searchType} onOptionChange={setSearchType}
                            searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search Goal Name..." 
                        />
                    </div>
                    <div className="w-[280px]">
                        <MultipleSelector 
                            label="Product Status" options={CAMPAIGNS_OPTIONS}
                            selectedIds={statusIds} onChange={setStatusIds} width="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="primary" 
                            size="lg" 
                            icon={<PlusCircleFill size={16} />}
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            Add Product Ads
                        </Button>
                        
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
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading Product Ads...</div>
                ) : filteredData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">No product ads found.</div>
                ) : (
                    <DynamicTable 
                        data={paginatedData} columns={columns} className="flex-1" summaryData={summaryData}
                    />
                )}
            </div>
            <div className="sticky bottom-0 border-t border-[#e2e2e2] z-[400] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
                <Pagination 
                    currentPage={page} totalItems={tableData.length} pageSize={pageSize}
                    onPageChange={setPage} onPageSizeChange={setPageSize}
                />
            </div>

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

            {/* RENDER MODAL */}
            {isAddModalOpen && (
                <AddProductAdsModal 
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddProductAds}
                    storeId={storeIds[0]} // Pass current store context
                />
            )}
            
        </div>
    );
}