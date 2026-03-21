'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Funnel, LayoutThreeColumns, Download, BarChart } from "react-bootstrap-icons";
import { doc, collection, query, where, getDocs, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { Button } from "../../ui/Button";
import { Pagination } from "../../ui/Pagination";
import { Modal } from "../../ui/Modal";
import { FilterBar } from "../../ui/FilterBar";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { Portal } from "@/components/bqool/ui/Portal";
import { AdvancedFilterPanel } from "../modals/AdvancedFilterPanel";
import { DynamicTable } from "../../tables/DynamicTable";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { getSPGoalsColumns } from "../columns/sp/sp-goals-columns";
import { CAMPAIGNS_OPTIONS } from "../data/ad-status-constants";
import { UnifiedGoal, UnifiedCampaign } from '../data/unifiedAdManagerData';
import { ColumnSorter, SortDirection } from "@/components/bqool/ui/ColumnSorter";

// Reusing Campaign columns for the Modal view
import { getSPCampaignColumns } from "../columns/sp/sp-campaigns-columns";

interface GoalsTabProps {
    adType: string;
    storeIds: string[];
    dateRange: string;
}

export function GoalsTab({ adType, storeIds, dateRange }: GoalsTabProps) {
    const { user } = useAuth();
    const [tableData, setTableData] = useState<UnifiedGoal[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("Search by Goals");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [statusIds, setStatusIds] = useState<string[]>(['All']);

    // --- FILTER STATE ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [activeFilters, setActiveFilters] = useState<any[]>([]); // Stores the filters from panel

    // Modal State
    const [selectedGoal, setSelectedGoal] = useState<UnifiedGoal | null>(null);
    const [goalCampaigns, setGoalCampaigns] = useState<UnifiedCampaign[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Add Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
        key: '', direction: null
    });

    // --- 1. FETCH GOALS ---
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            if (!storeIds || storeIds.length === 0) {
                setTableData([]); setLoading(false); return;
            }

            setLoading(true);
            try {
                // Fetch goals for selected stores
                const q = query(
                    collection(db, 'campaigns'),
                    where('storeId', 'in', storeIds.slice(0, 10))
                );
                const snapshot = await getDocs(q);

                // Scale Metrics based on Date Range
                let factor = 1.0;
                if (dateRange.includes('30')) factor = 0.5;
                else if (dateRange.includes('14')) factor = 0.25;
                else if (dateRange.includes('7')) factor = 0.12;

                // AGGREGATION LOGIC
                const goalMap = new Map<string, UnifiedGoal & { createdAt: string }>();

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const cName = data.goalName;

                    // --- USER ISOLATION ---
                    // Hide goals created by other users (allow System and Own)
                    const owner = data.createdBy;
                    if (owner && owner !== 'system' && owner !== user.uid) {
                        return;
                    }

                    // Filter invalid goals
                    if (!cName || cName === 'New Goal' || cName === '-') return;

                    // Initialize Goal Aggregator
                    if (!goalMap.has(cName)) {
                        goalMap.set(cName, {
                            id: cName, // Virtual ID based on name
                            name: cName,
                            status: 'Active',
                            storeId: data.storeId,
                            campaignCount: 0,
                            targetAcos: 30, // Default or derived
                            goalType: data.goalStatus || 'Basic',

                            // Capture Creation Date (Critical for sorting)
                            createdAt: data.createdAt || new Date().toISOString(),

                            // Metrics initialized to 0
                            sales: 0,
                            spend: 0,
                            orders: 0,
                            clicks: 0,
                            impressions: 0,
                            units: 0,

                            // Ratios (calculated at end)
                            acos: 0, roas: 0, ctr: 0, cvr: 0, cpc: 0,

                            // Unused by this view but required by strict type
                            adCount: 0
                        });
                    }

                    const goal = goalMap.get(cName)!;

                    // Keep the *earliest* creation date if campaigns in the same goal have diff dates
                    // OR keep the *latest* depending on preference. usually they are same batch.
                    // We'll trust the first one we found or update if we find an earlier one.
                    if (data.createdAt && data.createdAt < goal.createdAt) {
                        goal.createdAt = data.createdAt;
                    }

                    // Aggregate Metrics
                    goal.sales += (data.sales || 0) * factor;
                    goal.spend += (data.spend || 0) * factor;
                    goal.orders += Math.round((data.orders || 0) * factor);
                    goal.clicks += Math.round((data.clicks || 0) * factor);
                    goal.impressions += Math.round((data.impressions || 0) * factor);
                    goal.units += Math.round((data.units || 0) * factor);
                    goal.campaignCount += 1;

                    // Status Logic: If any campaign is enabled, goal is Active
                    if (data.enabled) goal.status = 'Active';
                });

                // Finalize Calculations (ACOS/ROAS/CTR/CVR/CPC)
                const aggregatedGoals = Array.from(goalMap.values()).map(g => ({
                    ...g,
                    acos: g.sales > 0 ? (g.spend / g.sales) * 100 : 0,
                    roas: g.spend > 0 ? g.sales / g.spend : 0,
                    ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
                    cvr: g.clicks > 0 ? (g.orders / g.clicks) * 100 : 0,
                    cpc: g.clicks > 0 ? g.spend / g.clicks : 0
                }))
                    // SORT: Descending Order (Newest First)
                    .sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        return dateB - dateA;
                    });

                setTableData(aggregatedGoals);

            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        loadData();
    }, [user, storeIds, dateRange]);

    // --- 2. FETCH CAMPAIGNS FOR MODAL ---
    useEffect(() => {
        const loadGoalCampaigns = async () => {
            if (!selectedGoal) return;
            setModalLoading(true);
            try {
                // Query campaigns where goalName matches
                // Note: In a real app, use goalId for tighter linking
                const q = query(
                    collection(db, 'campaigns'),
                    where('storeId', '==', selectedGoal.storeId), // Restrict to store
                    where('goalName', '==', selectedGoal.name)
                );
                const snap = await getDocs(q);
                setGoalCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedCampaign)));
            } catch (e) { console.error(e); }
            setModalLoading(false);
        };
        loadGoalCampaigns();
    }, [selectedGoal]);

    // --- SORTING HANDLER ---
    const handleSort = (key: string, direction: SortDirection) => {
        setSortConfig({ key, direction });
    };

    // --- VIEW HANDLERS ---
    const handleViewCampaigns = (goal: UnifiedGoal) => {
        // You can set state to open the existing modal, or navigate to a campaigns tab filtered by this goal
        setSelectedGoal(goal);
        // e.g., setModalMode('campaigns');
    };

    const handleViewProductAds = (goal: UnifiedGoal) => {
        // Implement logic to view product ads for this goal
        console.log("View Product Ads for:", goal.name);
        setSelectedGoal(goal);
        // e.g., setModalMode('product-ads');
    };

    // Edit Name: Find all campaigns with old Name and update to New Name
    const handleEditName = async (oldNameId: string, newName: string) => {
        setTableData(prev => prev.map(r => r.id === oldNameId ? { ...r, id: newName, name: newName } : r));
        try {
            const q = query(collection(db, 'campaigns'), where('goalName', '==', oldNameId));
            const snap = await getDocs(q);
            const batch = writeBatch(db); // Error fixed by import
            snap.docs.forEach(d => {
                batch.update(d.ref, { goalName: newName });
            });
            await batch.commit();
        } catch (e) { console.error(e); }
    };

    const handleViewDetails = (goal: UnifiedGoal) => {
        setSelectedGoal(goal);
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

    // --- FILTERED & SORTED DATA ---
    const filteredSortedData = useMemo(() => {
        let data = [...tableData];

        // 1. Filter
        if (searchTerm) {
            data = data.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // 2. Sort
        if (sortConfig.key && sortConfig.direction) {
            data.sort((a: any, b: any) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (valA === undefined) valA = 0; // Handle undefined metrics
                if (valB === undefined) valB = 0;

                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [tableData, searchTerm, sortConfig]);

    // --- RENDER ---
    // Use ONLY sp-goals-columns for the main table
    const columns = useMemo(() => getSPGoalsColumns(
        handleEditName,
        handleViewCampaigns,
        handleViewProductAds,
        sortConfig,
        handleSort
    ), [sortConfig]);

    // Use Campaign columns only for the detailed modal view
    const modalColumns = useMemo(() => getSPCampaignColumns(
        () => { }, () => { }, () => { }, () => { }, () => { },
        { key: '', direction: null }, () => { }
    ).filter(c => c.key !== 'select' && c.key !== 'action'), []);

    const filteredData = useMemo(() => {
        if (!searchTerm) return tableData;
        return tableData.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tableData, searchTerm]);

    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

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
        <div className="flex flex-col h-full gap-4 relative">
            {/* Controls */}
            <div className="flex items-center gap-3 h-[48px]">
                <div className="flex-1 h-full z-[100] relative">
                    <SearchInputGroup
                        options={['Search by Goals', 'Search by Campaign', 'Search by Product Ads ASIN', 'Search by Product Ads SKU']} selectedOption={searchType} onOptionChange={setSearchType}
                        searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Goal"
                    />
                </div>
                <div className="w-[280px]">
                    <MultipleSelector
                        label="Ad Status" options={CAMPAIGNS_OPTIONS}
                        selectedIds={statusIds} onChange={setStatusIds} width="w-full"
                    />
                </div>
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

            <FilterBar filters={[]} onReset={() => { }} />

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-md shadow-sm overflow-hidden border border-[#e2e2e2]">
                {loading ? <div className="flex-1 flex items-center justify-center text-gray-500">Loading Goals...</div> :
                    <DynamicTable data={paginatedData} columns={columns} className="flex-1" />}
                <Pagination currentPage={page} totalItems={filteredData.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </div>

            {/* DETAILS MODAL */}
            {selectedGoal && (
                <Modal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)} title={`Goal: ${selectedGoal.name}`} width="max-w-6xl" headerStyle="branding">
                    <div className="flex flex-col gap-4 p-2">
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                            <div className="text-sm text-gray-600">Total Campaigns: <span className="font-bold text-gray-900">{goalCampaigns.length}</span></div>
                            <div className="text-sm text-gray-600">Target ACOS: <span className="font-bold text-gray-900">{selectedGoal.targetAcos}%</span></div>
                        </div>
                        <div className="min-h-[300px]">
                            {modalLoading ? <div className="text-center py-10 text-gray-500">Loading Campaigns...</div> :
                                goalCampaigns.length === 0 ? <div className="text-center py-10 text-gray-500">No campaigns found for this goal.</div> :
                                    <DynamicTable data={goalCampaigns} columns={modalColumns} />}
                        </div>
                    </div>
                </Modal>
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