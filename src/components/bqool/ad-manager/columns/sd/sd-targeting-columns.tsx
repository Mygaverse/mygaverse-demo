import React, { useState, useRef, useEffect } from 'react';
import { Badge } from "../../../ui/Badge";
import { ChevronDown, ChevronRight, Check, X, CaretUpFill, CaretDownFill, InfoCircleFill } from "react-bootstrap-icons";
import { Portal } from "../../../ui/Portal"; 
import { Toggle } from "../../../ui/Toggle";
import { ColumnDef, TableContext } from "../../../tables/DynamicTable";
import { StatusCell } from "../../../tables/cells/StatusCell";
import { EntityCell } from "../../../tables/cells/EntityCell";
import { BiddingCardCell } from "../../../tables/cells/BiddingCardCell"; 
import { UnifiedTargeting } from "../../data/unifiedAdManagerData";
import { ColumnSorter, SortDirection } from "../../../ui/ColumnSorter";

type BidUpdateHandler = (id: string, field: string, val: any) => void;

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

// --- COMPLEX BULK ACTIONS MENU ---
interface BulkActionsMenuProps {
    count: number;
    onAction: (action: string, value?: any) => void;
}

const TargetingBulkActionsMenu = ({ count, onAction }: BulkActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'bid' | 'ai'>('none');
    
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Local State
    const [bidVal, setBidVal] = useState<string>('');
    const [useMin, setUseMin] = useState(false);
    const [minVal, setMinVal] = useState<string>('0.00');
    const [useMax, setUseMax] = useState(false);
    const [maxVal, setMaxVal] = useState<string>('0.00');

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
            // Reset
            setActiveSubmenu('none'); 
            setBidVal('');
            setUseMin(false); 
            setUseMax(false);
            setMinVal('0.00');
            setMaxVal('0.00');
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('click', close); 
        window.addEventListener('scroll', close, true);
        return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
    }, [isOpen]);

    const handleBidSubmit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!bidVal) return;
        onAction('bid', parseFloat(bidVal));
        setIsOpen(false);
    };

    const handleAISubmit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAction('ai-bid', { 
            minBid: useMin ? parseFloat(minVal||'0') : null, 
            maxBid: useMax ? parseFloat(maxVal||'0') : null });
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 1. Status Actions */}
                        <button onClick={() => { onAction('enable'); setIsOpen(false); }} className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left">Set Status as Enabled</button>
                        <button onClick={() => { onAction('pause'); setIsOpen(false); }} className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left">Set Status as Paused</button>
                        <button onClick={() => { onAction('archive'); setIsOpen(false); }} className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left border-b border-gray-100">Set Status as Archived</button>

                        {/* 2. Set Bid Option */}
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
                                        <div className="pl-2 pr-1 text-gray-500 text-xs">$</div>
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

                        {/* Set AI-Bidding */}
                        <div 
                            className="relative group" 
                            onMouseEnter={() => setActiveSubmenu('ai')}
                        >
                            <button className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 text-left ${activeSubmenu === 'ai' ? 'bg-gray-50' : ''}`}>
                                <span>Set AI-Bidding</span>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                            </button>

                            {/* Submenu: AI Bidding Panel */}
                            {activeSubmenu === 'ai' && (
                                <div className="absolute left-full bottom-0 ml-1 bg-white border border-gray-200 rounded shadow-lg p-4 flex flex-col gap-4 w-72 z-[10000]">
                                    <h4 className="font-semibold text-gray-800 text-sm">AI-Bidding Settings</h4>
                                    
                                    {/* Min Bid Row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Toggle checked={useMin} onChange={setUseMin} />
                                            <span className="text-sm text-gray-600">Set Min Bid</span>
                                        </div>
                                        {useMin && (
                                            <div className="flex items-center border border-gray-300 rounded bg-white h-8 w-24 relative">
                                                <div className="pl-2 pr-1 text-gray-500 text-xs">$</div>
                                                <input type="number" className="w-full h-full text-xs outline-none bg-transparent" value={minVal} onChange={(e) => setMinVal(e.target.value)} />
                                                <div className="absolute right-0 top-0 h-full flex flex-col border-l border-gray-200 w-4">
                                                    <button className="flex-1 hover:bg-gray-100 flex items-center justify-center" onClick={() => setMinVal((p) => (parseFloat(p||'0') + 0.01).toFixed(2))}><CaretUpFill size={6}/></button>
                                                    <button className="flex-1 hover:bg-gray-100 flex items-center justify-center border-t" onClick={() => setMinVal((p) => Math.max(0, parseFloat(p||'0') - 0.01).toFixed(2))}><CaretDownFill size={6}/></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Max Bid Row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Toggle checked={useMax} onChange={setUseMax} />
                                            <span className="text-sm text-gray-600">Set Max Bid</span>
                                        </div>

                                        {useMax && (
                                            <div className="flex items-center border border-gray-300 rounded bg-white h-8 w-24 relative">
                                                <div className="pl-2 pr-1 text-gray-500 text-xs">$</div>
                                                <input type="number" className="w-full h-full text-xs outline-none bg-transparent" value={maxVal} onChange={(e) => setMaxVal(e.target.value)} />
                                                <div className="absolute right-0 top-0 h-full flex flex-col border-l border-gray-200 w-4">
                                                    <button className="flex-1 hover:bg-gray-100 flex items-center justify-center" onClick={() => setMaxVal((p) => (parseFloat(p||'0') + 0.01).toFixed(2))}><CaretUpFill size={6}/></button>
                                                    <button className="flex-1 hover:bg-gray-100 flex items-center justify-center border-t" onClick={() => setMaxVal((p) => Math.max(0, parseFloat(p||'0') - 0.01).toFixed(2))}><CaretDownFill size={6}/></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-1">
                                        <button onClick={() => setActiveSubmenu('none')} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded border border-gray-200">Cancel</button>
                                        <button onClick={handleAISubmit} className="px-3 py-1.5 text-xs font-medium text-white bg-[#4aaada] hover:bg-[#3a9ad0] rounded flex items-center gap-1">
                                            <Check size={14}/> Save
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
};

export const getSDTargetingColumns = (
    onToggleStatus: (id: string, val: boolean) => void,
    onUpdateBid: BidUpdateHandler,
    onBulkAction: (action: string, ids: string[], value?: any) => void,
    currentSort: { key: string; direction: SortDirection },
    onSort: (key: string, direction: SortDirection) => void
): ColumnDef<UnifiedTargeting>[] => {

    return [
        { 
            key: 'select', 
            header: (context: TableContext<UnifiedTargeting>) => (
                <div className="flex items-center justify-center relative w-full h-full" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" checked={context.isAllSelected} ref={(input) => { if (input) input.indeterminate = context.isSomeSelected; }} onChange={context.toggleAll} />
                    {context.selectedIds.size > 0 && <TargetingBulkActionsMenu count={context.selectedIds.size} onAction={(a, v) => { onBulkAction(a, Array.from(context.selectedIds), v); context.resetSelection(); }} />}
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
            key: 'status', header: 'Status', width: '80px', sticky: 'left', stickyOffset: '50px', align: 'center',
            render: (row) => <CustomStatusCell isEnabled={row.enabled ?? false} isArchived={(row as any).status === 'Archived'} onToggle={(val) => onToggleStatus(row.id, val)} />
        },
        { 
            key: 'targeting', 
            header: () => (
                <ColumnSorter 
                    columnKey="targetingText" // The actual data key to sort by
                    label="Targeting"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ), 
            sticky: 'left', stickyOffset: '130px', width: '300px',
            render: (row) => (
                <div style={{ width: '300px' }}>
                    <EntityCell title={row.targetingText || '-'} badges={[<Badge key="type" variant="neutral">{row.targetType || 'Audience'}</Badge>]} />
                </div>
            )
        },
        { 
            key: 'adGroup', 
            header: () => (
                <ColumnSorter 
                    columnKey="adGroupName" 
                    label="Ad Groups"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ), 
            width: '200px',
            render: (row) => <div style={{ width: '200px' }}><EntityCell title={row.adGroupName || '-'} badges={[<Badge key="s" variant="neutral">{row.adGroupStatus || 'Enabled'}</Badge>]} /></div>
        },
        { 
            key: 'campaign', 
            header: () => (
                <ColumnSorter 
                    columnKey="campaignName" 
                    label="Campaigns"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ), 
            width: '280px',
            render: (row) => (
                <div style={{ width: '280px' }}>
                    <EntityCell title={row.campaignName || '-'} badges={[
                        <div key="store" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5"><img src={`https://flagcdn.com/w20/${row.flag || 'us'}.png`} className="w-3.5 h-2.5 rounded-[1px]"/><span className="text-[10px] text-gray-600">{row.storeName || 'Store'}</span></div>,
                        <Badge key="st" variant="neutral">{row.campaignStatus || 'Enabled'}</Badge>
                    ]} />
                </div>
            )
        },
        { 
            key: 'bids', header: 'Bids', width: '180px', align: 'center',
            render: (row) => (
                <BiddingCardCell 
                    currentBid={(row.bid ?? 0).toString()} 
                    minBid={row.minBid ?? null}
                    maxBid={row.maxBid ?? null}
                    onUpdateMainBid={(val) => onUpdateBid(row.id, 'bid', val)}
                    onUpdateMinMax={(min, max) => { onUpdateBid(row.id, 'minBid', min); onUpdateBid(row.id, 'maxBid', max); }}
                />
            )
        },
        // SD Metrics
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