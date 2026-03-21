import React, { useState, useRef, useEffect } from 'react';
import { GearFill } from "react-bootstrap-icons";
import { Badge } from "@/components/bqool/ui/Badge";
import { Portal } from "@/components/bqool/ui/Portal"; 
import { ColumnDef } from "@/components/bqool/tables/DynamicTable";
import { UnifiedGoal } from "../../data/unifiedAdManagerData";
import { ColumnSorter, SortDirection } from "@/components/bqool/ui/ColumnSorter";

// --- Name Editor Popover ---
const NameEditor = ({ initialValue, onSave, onClose, coords }: any) => {
    const [val, setVal] = useState(initialValue);
    return (
        <Portal>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div 
                className="fixed z-[9999] bg-white border border-gray-200 rounded shadow-xl p-3 w-64 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-75"
                style={{ top: coords.top, left: coords.left }}
            >
                <label className="text-xs font-semibold text-gray-500 uppercase">Edit Goal Name</label>
                <input 
                    autoFocus
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none focus:border-[#4aaada]"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSave(val)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={() => onSave(val)} className="text-xs bg-[#4aaada] text-white px-2 py-1 rounded hover:bg-[#3a9aca]">Save</button>
                </div>
            </div>
        </Portal>
    );
};

// --- Custom Name Cell ---
const EditableNameCell = ({ row, onEdit }: { row: UnifiedGoal, onEdit: (id: string, name: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 5, left: rect.left });
        }
        setIsEditing(true);
    };

    return (
        <>
            <button 
                ref={btnRef}
                onClick={handleClick}
                className="text-[#4aaada] hover:bg-[#f0f9ff] p-2 rounded transition-colors"
            >
                <GearFill size={16} />
            </button>
            {isEditing && (
                <NameEditor 
                    initialValue={row.name}
                    onSave={(newName: string) => { onEdit(row.id, newName); setIsEditing(false); }}
                    onClose={() => setIsEditing(false)}
                    coords={coords}
                />
            )}
        </>
    );
};

export const getSPGoalsColumns = (
    onEditName: (id: string, name: string) => void,
    onViewCampaigns: (goal: UnifiedGoal) => void,
    onViewProductAds: (goal: UnifiedGoal) => void,
    currentSort: { key: string; direction: SortDirection },
    onSort: (key: string, direction: SortDirection) => void
): ColumnDef<UnifiedGoal>[] => {

    return [
        { 
            key: 'actions', 
            header: 'Actions', 
            width: '80px', 
            align: 'center',
            sticky: 'left', stickyOffset: '0px',
            render: (row) => <EditableNameCell row={row} onEdit={onEditName} />
        },
        { 
            key: 'name', 
            header: () => <ColumnSorter columnKey="name" label="Goals" currentSort={currentSort} onSort={onSort} />,
            width: '280px',
            sticky: 'left', stickyOffset: '80px',
            render: (row) => (
                <div className="flex flex-col gap-1.5 py-1">
                    <span 
                        className="text-[#0066b7] text-sm font-medium cursor-pointer hover:underline truncate"
                        title={row.name}
                        onClick={() => onViewCampaigns(row)}
                    >
                        {row.name}
                    </span>
                    <div className="flex items-center gap-2">
                        {/* Store Badge */}
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm">
                            <img 
                                src={`https://flagcdn.com/w20/${'us'}.png`} // Placeholder: replace with row.storeFlag if available
                                alt="flag" 
                                className="w-3.5 h-2.5 rounded-[1px] object-cover" 
                            />
                            <span className="text-[10px] text-gray-600 font-medium">BlueMall</span> {/* Placeholder: replace with row.storeName */}
                        </div>
                        {/* Strategy Badge */}
                        <Badge variant="neutral" size="sm" className="bg-gray-100 text-gray-700 border-gray-200">
                            {row.goalType || 'Basic'}
                        </Badge>
                    </div>
                </div>
            ) 
        },
        {
            key: 'campaignCount', 
            header: 'Campaigns', 
            width: '100px', 
            align: 'center',
            render: (row) => (
                <button 
                    onClick={(e) => { e.stopPropagation(); onViewCampaigns(row); }}
                    className="text-[#0066b7] hover:underline font-medium text-sm"
                >
                    {row.campaignCount}
                </button>
            )
        },
        {
            key: 'adCount', 
            header: 'Product Ads', 
            width: '100px', 
            align: 'center',
            render: (row) => (
                <button 
                    onClick={(e) => { e.stopPropagation(); onViewProductAds(row); }}
                    className="text-[#0066b7] hover:underline font-medium text-sm"
                >
                    {row.adCount || 0}
                </button>
            )
        },
        // Metrics
        { 
            key: 'sales', 
            header: () => <ColumnSorter columnKey="sales" label="Ad Sales" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '120px', 
            render: (row) => `$${(row.sales ?? 0).toFixed(2)}` 
        },
        { 
            key: 'spend', 
            header: () => <ColumnSorter columnKey="spend" label="Ad Spend" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '120px', 
            render: (row) => `$${(row.spend ?? 0).toFixed(2)}` 
        },
        { 
            key: 'acos', 
            header: () => <ColumnSorter columnKey="acos" label="ACOS" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => <span className="font-medium text-gray-900">{(row.acos ?? 0).toFixed(2)}%</span> 
        },
        { 
            key: 'roas', 
            header: () => <ColumnSorter columnKey="roas" label="ROAS" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => (row.roas ?? 0).toFixed(2) 
        },
        { 
            key: 'orders', 
            header: () => <ColumnSorter columnKey="orders" label="Ad Orders" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => (row.orders ?? 0).toLocaleString() 
        },
        { 
            key: 'units', 
            header: () => <ColumnSorter columnKey="units" label="Ad Units Sold" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '120px', 
            render: (row) => (row.units ?? 0).toLocaleString() 
        },
        { 
            key: 'cvr', 
            header: () => <ColumnSorter columnKey="cvr" label="CVR" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => `${(row.cvr ?? 0).toFixed(2)}%` 
        },
        { 
            key: 'impressions', 
            header: () => <ColumnSorter columnKey="impressions" label="Impressions" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '120px', 
            render: (row) => (row.impressions ?? 0).toLocaleString() 
        },
        { 
            key: 'clicks', 
            header: () => <ColumnSorter columnKey="clicks" label="Clicks" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => (row.clicks ?? 0).toLocaleString() 
        },
        { 
            key: 'ctr', 
            header: () => <ColumnSorter columnKey="ctr" label="CTR" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => `${(row.ctr ?? 0).toFixed(2)}%` 
        },
        { 
            key: 'cpc', 
            header: () => <ColumnSorter columnKey="cpc" label="CPC" type="number" currentSort={currentSort} onSort={onSort} />, 
            align: 'right', width: '100px', 
            render: (row) => `$${(row.cpc ?? 0).toFixed(2)}` 
        },
    ];
};