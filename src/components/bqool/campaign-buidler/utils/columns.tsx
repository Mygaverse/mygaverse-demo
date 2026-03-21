import React from 'react';
import { ColumnDef } from "../../tables/DynamicTable";
import { Badge } from "../../ui/Badge";
import { NumberStepper } from "../../ui/NumberStepper";
import { Toggle } from "../../ui/Toggle"; 
import { GearFill, PencilFill } from "react-bootstrap-icons";

// Import Cell Components
import { EntityCell } from "../../tables/cells/EntityCell";
import { BudgetCell } from "../../tables/cells/BudgetCell";
import { AIBiddingCell } from "../../tables/cells/AIBiddingCell";

// --- 1. DEFINE INTERFACES ---
// We define these here to ensure the table knows exactly what data to expect
export interface PreviewRow {
    id: string;
    goalName: string;
    goalStrategy: string; // FIX: Added this property

    // Campaign Details
    campaignId: string;
    campaignName: string;
    storeName: string;
    storeFlag: string;
    adType: string; // 'SP', 'SB', 'SD'
    status: string; // 'Enabled', 'Paused', 'Archived'
    
    // Editable Fields
    budget: number;
    aiBidding: boolean;     
    aiBiddingStrategy: string; // e.g., 'Target ACOS'
    targetAcos?: number;
    autoHarvesting: boolean;

    // Custom Strategy Fields
    phraseType?: string;     
    phraseCount?: number;    
    targetType?: string;
    targetCount?: number;    
    negTargetCount?: number; 
}

export interface CompetingRow {
    id: string;
    productName: string;
    productImage: string;
    asin: string;
    sku: string;
    competingAdGroup: string;
    competingCampaign: string;
    status: boolean; // true = Enabled, false = Paused
}

// --- PREVIEW COLUMNS ---
export const getPreviewColumns = (
    strategy: string,
    onRowUpdate: (id: string, field: keyof PreviewRow, value: any) => void,
    
): ColumnDef<PreviewRow>[] => {
    
    // Base Columns (Always present)
    const columns: ColumnDef<PreviewRow>[] = [
        { 
            key: 'goalName', 
            header: 'Goal Name', 
            width: '200px', 
            render: (row) => (
                <div style={{ width: '240px' }}>
                    <EntityCell 
                        title={row.goalName} 
                        badges={[
                            <Badge key="strat" variant="neutral" size="sm">{strategy}</Badge>
                        ]}
                    />
                </div>
            ) 
        },
        { 
            key: 'campaignName', 
            header: 'Campaign Name', 
            width: '250px', 
            render: (row) => (
                <div style={{ width: '280px' }}>
                    <EntityCell 
                        title={row.campaignName}
                        badges={[
                            // Store Badge
                            <div key="store" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5">
                                <img 
                                    src={`https://flagcdn.com/w20/${row.storeFlag || 'us'}.png`} 
                                    alt="flag" 
                                    className="w-3.5 h-2.5 rounded-[1px]" 
                                />
                                <span className="text-[10px] text-gray-600">{row.storeName}</span>
                            </div>,
                            // Ad Type Badge
                            <Badge key="type" variant="neutral">{row.adType}</Badge>,
                            // Status Badge (Reflects existing status)
                            <Badge key="status" variant={row.status === 'Enabled' ? 'status-enabled' : 'neutral'}>
                                {row.status}
                            </Badge>
                        ]}
                    />
                </div>
            ) 
        },
        { 
            key: 'budget', 
            header: 'Daily Budget', 
            width: '120px', 
            render: (row) => (
                <div className="w-[140px]" onClick={e => e.stopPropagation()}>
                    <BudgetCell 
                        value={row.budget} 
                        onChange={(val) => onRowUpdate(row.id, 'budget', val)} 
                        isAuto={false} // Preview doesn't show auto-budget badge yet
                    />
                </div>
            ) 
        },
        { 
            key: 'ai', 
            header: 'AI-Bidding / Target ACOS', 
            width: '240px', // Widened for the dropdown
            render: (row) => (
                <div onClick={e => e.stopPropagation()}>
                    <AIBiddingCell 
                        isEnabled={row.aiBidding}
                        strategy={row.aiBiddingStrategy}
                        targetAcos={row.targetAcos ?? 30} // Default 30 if undefined
                        onToggle={(val) => onRowUpdate(row.id, 'aiBidding', val)}
                        onStrategyChange={(val) => onRowUpdate(row.id, 'aiBiddingStrategy', val)}
                        onAcosChange={(val) => onRowUpdate(row.id, 'targetAcos', val)}
                    />
                </div>
            ) 
        },
        { 
            key: 'auto', 
            header: 'Auto-Harvesting', 
            width: '120px', 
            align: 'center', 
            render: (row) => (
                <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                    <Toggle 
                        checked={row.autoHarvesting} 
                        onChange={(val) => onRowUpdate(row.id, 'autoHarvesting', val)} 
                    />
                </div>
            ) 
        },
    ];

    // CONDITIONAL COLUMN: Only for Brand-Based Strategy
    if (strategy === 'Brand-Based') {
        columns.push({
            key: 'phrases',
            header: 'Brand/Competitor Phrases',
            width: '200px',
            align: 'center',
            render: (row: any) => {
                // Check if this row has phrase data (added in CampaignBuilderContent)
                if (!row.phraseType || row.phraseCount === 0) return <span className="text-gray-400">-</span>;

                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="border border-gray-300 rounded-full px-3 py-1 text-xs text-gray-600 bg-white flex items-center gap-1 shadow-sm">
                            <span>{row.phraseType}</span>
                            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                +{row.phraseCount}
                            </span>
                        </div>
                        <button className="text-[#4aaada] hover:text-[#3a9aca]">
                            <PencilFill size={12}/>
                        </button>
                    </div>
                );
            }
        });
    }

    // B. Custom Logic (NEW)
    if (strategy === 'Custom') {
        // Targeting Column
        columns.push({
            key: 'targeting',
            header: 'Targeting',
            width: '200px',
            align: 'center',
            render: (row) => {
                if (!row.targetType || row.targetCount === undefined || row.targetCount === 0) {
                    return <span className="text-gray-400">-</span>;
                }
                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="border border-gray-300 rounded-full px-3 py-1 text-xs text-gray-600 bg-white flex items-center gap-1 shadow-sm">
                            <span>{row.targetType}</span>
                            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                +{row.targetCount}
                            </span>
                        </div>
                        <button className="text-[#4aaada] hover:text-[#3a9aca]"><PencilFill size={12}/></button>
                    </div>
                );
            }
        });

        // Negative Targeting Column (Placeholder + Add button)
        columns.push({
            key: 'negTargeting',
            header: 'Negative Targeting',
            width: '180px',
            align: 'center',
            render: (row) => (
                <button className="text-sm text-[#0066b7] font-medium hover:underline flex items-center gap-1">
                    + Add
                </button>
            )
        });
    }

    // Advanced Settings (Always last)
    columns.push({ 
        key: 'settings', 
        header: 'Advanced Settings', 
        width: '120px', 
        align: 'center', 
        render: () => <button className="text-[#4aaada] hover:bg-blue-50 p-2 rounded-full"><GearFill/></button> 
    });

    return columns;
};

// --- COMPETING COLUMNS ---
export const getCompetingColumns = (): ColumnDef<CompetingRow>[] => [
    { key: 'product', header: 'Product', width: '300px', render: (row) => (
        <div className="flex items-start gap-3">
            <img src={row.productImage} className="w-10 h-10 rounded border" />
            <div className="text-xs text-gray-700">
                <div className="font-medium line-clamp-2">{row.productName}</div>
                <div className="text-gray-500 mt-0.5">{row.asin} | SKU: {row.sku}</div>
            </div>
        </div>
    )},
    { key: 'adgroup', header: 'Competing Ad group', width: '150px', render: (row) => <div><div className="text-[#0066b7] text-sm">{row.competingAdGroup}</div><Badge size="sm" variant="status-enabled">Enabled</Badge></div> },
    { key: 'campaign', header: 'Competing Campaign', width: '200px', render: (row) => <div><div className="text-[#0066b7] text-sm truncate">{row.competingCampaign}</div><div className="flex gap-1 mt-1"><img src="https://flagcdn.com/w20/us.png" className="w-3 h-2"/><span className="text-xs text-gray-500">BlueMall</span></div></div> },
    { key: 'status', header: 'Status', width: '100px', align: 'center', render: (row) => <Badge variant={row.status ? 'status-enabled' : 'neutral'}>{row.status ? 'Enabled' : 'Paused'}</Badge> },
];