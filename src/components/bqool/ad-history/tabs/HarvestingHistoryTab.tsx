'use client';

import React, { useState, useEffect } from 'react';
import { Funnel } from "react-bootstrap-icons";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { Button } from "../../ui/Button";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { DynamicTable } from "../../tables/DynamicTable";
import { getHarvestingHistoryColumns } from "../columns/harvesting-history-columns";

const getDateLimit = (range: string) => {
    const d = new Date();
    if (range.includes('3')) d.setDate(d.getDate() - 3);
    else if (range.includes('7')) d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 30);
    return d.toISOString();
};

interface HistoryTabProps { storeIds: string[]; dateRange: string; adType: string; }

export function HarvestingHistoryTab({ storeIds, dateRange }: HistoryTabProps) {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Fixed Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchOption, setSearchOption] = useState("Search by Search Term");

    useEffect(() => {
        const fetchData = async () => {
            if (!user || storeIds.length === 0) return;
            setLoading(true);
            try {
                const startDate = getDateLimit(dateRange);
                const q = query(
                    collection(db, 'change_history'),
                    where('changeType', 'in', ['Term Harvest', 'Auto-harvesting Update']),
                    where('storeId', 'in', storeIds.slice(0, 10)),
                    where('timestamp', '>=', startDate),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );

                const snap = await getDocs(q);
                
                const mapped = snap.docs.map(d => {
                    const r = d.data();
                    const dateObj = new Date(r.timestamp);
                    return {
                        id: d.id,
                        dateTime: dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                        goalName: r.goalName || 'Auto',
                        goalType: 'Harvesting',
                        campaignName: r.campaignName || '-',
                        adGroupName: r.adGroupName || r.entityName,
                        storeFlag: 'us', storeName: 'Store', adType: r.adType || 'SP',
                        ruleName: r.changeType === 'Auto-harvesting Update' ? (r.newValue ? 'Auto-Harvest ON' : 'Auto-Harvest OFF') : 'Manual Add',
                        targetingAdded: r.changeType === 'Term Harvest' ? r.entityName : '-',
                        targetingType: r.changeType === 'Term Harvest' ? r.newValue : 'Setting Change',
                    };
                });
                setData(mapped);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [user, storeIds, dateRange]);

    const columns = getHarvestingHistoryColumns();

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center gap-3 h-[48px]">
                <div className="flex-1 h-full z-[90] relative">
                    {/* Fixed Props */}
                    <SearchInputGroup 
                        options={['Search by Search Term']} 
                        selectedOption={searchOption}
                        onOptionChange={setSearchOption}
                        searchTerm={searchTerm} 
                        onSearchChange={setSearchTerm} 
                        placeholder="Search..." 
                    />
                </div>
                <Button variant="secondary" size="lg" icon={<Funnel size={16} />}>Filters</Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-md shadow-sm border border-[#e2e2e2]">
                {/* Fixed Conditional Loading */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading history...</div>
                ) : (
                    <DynamicTable data={data} columns={columns} emptyVariant="no-results" />
                )}
            </div>
        </div>
    );
}