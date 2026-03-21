'use client';

import React, { useState, useEffect } from 'react';
import { Funnel } from "react-bootstrap-icons";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { Button } from "../../ui/Button";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { SimplePopover } from '@/components/bqool/ui/SimplePopover';
import { AdvancedFilterPanel } from '@/components/bqool/ad-manager/modals/AdvancedFilterPanel';
import { DynamicTable } from "../../tables/DynamicTable";
import { Pagination } from "../../ui/Pagination";
import { getBiddingHistoryColumns } from "../columns/bidding-history-columns";

const getDateLimit = (range: string) => {
    const d = new Date();
    if (range.includes('3')) d.setDate(d.getDate() - 3);
    else if (range.includes('7')) d.setDate(d.getDate() - 7);
    else if (range.includes('14')) d.setDate(d.getDate() - 14);
    else d.setDate(d.getDate() - 30);
    return d.toISOString();
};

interface HistoryTabProps {
    storeIds: string[];
    dateRange: string;
    adType: string;
}

export function BiddingHistoryTab({ storeIds, dateRange, adType }: HistoryTabProps) {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Fixed: Added state for Search Option
    const [searchTerm, setSearchTerm] = useState("");
    const [searchOption, setSearchOption] = useState("Search by Campaign");
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || storeIds.length === 0) return;
            setLoading(true);
            try {
                const startDate = getDateLimit(dateRange);
                const q = query(
                    collection(db, 'change_history'),
                    where('changeType', '==', 'Bid Update'),
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
                        dateTime: dateObj.toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric', 
                            hour: 'numeric', minute: '2-digit' 
                        }),

                        // Context Fields
                        goalName: r.goalName || '-', 
                        goalType: 'Advanced', 
                        campaignName: r.campaignName || '-',
                        adGroupName: r.adGroupName || '-', 

                        storeFlag: 'us', 
                        storeName: 'Store',
                        adType: r.adType || 'SP', 

                        // Targeting Info (Directly from log)
                        targeting: r.targetingText || '-', 
                        targetingType: r.targetingType || 'Keyword',

                        ruleName: 'AI-Bidding', 
                        bidFrom: r.oldValue !== undefined ? `$${Number(r.oldValue).toFixed(2)}` : '-',
                        bidTo: r.newValue !== undefined ? `$${Number(r.newValue).toFixed(2)}` : '-'
                    };
                });
                setData(mapped);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [user, storeIds, dateRange]);

    const columns = getBiddingHistoryColumns();

    return (
        <div className="flex flex-col h-full gap-4 overflow-visible">
            <div className="flex items-center gap-3 h-[48px] shrink-0">
                <div className="flex-1 h-full z-[90] relative">
                    {/* Fixed: Passed required props selectedOption and onOptionChange */}
                    <SearchInputGroup 
                        options={['Search by Campaign', 'Search by Ad Group']} 
                        selectedOption={searchOption}
                        onOptionChange={setSearchOption}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        placeholder="Search..."
                    />
                </div>
                <SimplePopover
                    align="right"
                    width="w-auto"
                    isOpen={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                    trigger={<Button variant="secondary" size="lg" icon={<Funnel size={16} />}>Filters</Button>}
                    content={<AdvancedFilterPanel onClose={() => setIsFilterOpen(false)} onApply={() => setIsFilterOpen(false)} />}
                />
            </div>

            {/* Removed isLoading prop, used conditional rendering */}
            <div className="flex-1 min-h-0 flex flex-col border border-[#e2e2e2] rounded-md bg-white">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading history...</div>
                ) : (
                    <DynamicTable 
                        data={data} 
                        columns={columns} 
                        emptyVariant="no-results"
                        className="flex-1"
                    />
                )}
            </div>

            <div className="shrink-0 mt-auto pt-2">
                <Pagination currentPage={page} totalItems={data.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </div>
        </div>
    );
}