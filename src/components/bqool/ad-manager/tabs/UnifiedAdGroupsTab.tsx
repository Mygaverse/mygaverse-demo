'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Funnel, LayoutThreeColumns, Download, BarChart, Search, PlusCircleFill } from "react-bootstrap-icons";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

// UI Components
import { Button } from "../../ui/Button";
import { DynamicTable, ColumnDef } from "../../tables/DynamicTable";
import { Pagination } from "../../ui/Pagination";
import { FilterBar } from "../../ui/FilterBar";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { Portal } from "../../ui/Portal";
import { AdvancedFilterPanel } from "../modals/AdvancedFilterPanel";
import { CAMPAIGNS_OPTIONS } from "../data/ad-status-constants"; 
import { AdGroupEditModal } from '../modals/AdGroupEditModal';

// Import Columns
import { getSPAdGroupColumns } from "../columns/sp/sp-adgroups-columns";
import { getSBAdGroupColumns } from "../columns/sb/sb-adgroups-columns";
import { getSDAdGroupColumns } from "../columns/sd/sd-adgroups-columns";

interface UnifiedAdGroupsTabProps {
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

export function UnifiedAdGroupsTab({ adType, storeIds, dateRange }: UnifiedAdGroupsTabProps) {
    const { user } = useAuth();

    const dbType = useMemo(() => normalizeAdType(adType), [adType]);

    // State
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("Search by Ad Groups");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [statusIds, setStatusIds] = useState<string[]>(['All']);
    
    // --- FILTER STATE ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [activeFilters, setActiveFilters] = useState<any[]>([]); // Stores the filters from panel

    // --- EDIT MODAL STATE ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [adGroupToEdit, setAdGroupToEdit] = useState<any>(null);

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
                // Multi-store query
                const q = query(
                    collection(db, 'ad_groups'),
                    where('storeId', 'in', storeIds.slice(0, 10)), // Limit 10
                    where('type', '==', dbType)
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
                console.error("Error loading ad groups:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, dbType, storeIds, dateRange]); // Re-run when filters change

    // --- 2. SINGLE ROW ACTIONS ---
    const handleToggleStatus = useCallback(async (id: string, current: boolean) => {
        setTableData(prev => prev.map(row => row.id === id ? { ...row, enabled: !current } : row));
        try {
            await updateDoc(doc(db, 'ad_groups', id), { enabled: !current });
        } catch (e) { console.error(e); }
    }, []);

    // Update bid change and history log
    const handleBidChange = useCallback(async (id: string, newVal: number) => {
        // 1. Optimistic Update
        setTableData(prev => prev.map(row => row.id === id ? { ...row, defaultBid: newVal } : row));

        try {
            const batch = writeBatch(db);
            
            // 2. Get Ad Group Context (Needed for History)
            const adGroup = tableData.find(g => g.id === id);
            if (!adGroup) return;

            // 3. Operation A: Update Ad Group "Default Bid" (No History Log here)
            const adGroupRef = doc(db, 'ad_groups', id);
            batch.update(adGroupRef, { 
                defaultBid: newVal,
                lastUpdated: new Date().toISOString()
            });

            // 4. Operation B: Find & Update ALL related Targeting Docs
            // This ensures "Ad Group Default" and "Targeting Bids" stay synced
            const targetsQ = query(collection(db, 'targeting'), where('adGroupId', '==', id));
            const targetsSnap = await getDocs(targetsQ);

            targetsSnap.forEach(targetDoc => {
                const targetData = targetDoc.data();
                const targetRef = doc(db, 'targeting', targetDoc.id);
                const oldTargetBid = targetData.bid;

                // Update the Target's Bid
                batch.update(targetRef, { bid: newVal });

                // B. Resolve Targeting Text Correctly
                // Checks: keywordText (SP Keywords), asin (SP/SD Targets), category (SD), or generic 'text'
                const resolvedTargetText = targetData.keywordText || targetData.asin || targetData.text || targetData.query || targetData.category || 'Unknown Target';
                const resolvedMatchType = targetData.matchType || targetData.targetingType || 'Target';

                // 5. Operation C: Log History for the TARGET (Not the Ad Group)
                // This fulfills "only store the data at Targeting columns"
                const historyRef = doc(collection(db, 'change_history'));
                const historyData = {
                    entityId: targetDoc.id,
                    entityType: 'Targeting', // We log it as a Targeting change
                    
                    // Context
                    goalName: adGroup.goalName || 'Advanced',
                    campaignName: adGroup.campaignName || 'Unknown Campaign',
                    adGroupName: adGroup.name,
                    storeId: adGroup.storeId,
                    userId: user?.uid,

                    // The Targeting Specifics
                     // Correctly resolved name
                    targetingText: resolvedTargetText,
                    targetingType: resolvedMatchType,

                    changeType: 'Bid Update',
                    oldValue: oldTargetBid || adGroup.defaultBid, // Fallback to group bid if target had none
                    newValue: newVal,
                    
                    timestamp: new Date().toISOString()
                };
                
                batch.set(historyRef, historyData);
            });

            // 6. Commit All Updates
            await batch.commit();
            console.log(`Synced bid ${newVal} to ${targetsSnap.size} targets.`);

        } catch (error) {
            console.error("Error syncing bids:", error);
            // Revert UI logic would go here
        }
    }, [tableData, user]);

    // Update the Auto-harvesting and history logs
    const handleUpdateAI = useCallback(async (id: string, field: string, value: any) => {
        // 1. Optimistic Update
        setTableData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));

        try {
            const batch = writeBatch(db);
            const adGroupRef = doc(db, 'ad_groups', id);

            // 2. Operation A: Update the Ad Group document
            batch.update(adGroupRef, { [field]: value });

            // 3. Operation B: Log History if this is an Auto-harvesting change
            if (field === 'autoHarvesting') { // Assuming 'autoHarvesting' is your field key
                const adGroup = tableData.find(g => g.id === id);
                
                const historyRef = doc(collection(db, 'change_history'));
                const historyData = {
                    entityId: id,
                    entityName: adGroup?.name || 'Unknown Ad Group',
                    entityType: 'Ad Group',
                    storeId: adGroup?.storeId,
                    userId: user?.uid,

                    changeType: 'Auto-harvesting Update', // Specific Type
                    fieldName: field,
                    oldValue: !value, // The opposite of the new value
                    newValue: value,  // true/false
                    
                    timestamp: new Date().toISOString()
                };
                batch.set(historyRef, historyData);
            }

            // 4. Commit Batch
            await batch.commit();
            console.log("AI change history saved.");

            //await updateDoc(doc(db, 'ad_groups', id), { [field]: value });
        } catch (e) { 
            console.error("Error updating AI settings:", e);
        }
    }, [tableData, user]); // Dependencies ensure we access fresh state


    // OPEN EDIT MODAL
    const handleEditClick = (adGroup: any) => {
        setAdGroupToEdit(adGroup);
        setIsEditModalOpen(true);
    };

    // SAVE EDITS
    const handleSaveAdGroup = async (id: string, updates: any) => {
        // 1. Optimistic Update (Update local table immediately)
        setTableData(prev => prev.map(row => row.id === id ? { ...row, ...updates } : row));
        
        try {
            const batch = writeBatch(db);

            // 2. Update the Ad Group Document itself
            const adGroupRef = doc(db, 'ad_groups', id);
            batch.update(adGroupRef, updates);

            // 3. PROPAGATE AD GROUP NAME CHANGE
            // If the name was updated, we must find and update all related documents
            if (updates.name) {
                const newName = updates.name;

                // A. Update related Product Ads
                // These docs usually have 'adGroupId' and store 'adGroupName' for display
                const productAdsQ = query(collection(db, 'product_ads'), where('adGroupId', '==', id));
                const productAdsSnap = await getDocs(productAdsQ);
                productAdsSnap.forEach(doc => {
                    batch.update(doc.ref, { adGroupName: newName });
                });

                // B. Update related Targeting (Keywords/Targets)
                const targetingQ = query(collection(db, 'targeting'), where('adGroupId', '==', id));
                const targetingSnap = await getDocs(targetingQ);
                targetingSnap.forEach(doc => {
                    batch.update(doc.ref, { adGroupName: newName });
                });

                // C. Update related Search Terms
                const searchTermsQ = query(collection(db, 'search_terms'), where('adGroupId', '==', id));
                const searchTermsSnap = await getDocs(searchTermsQ);
                searchTermsSnap.forEach(doc => {
                    batch.update(doc.ref, { adGroupName: newName });
                });
            }

            // 4. Commit all updates atomically
            await batch.commit();
            console.log("Ad Group and all related entities updated successfully.");

        } catch (error) {
            console.error("Error saving ad group:", error);
            // Optional: Revert optimistic update here if needed
        }
    };

    // --- 3. BULK ACTIONS ---
    const handleBulkAction = useCallback(async (action: string, ids: string[], value?: any) => {
        console.log(`Bulk Action: ${action}`, ids, value);

        // --- 1. Optimistic UI Update ---
        // We update the local state immediately so the UI feels responsive
        setTableData(prev => prev.map(row => {
            if (!ids.includes(row.id)) return row;

            switch (action) {
                // Status
                case 'enable': return { ...row, enabled: true, status: 'Enabled' };
                case 'pause': return { ...row, enabled: false, status: 'Paused' };
                case 'archive': return { ...row, enabled: false, status: 'Archived' };
                
                // AI Bidding
                case 'ai-enable': return { ...row, aiBiddingEnabled: true };
                case 'ai-pause': return { ...row, aiBiddingEnabled: false };
                
                // Target ACOS
                case 'set-target-acos': 
                    return { 
                        ...row, 
                        aiBiddingEnabled: true, // Force enable if setting ACOS
                        aiBiddingStrategy: value.strategy, 
                        targetAcos: value.targetAcos 
                    };

                // Auto-Harvesting
                case 'harvest-enable': return { ...row, autoHarvestingEnabled: true };
                case 'harvest-pause': return { ...row, autoHarvestingEnabled: false };

                // Default Bid
                case 'default-bid': return { ...row, defaultBid: Number(value) };

                default: return row;
            }
        }));

        // --- 2. Firestore Batch Update ---
        try {
            const batch = writeBatch(db);

            // CASE A: Default Bids (Complex - Must sync to Targets)
            if (action === 'default-bid') {
                const newBid = Number(value);
                
                // For each selected Ad Group...
                for (const id of ids) {
                    const row = tableData.find(r => r.id === id);
                    const adGroupRef = doc(db, 'ad_groups', id);
                    
                    // 1. Update Ad Group
                    batch.update(adGroupRef, { defaultBid: newBid });

                    // 2. Fetch & Update All Targets (Master Switch Logic)
                    // We must wait for this query to ensure targets are synced
                    const targetsQ = query(collection(db, 'targeting'), where('adGroupId', '==', id));
                    const targetsSnap = await getDocs(targetsQ);

                    targetsSnap.forEach(targetDoc => {
                        const tData = targetDoc.data();
                        
                        // Update Target Bid
                        batch.update(targetDoc.ref, { bid: newBid });

                        // Log History for Target
                        const historyRef = doc(collection(db, 'change_history'));
                        batch.set(historyRef, {
                            entityId: targetDoc.id,
                            entityType: 'Targeting',
                            changeType: 'Bid Update',
                            
                            targetingText: tData.keywordText || tData.asin || 'Target',
                            campaignName: row?.campaignName || 'Unknown',
                            adGroupName: row?.name,
                            storeId: row?.storeId,
                            userId: user?.uid,

                            oldValue: tData.bid,
                            newValue: newBid,
                            timestamp: new Date().toISOString()
                        });
                    });
                }
            }

            // CASE B: All Other Actions (Simple Field Updates)
            else {
                ids.forEach(id => {
                    const docRef = doc(db, 'ad_groups', id);
                    const row = tableData.find(r => r.id === id);

                    if (action === 'enable') batch.update(docRef, { enabled: true, status: 'Enabled' });
                    else if (action === 'pause') batch.update(docRef, { enabled: false, status: 'Paused' });
                    else if (action === 'archive') batch.update(docRef, { enabled: false, status: 'Archived' });
                    
                    else if (action === 'ai-enable') batch.update(docRef, { aiBiddingEnabled: true });
                    else if (action === 'ai-pause') batch.update(docRef, { aiBiddingEnabled: false });
                    
                    else if (action === 'harvest-enable') {
                        batch.update(docRef, { autoHarvestingEnabled: true });
                        // Optional: Log Auto-Harvest ON history here
                    }
                    else if (action === 'harvest-pause') {
                        batch.update(docRef, { autoHarvestingEnabled: false });
                    }
                    
                    else if (action === 'set-target-acos') {
                        batch.update(docRef, { 
                            aiBiddingEnabled: true,
                            aiBiddingStrategy: value.strategy, 
                            targetAcos: value.targetAcos 
                        });
                    }
                });
            }

            await batch.commit();
            console.log("Bulk update successful");

        } catch (error) { 
            console.error("Bulk update failed:", error); 
            // Revert UI if needed
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

    // --- 5. COLUMNS ---
    const columns = useMemo(() => {
        if (dbType === "SB") {
            return getSBAdGroupColumns(handleToggleStatus, handleBidChange, handleUpdateAI, handleBulkAction, handleEditClick, sortConfig, handleSort);
        } else if (dbType === "SD") {
            return getSDAdGroupColumns(handleToggleStatus, handleBidChange, handleUpdateAI, handleBulkAction, handleEditClick, sortConfig, handleSort);
        } else {
            return getSPAdGroupColumns(handleToggleStatus, handleBidChange, handleUpdateAI, handleBulkAction, handleEditClick, sortConfig, handleSort);
        }
    }, [dbType, handleToggleStatus, handleBidChange, handleUpdateAI, handleBulkAction, sortConfig]);

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
            <div className="flex flex-col gap-4">
                {/* Header Controls */}
                <div className="flex items-center gap-3 h-[48px] z-60 relative">
                    <div className="flex-1 h-full z-[100] relative">
                        <SearchInputGroup 
                            options={['Search by Ad Groups','Search by Campaigns']} selectedOption={searchType} onOptionChange={setSearchType}
                            searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Ad Group" 
                        />
                    </div>
                    <div className="w-[280px]">
                        <MultipleSelector 
                            label="Ad Group Status" options={CAMPAIGNS_OPTIONS}
                            selectedIds={statusIds} onChange={setStatusIds} width="w-full"
                        />
                    </div>
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
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading Ad Groups...</div>
                ) : filteredData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">No ad groups found.</div>
                ) : (
                    <DynamicTable 
                        data={paginatedData} 
                        columns={columns} 
                        className="flex-1" 
                        summaryData={summaryData}
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
                            initialFilters={activeFilters}
                        />
                    </div>
                </Portal>
            )}

            {/* EDIT MODAL */}
            <AdGroupEditModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                adGroup={adGroupToEdit}
                onSave={handleSaveAdGroup}
            />

        </div>
    );
}