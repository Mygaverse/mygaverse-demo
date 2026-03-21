import React from 'react';
import { ColumnDef } from "@/components/bqool/tables/DynamicTable";
import { EntityCell } from "@/components/bqool/tables/cells/EntityCell";
import { Badge } from "@/components/bqool/ui/Badge";

export interface HarvestingHistoryRow {
    id: string;
    dateTime: string;
    goalName: string;
    goalType: string;
    campaignName: string;
    storeFlag: string;
    storeName: string;
    adType: string;
    adGroupName: string;
    ruleName: string;
    targetingAdded: string;
    targetingType: string;
}

export const getHarvestingHistoryColumns = (): ColumnDef<HarvestingHistoryRow>[] => [
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
        key: 'rule', 
        header: 'Harvesting Rule', 
        width: '140px', 
        align: 'center', 
        render: (row) => <Badge variant="auto-harvesting" size="sm">{row.ruleName}</Badge> 
    },
    { 
        key: 'targeting', 
        header: 'Targeting Added', 
        width: '220px', 
        render: (row) => (
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{row.targetingAdded}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit mt-1 border ${
                    row.targetingType.includes('Negative') 
                        ? 'bg-white text-red-600 border-red-100 rounded-lg' 
                        : 'bg-white text-[#0066b7] border-[#0066b7]/60 rounded-lg'
                }`}>
                    {row.targetingType}
                </span>
            </div>
        ) 
    },
];