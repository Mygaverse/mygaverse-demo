import React, { useState, useRef, useEffect } from 'react';
import { GearFill, CaretRightFill, Check, X, ChevronDown, InfoCircleFill } from "react-bootstrap-icons";
import { Badge } from "../../../ui/Badge";
import { Portal } from "../../../ui/Portal"; 
import { Toggle } from "../../../ui/Toggle";
import { ColumnDef, TableContext } from "../../../tables/DynamicTable";
import { EntityCell } from "../../../tables/cells/EntityCell";
import { ProductInfoCell } from "../../../tables/cells/ProductInfoCell";
import { UnifiedProductAd } from "../../data/unifiedAdManagerData";
import { ColumnSorter, SortDirection } from "../../../ui/ColumnSorter";

// --- CUSTOM STATUS CELL ---
interface CustomStatusCellProps {
    isEnabled: boolean;
    onToggle: (newVal: boolean) => void;
    isArchived?: boolean; 
}
const CustomStatusCell = ({ isEnabled, onToggle, isArchived }: CustomStatusCellProps) => (
    <div className="flex flex-col items-center gap-2 relative group" onClick={(e) => e.stopPropagation()}>
        {isArchived ? (
            <div className="relative flex items-center justify-center cursor-not-allowed opacity-50">
                <Toggle checked={false} onChange={() => {}} disabled={true} />
                <div className="absolute -right-5 top-0 text-gray-400"><InfoCircleFill size={12} /></div>
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">Archived</div>
            </div>
        ) : (
            <Toggle checked={isEnabled} onChange={onToggle} />
        )}
    </div>
);

// --- FLOATING BULK ACTIONS MENU ---
interface BulkActionsMenuProps {
    count: number;
    onAction: (action: string, value?: any) => void;
}
const BulkActionsMenu = ({ count, onAction }: BulkActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            // Calculate position dynamically
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ 
                // Position slightly below and to the right of the button
                top: rect.bottom + window.scrollY + 4, 
                left: rect.left + window.scrollX 
            });
        }
        setIsOpen(!isOpen);
    };

    // Close on scroll/resize to keep position accurate
    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('scroll', close, true); 
        window.addEventListener('resize', close); 
        window.addEventListener('click', close);
        return () => { 
            window.removeEventListener('scroll', close, true); 
            window.removeEventListener('resize', close); 
            window.removeEventListener('click', close); 
        };
    }, [isOpen]);

    return (
        <>
            {/* The Trigger Button inside the Table Header */}
            <div className="absolute left-[30px] top-[-5px] z-[50]" onClick={(e) => e.stopPropagation()}>
                <button 
                    ref={buttonRef}
                    onClick={toggleOpen} 
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#4aaada] border border-[#3a9aca] rounded shadow-lg hover:bg-[#3a9aca] transition-all whitespace-nowrap"
                >
                    <span>Bulk Actions({count})</span>
                    <ChevronDown size={10} />
                </button>
            </div>

            {/* The Menu rendered outside the table via Portal */}
            {isOpen && (
                <Portal>
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl py-1 w-40 animate-in fade-in zoom-in-95 duration-75"
                        style={{ top: coords.top, left: coords.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => { onAction('enable'); setIsOpen(false); }} className="block w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left">Enable Selected</button>
                        <button onClick={() => { onAction('pause'); setIsOpen(false); }} className="block w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left">Pause Selected</button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button onClick={() => { onAction('archive'); setIsOpen(false); }} className="block w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left">Archive Selected</button>
                    </div>
                </Portal>
            )}
        </>
    );
};

export const getSDProductAdsColumns = (
    onToggleStatus: (id: string, val: boolean) => void,
    onBulkAction: (action: string, ids: string[], value?: any) => void,
    currentSort: { key: string; direction: SortDirection },
    onSort: (key: string, direction: SortDirection) => void 
): ColumnDef<UnifiedProductAd>[] => {

    
   return [
        { 
            key: 'select', 
            // 1. FLOATING MENU LOGIC MOVED HERE
            header: (context: TableContext<UnifiedProductAd>) => (
                <div className="flex items-center justify-center relative w-full h-full" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" 
                        checked={context.isAllSelected} 
                        ref={(input) => { if (input) input.indeterminate = context.isSomeSelected; }} 
                        onChange={context.toggleAll} 
                    />
                    {/* Render Floating Menu if items are selected */}
                    {context.selectedIds.size > 0 && (
                        <BulkActionsMenu 
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
            key: 'status', header: 'Status', width: '80px', sticky: 'left', stickyOffset: '50px', align: 'center',
            render: (row) => <CustomStatusCell isEnabled={row.enabled ?? false} isArchived={(row as any).status === 'Archived'} onToggle={(val) => onToggleStatus(row.id, val)} />
        },
        { 
            key: 'product', 
            header: () => (
                <ColumnSorter
                    columnKey="productName"
                    label="Product Ads"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ), 
            sticky: 'left', stickyOffset: '130px', width: '380px',
            render: (row) => (
                <div style={{ width: '380px' }}>
                    <ProductInfoCell 
                        imageSrc={row.productImage || ''}
                        title={row.productName || 'Unknown Product'}
                        asin={row.asin || '-'}
                        sku={row.sku || '-'}
                    />
                </div>
            ),
            renderSummary: (data) => <span className="font-bold text-gray-900 ml-1">{data?.name || 'Total'}</span>
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
            render: (row) => (
                <div style={{ width: '200px' }}>
                    <EntityCell 
                        title={row.adGroupName || '-'} 
                        badges={[
                            // Use the data field 'adGroupStatus' instead of hardcoded 'Enabled'
                            <Badge key="st" variant="neutral">{row.adGroupStatus || 'Enabled'}</Badge>
                        ]} 
                    />
                </div>
            )
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
                        <div key="store" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5"><img src={`https://flagcdn.com/w20/${row.flag || 'us'}.png`} className="w-3.5 h-2.5 rounded-[1px]"/><span className="text-[10px] text-gray-600">{row.storeName}</span></div>,
                        <Badge key="type" variant="neutral" size="sm">SP</Badge>,
                        <Badge key="st" variant="neutral" size="sm">{row.campaignStatus || 'Enabled'}</Badge>
                    ]} />
                </div>
            )
        },
        

        // Metrics
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