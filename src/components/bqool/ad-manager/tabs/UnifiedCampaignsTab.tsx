'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Funnel, LayoutThreeColumns, Download, BarChart, Search } from "react-bootstrap-icons";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { UnifiedCampaign } from '../data/unifiedAdManagerData';

// UI Components
import { Button } from "../../ui/Button";
import { DynamicTable, ColumnDef } from "../../tables/DynamicTable";
import { Pagination } from "../../ui/Pagination";
import { FilterBar } from "../../ui/FilterBar";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { Portal } from "@/components/bqool/ui/Portal";
import { AdvancedFilterPanel } from "../modals/AdvancedFilterPanel";
import { CAMPAIGNS_OPTIONS } from "../data/ad-status-constants";
import { CampaignEditModal } from '../modals/CampaignEditModal';

// Import Column Definitions
import { getSPCampaignColumns } from "../columns/sp/sp-campaigns-columns";
import { getSBCampaignColumns } from "../columns/sb/sb-campaigns-columns";
import { getSDCampaignColumns } from "../columns/sd/sd-campaigns-columns";

interface UnifiedCampaignsTabProps {
    adType: string; // Accepts "SP", "Sponsored Products", "sb", etc.
    storeIds: string[];
    dateRange: string;
}

// Helper to normalize any input string to "SP", "SB", or "SD"
const normalizeAdType = (input: string): 'SP' | 'SB' | 'SD' => {
    const lower = input.toLowerCase().replace(/\s+/g, ''); // "Sponsored Products" -> "sponsoredproducts"
    if (lower.includes('brand') || lower === 'sb') return 'SB';
    if (lower.includes('display') || lower === 'sd') return 'SD';
    return 'SP'; // Default to SP
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

export function UnifiedCampaignsTab({ adType, storeIds, dateRange }: UnifiedCampaignsTabProps) {
    const { user } = useAuth();
    
    // Normalize the prop immediately
    const dbType = useMemo(() => normalizeAdType(adType), [adType]);

    // State
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5); // Default 10 rows
    const [searchTerm, setSearchTerm] = useState("");
    const [statusIds, setStatusIds] = useState<string[]>(['All']);

    // --- FILTER STATE ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [activeFilters, setActiveFilters] = useState<any[]>([]); // Stores the filters from panel

    // Editing State
    const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: '',
        direction: null
    });

    // --- 1. FETCH DATA (Multi-Store Support) ---
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            // If no stores selected, show empty
            if (!storeIds || storeIds.length === 0) {
                setTableData([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setTableData([]);

            try {
                // Fetch data for ALL selected stores
                // Firestore 'in' query supports max 10 values. 
                // For demo >10 stores, we'd need multiple queries or client-side filtering.
                // We assume <= 10 for now.
                const q = query(
                    collection(db, 'campaigns'),
                    where('storeId', 'in', storeIds.slice(0, 10)), 
                    where('type', '==', dbType)
                );

                const snapshot = await getDocs(q);
                const rawData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Apply Date Range Scaling immediately upon load (for demo)
                const processedData = applyDateRangeFactor(rawData, dateRange);
                setTableData(processedData);

            } catch (error) {
                console.error("Error loading campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, dbType, storeIds, dateRange]); // Re-run when storeIds or dateRange changes


    // --- 2. ACTIONS (Write to Firestore) ---
    // eEditing campaign modal handler
    const handleEditCampaign = (campaign: any) => {
        setEditingCampaign(campaign);
    };

    const handleSaveCampaign = async (id: string, updates: Partial<UnifiedCampaign>) => {
        // 1. Optimistic UI Update (Update local table immediately)
        setTableData(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        try {
            const batch = writeBatch(db);

            // 2. Update the Campaign Document itself
            const campaignRef = doc(db, 'campaigns', id);
            batch.update(campaignRef, updates);

            // 3. PROPAGATE CAMPAIGN NAME CHANGE
            // If the name was updated, we must update all related Ad Groups, Ads, and Targets
            if (updates.name) {
                const newName = updates.name;

                // A. Update Ad Groups
                const adGroupsQ = query(collection(db, 'ad_groups'), where('campaignId', '==', id));
                const adGroupsSnap = await getDocs(adGroupsQ);
                adGroupsSnap.forEach(doc => {
                    batch.update(doc.ref, { campaignName: newName });
                });

                // B. Update Product Ads
                const productAdsQ = query(collection(db, 'product_ads'), where('campaignId', '==', id));
                const productAdsSnap = await getDocs(productAdsQ);
                productAdsSnap.forEach(doc => {
                    batch.update(doc.ref, { campaignName: newName });
                });

                // C. Update Targeting (Keywords/Targets)
                const targetingQ = query(collection(db, 'targeting'), where('campaignId', '==', id));
                const targetingSnap = await getDocs(targetingQ);
                targetingSnap.forEach(doc => {
                    batch.update(doc.ref, { campaignName: newName });
                });
                
                // D. Update Search Terms (Optional, if you link them by ID)
                const searchTermsQ = query(collection(db, 'search_terms'), where('campaignId', '==', id));
                const searchTermsSnap = await getDocs(searchTermsQ);
                searchTermsSnap.forEach(doc => {
                    batch.update(doc.ref, { campaignName: newName });
                });
            }

            // 4. Commit all updates atomically
            await batch.commit();
            console.log('Campaign and related entities updated successfully.');

        } catch (error) {
            console.error("Error saving campaign:", error);
            // Optional: Revert optimistic update here
        }
    };

    // --- AI & HARVESTING ---
    const handleUpdateAI = useCallback(async (id: string, field: string, value: any) => {
        // 1. Optimistic Update
        setTableData(prev => prev.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));

        // 2. DB Update
        try {
            await updateDoc(doc(db, 'campaigns', id), { [field]: value });
        } catch (e) {
            console.error(`Failed to update ${field}`, e);
        }
    }, []);

    const handleToggleStatus = useCallback(async (id: string, current: boolean) => {
        setTableData(prev => prev.map(row => row.id === id ? { ...row, enabled: !current } : row));
        try {
            await updateDoc(doc(db, 'campaigns', id), { enabled: !current });
        } catch (e) { console.error(e); }
    }, []);

    // Update the budget value and log the history
    const handleBudgetChange = useCallback(async (id: string, newVal: number) => {
        // 1. Find the current campaign to get the OLD budget value
        const campaign = tableData.find(c => c.id === id);
        const oldVal = campaign?.budget;

        // If value hasn't changed or campaign not found, do nothing
        if (!campaign || oldVal === newVal) return;
        
        // 2. Optimistic Update
        setTableData(prev => prev.map(row => row.id === id ? { ...row, budget: newVal } : row));

        try {
            const batch = writeBatch(db);

            // 3. Operation A: Update the Campaign's actual budget
            const campaignRef = doc(db, 'campaigns', id);
            batch.update(campaignRef, { 
                budget: newVal,
                lastUpdated: new Date().toISOString() // Optional: track last edit time on parent
            });

            // 4. Operation B: Create a History Record
            // We use a root collection 'change_history' for easier global querying later
            const historyRef = doc(collection(db, 'change_history'));
            const historyData = {
                entityId: id,                // The ID of the campaign
                entityName: campaign.name,   // Snapshot of name for easier display
                entityType: 'Campaign',      // Type of entity changed
                storeId: campaign.storeId,   // Store context
                userId: user?.uid,           // Who made the change
                
                changeType: 'Budget Update', // Category of change
                fieldName: 'dailyBudget',    // Specific field
                oldValue: oldVal,            // FROM
                newValue: newVal,            // TO
                
                timestamp: new Date().toISOString() // WHEN
            };
            batch.set(historyRef, historyData);

            // 5. Commit both operations atomically
            await batch.commit();
            
            console.log("Budget change history saved.");

            //await updateDoc(doc(db, 'campaigns', id), { budget: newVal });
        } catch (e) { 
            console.error("Error updating AI settings:", e);
        }
    }, [tableData, user]); // Dependency on tableData is crucial to access 'oldVal'

    // --- BULK ACTION HANDLER (Robust for SP/SB/SD) ---
    const handleBulkAction = useCallback(async (action: string, ids: string[], value?: any) => {
        console.log(`Bulk Action: ${action}`, ids, value);

        // 1. Optimistic UI Update
        setTableData(prev => prev.map(row => {
            if (!ids.includes(row.id)) return row;

            if (action === 'enable') return { ...row, enabled: true, status: 'Active' };
            if (action === 'pause') return { ...row, enabled: false, status: 'Paused' };
            if (action === 'archive') return { ...row, enabled: false, status: 'Archived' };
            
            if (action === 'budget') {
                // Handle simple number (SP) or object (SB potentially)
                const val = typeof value === 'object' ? value.value : value;
                return { ...row, budget: val };
            }
            return row;
        }));

        // 2. DB Update with History Logging
        try {
            const batch = writeBatch(db);
            
            // Handle Budget Changes with History
            if (action === 'budget') {
                const newBudget = typeof value === 'object' ? value.value : Number(value);
                
                ids.forEach(id => {
                    const row = tableData.find(r => r.id === id);
                    const docRef = doc(db, 'campaigns', id);
                    
                    // A. Update Campaign
                    batch.update(docRef, { 
                        budget: newBudget,
                        lastUpdated: new Date().toISOString()
                    });

                    // B. Log History (Same logic as Ad Groups/Single Edit)
                    if (row) {
                        const historyRef = doc(collection(db, 'change_history'));
                        batch.set(historyRef, {
                            entityId: id,
                            entityName: row.name,
                            entityType: 'Campaign',
                            storeId: row.storeId,
                            userId: user?.uid,
                            
                            changeType: 'Budget Update',
                            fieldName: 'dailyBudget',
                            oldValue: row.budget,
                            newValue: newBudget,
                            
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            } 
            // Handle Status Changes (Simple Batch)
            else {
                ids.forEach(id => {
                    const docRef = doc(db, 'campaigns', id);
                    if (action === 'enable') batch.update(docRef, { enabled: true, status: 'Active' });
                    else if (action === 'pause') batch.update(docRef, { enabled: false, status: 'Paused' });
                    else if (action === 'archive') batch.update(docRef, { enabled: false, status: 'Archived' });
                });
            }

            await batch.commit();
            console.log("Bulk action completed successfully.");

        } catch (error) { 
            console.error("Bulk update failed:", error); 
            // Optional: Revert setTableData on error
        }
    }, [tableData, user]);

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

    // --- 3. DYNAMIC SUMMARY ---
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
            cvr: `${avgCvr.toFixed(2)}%`,
            clicks: totalClicks.toLocaleString(),
            impressions: totalImpressions.toLocaleString(),
            cpc: `$${avgCpc.toFixed(2)}`,
            ctr: `${avgCtr.toFixed(2)}%`,
            
        };
    }, [tableData]);

    // --- 4. COLUMNS ---
    const columns = useMemo(() => {
        if (adType === "Sponsored Products") {
            return getSPCampaignColumns(
                handleToggleStatus, 
                handleBudgetChange, 
                handleUpdateAI, 
                handleBulkAction, 
                handleEditCampaign, 
                sortConfig,
                handleSort
            );
        } 
        else if (adType === "Sponsored Brands") {
            return getSBCampaignColumns(
                handleToggleStatus, 
                handleBudgetChange, 
                handleUpdateAI, 
                handleBulkAction, 
                handleEditCampaign,
                sortConfig, 
                handleSort
            );
        } 
        else {
            return getSDCampaignColumns(
                handleToggleStatus, 
                handleBudgetChange, 
                handleUpdateAI, 
                handleBulkAction, 
                handleEditCampaign,
                sortConfig, 
                handleSort
            );
        }
    }, [
        adType, 
        handleToggleStatus, 
        handleBudgetChange, 
        handleUpdateAI, 
        handleBulkAction, 
        handleEditCampaign,
        sortConfig
    ]);

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
        let data = [...tableData];

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

                    const rowValue = mapFieldToData(row, filter.field);
                    const filterValue = filter.value;
                    const op = filter.operator;

                    // Handle Numeric Comparisons
                    if (['Daily Budget', 'Ad Sales', 'Ad Spend', 'ACOS', 'ROAS', 'Ad Orders', 'Ad Units Sold', 'Impressions', 'Clicks', 'CTR', 'CPC'].includes(filter.field)) {
                        const numRow = Number(rowValue);
                        const numFilter = Number(filterValue);
                        
                        if (isNaN(numRow) || isNaN(numFilter)) return false;

                        if (op === 'greater than') return numRow > numFilter;
                        if (op === 'less than') return numRow < numFilter;
                        if (op === 'equals') return numRow === numFilter;
                        if (op === 'greater than or equal to') return numRow >= numFilter;
                        if (op === 'less than or equal to') return numRow <= numFilter;
                    } 
                    
                    // Handle String Comparisons
                    else {
                        const strRow = String(rowValue).toLowerCase();
                        const strFilter = String(filterValue).toLowerCase();

                        if (op === 'equals') return strRow === strFilter;
                        if (op === 'contains') return strRow.includes(strFilter);
                    }
                    
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
            {/* Header Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 h-[48px] z-60 relative">
                    <div className="flex-1 flex items-center h-full">
                        <div className="h-full px-3 flex items-center justify-center bg-white border border-r-0 border-[#e2e2e2] rounded-l-md text-gray-400">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" placeholder="Search by Campaign" 
                            className="h-full flex-1 border border-[#e2e2e2] border-l-0 px-2 text-sm outline-none focus:border-[#4aaada] focus:ring-1 focus:ring-[#4aaada]"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="h-full w-[48px] bg-[#4aaada] rounded-r-md flex items-center justify-center hover:bg-[#3a9aca] text-white">
                            <Search size={18} />
                        </button>
                    </div>
                    <div className="w-[280px]">
                        <MultipleSelector 
                            label="Ad Status" options={CAMPAIGNS_OPTIONS} 
                            selectedIds={statusIds} onChange={setStatusIds} width="w-full"
                        />
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 relative">
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
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading Campaigns...</div>
                ) : filteredData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">No campaigns found for {dbType}.</div>
                ) : (
                    <DynamicTable 
                        data={paginatedData} columns={columns} 
                        className="flex-1" summaryData={summaryData}
                    />
                )}
            </div>
            <div className="sticky bottom-0 border-t border-[#e2e2e2] z-[400] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
                <Pagination 
                    currentPage={page} totalItems={tableData.length} pageSize={pageSize}
                    onPageChange={setPage} onPageSizeChange={setPageSize}
                />
            </div>

            {/* NEW: Edit Modal */}
            {editingCampaign && (
                <CampaignEditModal 
                    isOpen={!!editingCampaign}
                    onClose={() => setEditingCampaign(null)}
                    campaign={editingCampaign}
                    onSave={handleSaveCampaign}
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
                            initialFilters={activeFilters}
                        />
                    </div>
                </Portal>
            )}

        </div>
    );
}