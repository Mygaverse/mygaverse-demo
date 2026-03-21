import React from 'react';
import { ColumnDef } from "@/components/bqool/tables/DynamicTable";
import { EntityCell } from "@/components/bqool/tables/cells/EntityCell";
import { ClickableNumberCell } from "@/components/bqool/tables/cells/ClickableNumberCell";
import { Badge } from "@/components/bqool/ui/Badge";

// Use 'any' or your UnifiedCampaign type here to be safe
export const getBudgetCampaignColumns = (
    onBudgetGroupClick: (groupId: string) => void,
    onProductAdsClick: (campaign: any) => void
): ColumnDef<any>[] => {

    return [
        { 
            key: 'name', 
            header: 'Campaigns', 
            width: '300px',
            sticky: 'left', stickyOffset: '0px',
            render: (row) => (
                <div className="border-r border-gray-200 pr-4 h-full flex items-center">
                    <EntityCell 
                        title={row.name}
                        badges={[
                             <div key="store" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5">
                                {/* FIX: Use 'flag' instead of 'storeFlag' */}
                                <img src={`https://flagcdn.com/w20/${row.flag || 'us'}.png`} alt={row.flag} className="w-3.5 h-2.5 rounded-[1px]" />
                                <span className="text-[10px] text-gray-600">{row.storeName}</span>
                             </div>,
                             /* FIX: Use 'type' instead of 'adType' */
                             <Badge key="type" variant="neutral">{row.type}</Badge>,
                             <Badge key="status" variant={row.status === 'Enabled' ? 'status-enabled' : 'neutral'}>{row.status}</Badge>
                        ]}
                    />
                </div>
            )
        },
        { 
            key: 'budgetingGroup', 
            header: 'Budgeting Group', 
            width: '280px',
            render: (row) => (
                <div 
                    onClick={() => onBudgetGroupClick(row.budgetingGroupId)}
                    className="cursor-pointer hover:bg-blue-50 -m-3 p-3 transition-colors h-full flex items-center"
                >
                    <EntityCell 
                        title={row.budgetingGroupName || '-'}
                        className="text-[#0066b7] hover:underline"
                        badges={[
                             // You can reuse store info here if needed, or just show status
                             <Badge key="bg-status" variant={row.budgetingGroupStatus === 'Enabled' ? 'status-enabled' : 'neutral'}>
                                {row.budgetingGroupStatus || 'Unknown'}
                             </Badge>
                        ]}
                    />
                </div>
            )
        },
        { 
            key: 'productAds', 
            header: 'Product Ads', 
            width: '100px',
            align: 'center',
            render: (row) => (
                <ClickableNumberCell 
                    value={row.productCount || 0} 
                    onClick={() => onProductAdsClick(row)} // Pass the campaign row to the modal handler
                />
            )
        },
        { 
            key: 'dailyBudget', 
            header: 'Daily Budget', 
            align: 'right', 
            width: '120px', 
            render: (row) => row.dailyBudget !== undefined ? `$${row.dailyBudget.toFixed(2)}` : '-' 
        },
        
        // Metrics
        { key: 'adSales', header: 'Ad Sales', align: 'right', width: '110px', render: (row) => `$${(row.adSales ?? 0).toFixed(2)}` },
        { key: 'adSpend', header: 'Ad Spend', align: 'right', width: '110px', render: (row) => `$${(row.adSpend ?? 0).toFixed(2)}` },
        { key: 'acos', header: 'ACOS', align: 'right', width: '90px', render: (row) => `${(row.acos ?? 0).toFixed(2)}%` },
        { key: 'roas', header: 'ROAS', align: 'right', width: '90px', render: (row) => (row.roas ?? 0).toFixed(2) },
        { key: 'orders', header: 'Ad Orders', align: 'right', width: '100px', render: (row) => (row.orders ?? 0).toLocaleString() },
        { key: 'units', header: 'Ad Units Sold', align: 'right', width: '110px', render: (row) => (row.units ?? 0).toLocaleString() },
        { key: 'cvr', header: 'CVR', align: 'right', width: '90px', render: (row) => `${(row.cvr ?? 0).toFixed(2)}%` },
        { key: 'impressions', header: 'Impressions', align: 'right', width: '110px', render: (row) => (row.impressions ?? 0).toLocaleString() },
        { key: 'clicks', header: 'Clicks', align: 'right', width: '90px', render: (row) => (row.clicks ?? 0).toLocaleString() },
        { key: 'ctr', header: 'CTR', align: 'right', width: '90px', render: (row) => `${(row.ctr ?? 0).toFixed(2)}%` },
        { key: 'cpc', header: 'CPC', align: 'right', width: '90px', render: (row) => `$${(row.cpc ?? 0).toFixed(2)}` },
    ];
};