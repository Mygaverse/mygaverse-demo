'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { DynamicTable } from "../../tables/DynamicTable";
import { getBudgetingHistoryColumns } from "../columns/budgeting-history-columns";

const getDateLimit = (range: string) => {
    const d = new Date();
    if (range.includes('3')) d.setDate(d.getDate() - 3);
    else d.setDate(d.getDate() - 30);
    return d.toISOString();
};

interface HistoryTabProps { storeIds: string[]; dateRange: string; adType: string; }

export function BudgetingHistoryTab({ storeIds, dateRange }: HistoryTabProps) {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Fixed Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchOption, setSearchOption] = useState("Search by Campaign");

    useEffect(() => {
        const fetchData = async () => {
            if (!user || storeIds.length === 0) return;
            setLoading(true);
            try {
                const startDate = getDateLimit(dateRange);
                const activeStores = storeIds.slice(0, 10);

                // 1. Fetch History Records
                const historyQ = query(
                    collection(db, 'change_history'),
                    where('changeType', '==', 'Budget Update'),
                    where('storeId', 'in', storeIds.slice(0, 10)),
                    where('timestamp', '>=', startDate),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );

                // 2. Fetch Budget Groups (To lookup names for old logs)
                const groupsQ = query(
                    collection(db, 'budget_groups'),
                    where('storeId', 'in', storeIds.slice(0, 10))
                );

                // 3. Fetch Campaigns (For Goal Name Lookup)
                const campaignsQ = query(
                    collection(db, 'campaigns'),
                    where('storeId', 'in', activeStores)
                );

                // Run queries in parallel
                const [historySnap, groupsSnap, campaignsSnap] = await Promise.all([
                    getDocs(historyQ),
                    getDocs(groupsQ),
                    getDocs(campaignsQ)
                ]);

                // A. Build Lookup Map: Campaign ID -> Group Name
                const campaignGroupMap: Record<string, string> = {};
                groupsSnap.forEach(doc => {
                    const g = doc.data();
                    if (g.campaignIds && Array.isArray(g.campaignIds)) {
                        g.campaignIds.forEach((cid: string) => {
                            campaignGroupMap[cid] = g.name;
                        });
                    }
                });

                // B. NEW: Build Lookup Map: Campaign ID -> Goal Name
                const campaignGoalMap: Record<string, string> = {};
                campaignsSnap.forEach(doc => {
                    const c = doc.data();
                    if (c.goalName) {
                        campaignGoalMap[doc.id] = c.goalName;
                    }
                });
                
                // 4. Map History Data
                const mapped = historySnap.docs.map(d => {
                    const r = d.data();
                    const dateObj = new Date(r.timestamp);

                    // If 'groupName' is missing in history, look it up in our map
                    // r.entityId represents the Campaign ID for budget updates
                    const resolvedGroupName = (r.groupName && r.groupName !== '-') 
                        ? r.groupName 
                        : (campaignGroupMap[r.entityId] || '-');

                    // Resolve Goal Name (History Snapshot -> Current Campaign Goal)
                    const resolvedGoalName = (r.goalName && r.goalName !== '-')
                        ? r.goalName
                        : (campaignGoalMap[r.entityId] || '-');

                    return {
                        id: d.id,
                        dateTime: dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),

                        // Use the resolved name
                        budgetingGroupName: resolvedGroupName,
                        
                        goalName: resolvedGoalName, 
                        goalType: 'Advanced',
                        campaignName: r.entityName,
                        storeFlag: 'us', storeName: 'Store', adType: r.adType || 'SP',
                        ruleName: 'Auto-budgeting',
                        budgetFrom: r.oldValue !== undefined ? `$${Number(r.oldValue).toFixed(2)}` : '-',
                        budgetTo: r.newValue !== undefined ? `$${Number(r.newValue).toFixed(2)}` : '-'
                    };
                });

                setData(mapped);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [user, storeIds, dateRange]);

    const columns = getBudgetingHistoryColumns();

    // Client-side search filtering
    const filteredData = data.filter(item => 
        item.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center gap-3 h-[48px]">
                <div className="flex-1 h-full z-[90] relative">
                    {/* Fixed Props */}
                    <SearchInputGroup 
                        options={['Search by Campaign']} 
                        selectedOption={searchOption}
                        onOptionChange={setSearchOption}
                        searchTerm={searchTerm} 
                        onSearchChange={setSearchTerm} 
                        placeholder="Search..." 
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-md shadow-sm border border-[#e2e2e2]">
                {/* Conditional Loading */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading history...</div>
                ) : (
                    <DynamicTable data={filteredData} columns={columns} emptyVariant="no-results" />
                )}
            </div>
        </div>
    );
}