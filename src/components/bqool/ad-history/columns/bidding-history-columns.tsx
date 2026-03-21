import React from 'react';
import { ColumnDef } from "@/components/bqool/tables/DynamicTable";
import { EntityCell } from "@/components/bqool/tables/cells/EntityCell";
import { Badge } from "@/components/bqool/ui/Badge";

// Define the interface to match the data mapped in BiddingHistoryTab
export interface BiddingHistoryRow {
    id: string;
    dateTime: string;
    goalName: string;
    goalType: string;
    campaignName: string;
    storeFlag: string;
    storeName: string;
    adType: string;
    adGroupName: string;
    targeting: string;
    targetingType: string;
    ruleName: string;
    bidFrom: string;
    bidTo: string;
}

export const getBiddingHistoryColumns = (): ColumnDef<BiddingHistoryRow>[] => [
    { 
        key: 'dateTime', 
        header: 'Date & Time', 
        width: '160px', 
        render: (row) => <div className="text-sm font-medium text-gray-700 whitespace-normal">{row.dateTime}</div> 
    },
    { 
        key: 'goals', 
        header: 'Goals', 
        width: '200px',
        render: (row) => (
            <EntityCell 
                title={row.goalName} 
                badges={[<Badge key="t" variant="neutral" size="sm">{row.goalType}</Badge>]} 
            />
        )
    },
    { 
        key: 'campaigns', 
        header: 'Campaigns', 
        width: '220px',
        render: (row) => (
            <EntityCell 
                title={row.campaignName} 
                badges={[
                    <div key="s" className="flex items-center gap-1 border px-2 py-0.5 rounded border-[#e2e2e2] bg-gray-50">
                        <img src={`https://flagcdn.com/w20/${row.storeFlag || 'us'}.png`} className="w-3 h-2 rounded-[1px]" alt="flag"/>
                        <span className="text-[10px] text-gray-500">{row.storeName}</span>
                    </div>,
                    <Badge key="a" variant="neutral" size="sm">{row.adType}</Badge>
                ]} 
            />
        )
    },
    { 
        key: 'adGroup', 
        header: 'Ad Groups', 
        width: '150px', 
        render: (row) => <span className="text-sm text-[#0066b7] cursor-pointer hover:underline">{row.adGroupName}</span> 
    },
    { 
        key: 'targeting', 
        header: 'Targeting', 
        width: '200px', 
        render: (row) => (
            <div className="flex flex-col">
                <span className="text-sm text-gray-900">{row.targeting}</span>
                <span className="text-[10px] text-gray-500 bg-white border border-[#e2e2e2] px-2 py-0.5 rounded w-fit mt-1">
                    {row.targetingType}
                </span>
            </div>
        ) 
    },
    { 
        key: 'rule', 
        header: 'Bidding Rule', 
        width: '130px', 
        align: 'center', 
        render: (row) => <Badge variant="ai-bidding" size="sm">{row.ruleName}</Badge> 
    },
    { 
        key: 'from', 
        header: 'Bid changed from', 
        width: '120px', 
        align: 'right', 
        render: (row) => <span className="text-gray-500 text-sm mr-2">{row.bidFrom}</span> 
    },
    { 
        key: 'to', 
        header: 'Bid changed to', 
        width: '120px', 
        align: 'right', 
        render: (row) => <span className="font-bold text-gray-900">{row.bidTo}</span> 
    },
];