import React, { useState, useRef, useEffect } from 'react';
import { GearFill, CaretUpFill, CaretDownFill, Check, X, ChevronDown, ChevronRight, InfoCircleFill } from "react-bootstrap-icons";
import { Badge } from "../../../ui/Badge";
import { Portal } from "../../../ui/Portal"; 
import { Toggle } from "../../../ui/Toggle";
import { ColumnDef, TableContext } from "../../../tables/DynamicTable";
import { EntityCell } from "../../../tables/cells/EntityCell";
import { BudgetCell } from "../../../tables/cells/BudgetCell";
import { AIBiddingCell } from "../../../tables/cells/AIBiddingCell";
import { UnifiedAdGroup } from "../../data/unifiedAdManagerData";
import { ColumnSorter, SortDirection } from "../../../ui/ColumnSorter";

type AIUpdateHandler = (id: string, field: keyof UnifiedAdGroup, value: any) => void;

// --- CUSTOM STATUS CELL ---
const CustomStatusCell = ({ isEnabled, onToggle, isArchived }: { isEnabled: boolean, onToggle: (v: boolean) => void, isArchived?: boolean }) => (
    <div className="flex flex-col items-center gap-2 relative group" onClick={(e) => e.stopPropagation()}>
        {isArchived ? (
            <div className="relative flex items-center justify-center cursor-not-allowed opacity-50">
                <Toggle checked={false} onChange={() => {}} disabled={true} />
                <div className="absolute -right-5 top-0 text-gray-400"><InfoCircleFill size={12} /></div>
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-50">Archived</div>
            </div>
        ) : (
            <Toggle checked={isEnabled} onChange={onToggle} />
        )}
    </div>
);

// ============================================================================
// COMPLEX BULK ACTIONS MENU (Bid & AI Support)
// ============================================================================

interface BulkActionsMenuProps {
    count: number;
    onAction: (action: string, value?: any) => void;
}

const TargetingBulkActionsMenu = ({ count, onAction }: BulkActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'acos' | 'bid'>('none');
    
    // Position State
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Local State for Inputs
    const [bidVal, setBidVal] = useState<string>('');

    // State for Target ACOS Logic
        const [acosStrategy, setAcosStrategy] = useState<string>('Manual Target ACOS');
        const [acosVal, setAcosVal] = useState<string>('');

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
            // Reset local state on open
            setActiveSubmenu('none');
            setBidVal('');
            setAcosVal('');
            setAcosStrategy('Manual Target ACOS');
        }
        setIsOpen(!isOpen);
    };

    // Auto-close logic
    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('click', close);
        window.addEventListener('scroll', close, true);
        return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
    }, [isOpen]);

    // Handler: Set Default Bids
    const handleBidSubmit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!bidVal) return;
        onAction('bid', parseFloat(bidVal));
        setIsOpen(false);
    };

    // Handler: Set Target ACOS (Strategy + Value)
        const handleAcosSubmit = (e: React.MouseEvent) => {
            e.stopPropagation();
            // If Manual, require value. If Auto, value is ignored/null.
            if (acosStrategy === 'Manual Target ACOS' && !acosVal) return;
    
            onAction('set-target-acos', {
                strategy: acosStrategy,
                targetAcos: acosStrategy === 'Manual Target ACOS' ? parseFloat(acosVal) : null
            });
            setIsOpen(false);
        };

    return (
        <>
            <div className="absolute left-[30px] top-[-5px] z-[50]" onClick={(e) => e.stopPropagation()}>
                <button ref={buttonRef} onClick={toggleOpen} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#4aaada] border border-[#3a9aca] rounded shadow-lg hover:bg-[#3a9aca] transition-all whitespace-nowrap">
                    <span>Bulk Actions ({count})</span>
                    <ChevronDown size={10} />
                </button>
            </div>

            {isOpen && (
                <Portal>
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl py-1 w-56 animate-in fade-in zoom-in-95 duration-75"
                        style={{ top: coords.top, left: coords.left }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking menu
                    >
                        {/* 1. Status Actions */}
                        <button onClick={() => { onAction('enable'); setIsOpen(false); }} className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left">Set Status as Enabled</button>
                        <button onClick={() => { onAction('pause'); setIsOpen(false); }} className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left">Set Status as Paused</button>
                        <button onClick={() => { onAction('archive'); setIsOpen(false); }} className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left border-b border-gray-100">Set Status as Archived</button>

                        {/* 2. AI Bidding Actions */}
                        <div className="border-b border-gray-100">
                            <button onClick={() => { onAction('ai-enable'); setIsOpen(false); }} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">Set AI-Bidding as Enabled</button>
                            <button onClick={() => { onAction('ai-pause'); setIsOpen(false); }} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">Set AI-Bidding as Paused</button>
                            
                            {/* Set Target ACOS Submenu */}
                            <div 
                                className="relative group"
                                onMouseEnter={() => setActiveSubmenu('acos')}
                            >
                                <button className={`flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left ${activeSubmenu === 'acos' ? 'bg-gray-50' : ''}`}>
                                    <span>Set Target ACOS</span>
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>

                                {activeSubmenu === 'acos' && (
                                    <div className="absolute left-full top-[-10px] ml-1 bg-white border border-gray-200 rounded shadow-lg p-3 flex flex-col gap-3 w-64 z-[10000]">
                                        {/* Strategy Dropdown */}
                                        <div className="w-full">
                                            <select 
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:border-[#4aaada]"
                                                value={acosStrategy}
                                                onChange={(e) => setAcosStrategy(e.target.value)}
                                            >
                                                <option value="Manual Target ACOS">Manual Target ACOS</option>
                                                <option value="AI Optimized">Auto Target ACOS</option>
                                            </select>
                                        </div>

                                        {/* ACOS Value Input (Only if Manual) */}
                                        {acosStrategy === 'Manual Target ACOS' && (
                                            <div className="flex items-center border border-gray-300 rounded bg-white h-9 relative">
                                                <input 
                                                    type="number" 
                                                    autoFocus 
                                                    placeholder="0" 
                                                    className="w-full h-full text-sm outline-none bg-transparent pl-3 pr-8" 
                                                    value={acosVal} 
                                                    onChange={(e) => setAcosVal(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAcosSubmit(e as any)} 
                                                />
                                                <div className="absolute right-6 text-gray-500 text-xs select-none">%</div>
                                                <div className="absolute right-0 top-0 h-full flex flex-col border-l border-gray-200 w-5">
                                                    <button className="flex-1 hover:bg-gray-100 flex items-center justify-center text-gray-500" onClick={() => setAcosVal((p) => (parseFloat(p||'0') + 1).toString())}><CaretUpFill size={8}/></button>
                                                    <button className="flex-1 hover:bg-gray-100 flex items-center justify-center text-gray-500 border-t border-gray-200" onClick={() => setAcosVal((p) => Math.max(0, parseFloat(p||'0') - 1).toString())}><CaretDownFill size={8}/></button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                            <button onClick={() => setActiveSubmenu('none')} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded border border-gray-200">Cancel</button>
                                            <button onClick={handleAcosSubmit} className="px-3 py-1.5 text-xs font-medium text-white bg-[#4aaada] hover:bg-[#3a9ad0] rounded flex items-center gap-1">
                                                <Check size={14}/> Save
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Auto-Harvesting Actions */}
                        <div className="border-b border-gray-100">
                            <button onClick={() => { onAction('harvest-enable'); setIsOpen(false); }} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">Set Auto-Harvesting as Enabled</button>
                            <button onClick={() => { onAction('harvest-pause'); setIsOpen(false); }} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">Set Auto-Harvesting Paused</button>
                        </div>

                        {/* 4. Set Bid Option */}
                        <div 
                            className="relative group"
                            onMouseEnter={() => setActiveSubmenu('bid')}
                        >
                            <button className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left ${activeSubmenu === 'bid' ? 'bg-gray-50' : ''}`}>
                                <span>Set Bid</span>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                            </button>

                            {/* Submenu: Set Bid Input */}
                            {activeSubmenu === 'bid' && (
                                <div className="absolute left-full top-[-10px] ml-1 bg-white border border-gray-200 rounded shadow-lg p-2 flex items-center gap-2 w-64 z-[10000]">
                                    <div className="flex items-center border border-gray-300 rounded bg-white h-9 flex-1 relative">
                                        <div className="pl-2 pr-1 text-gray-500 text-xs select-none">$</div>
                                        <input 
                                            type="number" 
                                            autoFocus 
                                            placeholder="0.00" 
                                            className="w-full h-full text-sm outline-none bg-transparent pr-6" 
                                            value={bidVal} 
                                            onChange={(e) => setBidVal(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleBidSubmit(e as any)} 
                                        />
                                        <div className="absolute right-0 top-0 h-full flex flex-col border-l border-gray-200 w-5">
                                            <button className="flex-1 hover:bg-gray-100 flex items-center justify-center text-gray-500" onClick={() => setBidVal((p) => (parseFloat(p||'0') + 0.01).toFixed(2))}><CaretUpFill size={8}/></button>
                                            <button className="flex-1 hover:bg-gray-100 flex items-center justify-center text-gray-500 border-t border-gray-200" onClick={() => setBidVal((p) => Math.max(0, parseFloat(p||'0') - 0.01).toFixed(2))}><CaretDownFill size={8}/></button>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveSubmenu('none')} className="h-9 w-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded border border-gray-200"><X size={18} /></button>
                                    <button onClick={handleBidSubmit} className="h-9 w-9 flex items-center justify-center bg-[#4aaada] hover:bg-[#3a9ad0] text-white rounded"><Check size={18} /></button>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </Portal>
            )}
        </>
    );
};

// ============================================================================
// 3. MAIN COLUMN DEFINITION
// ============================================================================

export const getSBAdGroupColumns = (
    onToggleStatus: (id: string, val: boolean) => void,
    onBidChange: (id: string, val: number) => void,
    onUpdateAI: AIUpdateHandler,
    onBulkAction: (action: string, ids: string[], value?: any) => void,
    onEdit: (row: any) => void,
    currentSort: { key: string; direction: SortDirection },
    onSort: (key: string, direction: SortDirection) => void
): ColumnDef<any>[] => {

    const WIDTH_SELECT = '50px'; 
    const WIDTH_ACTION = '70px'; 
    const WIDTH_STATUS = '80px';
    const WIDTH_NAME   = '220px'; 
    const WIDTH_CAMP   = '260px'; 
    const WIDTH_FORMAT = '140px'; // New "Ad Format" column
    const WIDTH_AI     = '300px';

    const OFFSET_ACTION = '50px';
    const OFFSET_STATUS = '120px'; 
    const OFFSET_NAME   = '200px'; 

    return [
        // --- 1. SELECTION ---
        { 
            key: 'select', 
            // FLOATING MENU LOGIC
            header: (context: TableContext<UnifiedAdGroup>) => (
                <div className="flex items-center justify-center relative w-full h-full" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" 
                        checked={context.isAllSelected} 
                        ref={(input) => { if (input) input.indeterminate = context.isSomeSelected; }} 
                        onChange={context.toggleAll} 
                    />
                    {context.selectedIds.size > 0 && (
                        <TargetingBulkActionsMenu 
                            count={context.selectedIds.size} 
                            onAction={(a, v) => { onBulkAction(a, Array.from(context.selectedIds), v); context.resetSelection(); }} 
                        />
                    )}
                </div>
            ),
            width: '50px', sticky: 'left', stickyOffset: '0px', align: 'center',
            render: (row, context) => (
                <div className="flex justify-center w-full" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={context.selectedIds.has(row.id)} onChange={() => context.toggleRow(row.id)} className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" />
                </div>
            )
        },

        {
            key: 'actions',
            header: 'Actions',
            width: '50px',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center">
                    {/* Ensure your ActionMenu or Edit Button calls onEdit(row) */}
                    <button 
                        onClick={() => onEdit(row)} 
                        className="text-[#4aaada] hover:bg-[#f1f7ff] p-1.5 rounded transition-colors"
                        title="Edit Settings"
                    >
                        <GearFill size={16} /> 
                    </button>
                    {/* Or if using a dropdown menu component, pass it there */}
                </div>
            )
        },

        // --- 3. STATUS ---
        { 
            key: 'status', header: 'Status', width: '80px', sticky: 'left', stickyOffset: '50px', align: 'center',
            render: (row) => <CustomStatusCell isEnabled={row.enabled ?? false} isArchived={(row as any).status === 'Archived'} onToggle={(val) => onToggleStatus(row.id, val)} />
        },

        // --- 4. AD GROUPS ---
        { 
            key: 'name', 
            header: () => (
                <ColumnSorter
                    columnKey="name"
                    label="Ad Group"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ), 
            sticky: 'left', stickyOffset: OFFSET_NAME, width: WIDTH_NAME,
            render: (row) => (
                <div style={{ width: WIDTH_NAME }}>
                    <EntityCell title={row.name || 'Unknown'} />
                </div>
            ),
            renderSummary: (data) => <span className="font-bold text-gray-900 ml-1">{data?.name || 'Total'}</span>
        },

        // --- 5. CAMPAIGNS ---
        { 
            key: 'campaign', 
            header: () => (
                <ColumnSorter
                    columnKey="name"
                    label="Campaigns"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ), 
            width: WIDTH_CAMP,
            render: (row) => (
                <div style={{ width: WIDTH_CAMP }}>
                    <EntityCell 
                        title={row.campaignName || '-'} 
                        badges={[
                            <div key="store" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5">
                                <img src={`https://flagcdn.com/w20/${row.flag || 'us'}.png`} alt={row.flag} className="w-3.5 h-2.5 rounded-[1px]" />
                                <span className="text-[10px] text-gray-600">{row.storeName}</span>
                            </div>,
                            <Badge key="b" variant="neutral" size="sm">SB</Badge>
                        ]} 
                    />
                </div>
            )
        },

        // --- 6. AD FORMAT (Unique to SB) ---
        {
            key: 'adFormat', header: 'Ad Format', width: WIDTH_FORMAT, align: 'center',
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                    {row.adFormat || '-'}
                </span>
            )
        },

        // --- 7. AI BIDDING ---
        {
            key: 'aiBidding', header: 'AI-Bidding / Target ACOS', width: WIDTH_AI,
            render: (row) => (
                <AIBiddingCell 
                    isEnabled={row.aiBiddingEnabled ?? false}
                    strategy={row.aiBiddingStrategy || 'Manual Target ACOS'}
                    targetAcos={row.targetAcos ?? null}
                    onToggle={(val) => onUpdateAI(row.id, 'aiBiddingEnabled', val)}
                    onStrategyChange={(val) => onUpdateAI(row.id, 'aiBiddingStrategy', val)}
                    onAcosChange={(val) => onUpdateAI(row.id, 'targetAcos', val)}
                />
            )
        },

        // --- 8. METRICS ---
        { 
            key: 'sales', 
            header: () => (
                <ColumnSorter
                    columnKey="sales"
                    label="Ad Sales"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ),  
            align: 'right', width: '110px', 
            render: (row) => `$${(row.sales ?? 0).toFixed(2)}` 
        },
        { 
            key: 'spend', 
            header: () => (
                <ColumnSorter
                    columnKey="spend"
                    label="Ad Spend"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ),  
            align: 'right', width: '110px', 
            render: (row) => `$${(row.spend ?? 0).toFixed(2)}` 
        },
        { 
            key: 'acos', 
            header: () => (
                <ColumnSorter
                    columnKey="acos"
                    label="ACOS"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ),  
            align: 'right', width: '90px', 
            render: (row) => <span className="font-medium text-gray-900">{(row.acos ?? 0).toFixed(2)}%</span> 
        },
        { 
            key: 'roas', 
            header: () => (
                <ColumnSorter
                    columnKey="roas"
                    label="ROAS"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '90px', 
            render: (row) => (row.roas ?? 0).toFixed(2) 
        },
        { 
            key: 'orders', 
            header: () => (
                <ColumnSorter
                    columnKey="orders"
                    label="Ad Orders"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '100px', 
            render: (row) => (row.orders ?? 0).toLocaleString() 
        },
        { 
            key: 'units', 
            header: () => (
                <ColumnSorter
                    columnKey="units"
                    label="Ad Units Sold"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '110px', 
            render: (row) => (row.units ?? 0).toLocaleString() 
        },
        { 
            key: 'cvr', 
            header: () => (
                <ColumnSorter
                    columnKey="cvr"
                    label="CVR"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '90px', 
            render: (row) => `${(row.cvr ?? 0).toFixed(2)}%` 
        },
        { 
            key: 'impressions', 
            header: () => (
                <ColumnSorter
                    columnKey="impressions"
                    label="Impressions"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '110px', 
            render: (row) => (row.impressions ?? 0).toLocaleString() 
        },
        { 
            key: 'clicks', 
            header: () => (
                <ColumnSorter
                    columnKey="clicks"
                    label="Clicks"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '90px', 
            render: (row) => (row.clicks ?? 0).toLocaleString() 
        },
        { 
            key: 'ctr', 
            header: () => (
                <ColumnSorter
                    columnKey="ctr"
                    label="CTR"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ),
            align: 'right', width: '90px', 
            render: (row) => `${(row.ctr ?? 0).toFixed(2)}%` 
        },
        { 
            key: 'cpc', 
            header: () => (
                <ColumnSorter
                    columnKey="cpc"
                    label="CPC"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="number"
                />
            ), 
            align: 'right', width: '90px', 
            render: (row) => `$${(row.cpc ?? 0).toFixed(2)}` 
        },
    ];
};