import React, { useState, useRef, useEffect } from 'react';
import { ExclamationTriangleFill, Info, ThreeDotsVertical, Trash, Pencil, ArrowBarDown, ArrowDown, ChevronBarDown} from "react-bootstrap-icons";

import { DropdownButton } from "../../ui/DropdownButton";
import { Badge } from "../../ui/Badge";
import { StatusCell } from "../../tables/cells/StatusCell";
import { BudgetCell } from "@/components/bqool/tables/cells/BudgetCell";
import { Portal } from "@/components/bqool/ui/Portal";

import { ColumnDef } from "../../tables/DynamicTable";

import { EntityCell } from "../../tables/cells/EntityCell";
import { BudgetingGroupData } from "../data/budgeting-groups";


// --- PORTAL DROPDOWN ---
const ActionMenu = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ 
                top: rect.bottom + window.scrollY + 2, 
                left: rect.left + window.scrollX - 0 // Shift left to align
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('click', close); window.addEventListener('scroll', close, true);
        return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
    }, [isOpen]);

    return (
        <>
            <button ref={buttonRef} onClick={toggle} className="px-2 py-1.5 rounded-md hover:bg-gray-100 text-gray-800 border border-[#e2e2e2] text-sm flex items-center gap-2">
                Actions <ChevronBarDown size={14} />
            </button>
            {isOpen && (
                <Portal>
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-200 rounded shadow-lg py-1 w-40 text-sm"
                        style={{ top: coords.top, left: coords.left }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Pencil size={12} /> Edit Group
                        </button>
                        <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600">
                            <Trash size={12} /> Delete Group
                        </button>
                    </div>
                </Portal>
            )}
        </>
    );
};

export const getBudgetingGroupColumns = (
    onToggleStatus: (id: string, val: boolean) => void,
    onBudgetChange: (id: string, val: number) => void,
    // Handlers for Dropdown Actions
    onEdit: (group: any) => void, // Pass entire object
    onDelete: (id: string) => void,
): ColumnDef<BudgetingGroupData>[] => {

    return [
        { 
            key: 'select', 
            header: <div className="flex justify-center"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" /></div> as any,
            width: '50px', 
            align: 'center',
            sticky: 'left', stickyOffset: '0px',
            render: () => <div className="flex justify-center w-full"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" /></div>
        },
        {
            key: 'status', 
            header: 'Status', 
            width: '80px', 
            align: 'center',
            sticky: 'left', stickyOffset: '50px',
           render: (row) => <StatusCell isEnabled={row.enabled} statusLabel="" onToggle={(val) => onToggleStatus(row.id, val)} />
        },
        {
            key: 'actions', 
            header: 'Actions', 
            width: '100px', 
            align: 'center',
            sticky: 'left', stickyOffset: '130px',
            render: (row) => (
                <div className="flex justify-center">
                    <ActionMenu 
                        onEdit={() => onEdit(row)} 
                        onDelete={() => onDelete(row.id)} 
                    />
                </div>
            )
        },
        { 
            key: 'name', 
            header: 'Budgeting Group', 
            width: '320px',
            sticky: 'left', stickyOffset: '230px',
            render: (row) => (
                // Added border-r to separate sticky column visually
                <div className="border-0 border-gray-200 pr-4 h-full flex items-center">
                    <EntityCell 
                        title={row.name}
                        badges={[
                             <div key="store" className="flex items-center gap-1">
                                <img src={`https://flagcdn.com/w20/${row.storeFlag}.png`} alt={row.storeFlag} className="w-3.5 h-2.5 rounded-[1px]" />
                                <span className="text-[10px] text-gray-600">{row.storeName}</span>
                             </div>,
                             <span key="st" className="text-[10px] text-gray-500 font-medium">{row.statusText}</span>
                        ]}
                    />
                </div>
            )
        },
        {
            key: 'rule', 
            header: 'Budgeting Rule', 
            width: '140px',
            render: (row) => (
                // Always show this badge if created via our modal
                <Badge variant="auto-harvesting">{row.ruleType || 'Auto-budgeting'}</Badge>
            )
        },
        {
            key: 'budget', header: 'Total Daily Budget', width: '140px',
            render: (row) => (
                <div style={{ width: '120px' }} onClick={e => e.stopPropagation()}>
                    <BudgetCell value={row.budget} onChange={(val) => onBudgetChange(row.id, val)} isAuto={false} />
                </div>
            )
        },
        { key: 'adSales', header: 'Ad Sales', align: 'right', width: '110px', render: (row) => row.adSales },
        { key: 'adSpend', header: 'Ad Spend', align: 'right', width: '110px', render: (row) => row.adSpend },
        { key: 'acos', header: 'ACOS', align: 'right', width: '90px', render: (row) => row.acos },
        { key: 'roas', header: 'ROAS', align: 'right', width: '90px', render: (row) => row.roas },
        { key: 'orders', header: 'Ad Orders', align: 'right', width: '100px', render: (row) => row.orders },
        { key: 'units', header: 'Ad Units Sold', align: 'right', width: '110px', render: (row) => row.units },
        { key: 'cvr', header: 'CVR', align: 'right', width: '90px', render: (row) => row.cvr },
        { key: 'impressions', header: 'Impressions', align: 'right', width: '110px', render: (row) => row.impressions },
        { key: 'clicks', header: 'Clicks', align: 'right', width: '90px', render: (row) => row.clicks },
        { key: 'ctr', header: 'CTR', align: 'right', width: '90px', render: (row) => row.ctr },
        { key: 'cpc', header: 'CPC', align: 'right', width: '90px', render: (row) => row.cpc },
    ];
};

const InfoIcon = () => <div className="text-blue-400">ⓘ</div>; // Simple placeholder