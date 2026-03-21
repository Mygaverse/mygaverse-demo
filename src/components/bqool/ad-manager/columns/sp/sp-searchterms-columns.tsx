import React, { useState, useRef, useEffect } from 'react';
import { Files, LightningFill, Plus } from "react-bootstrap-icons";
import { Badge } from "@/components/bqool/ui/Badge";
import { DropdownButton } from "@/components/bqool/ui/DropdownButton"; // Ensure you have this or standard dropdown
import { ColumnDef } from "@/components/bqool/tables/DynamicTable";
import { EntityCell } from "@/components/bqool/tables/cells/EntityCell";
import { UnifiedSearchTerm } from "../../data/unifiedAdManagerData";
import { Portal } from '@/components/bqool/ui/Portal';
import { ColumnSorter, SortDirection } from "../../../ui/ColumnSorter";

// Helper to detect ASINs (Starts with B0, followed by alphanumeric)
const isASIN = (term: string) => {
    if (!term) return false;
    // Checks if it starts with 'B0' and has at least some numbers/letters following
    return term.toUpperCase().startsWith('B0') && term.length > 5;
};

// --- PORTAL DROPDOWN COMPONENT ---
interface ActionItem {
    label: string;
    onClick: () => void;
}

const ActionDropdown = ({ actions }: { actions: ActionItem[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position menu below the button, aligned to the left
            setCoords({ 
                top: rect.bottom + window.scrollY + 4, 
                left: rect.left + window.scrollX 
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('click', close);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => { 
            window.removeEventListener('click', close); 
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [isOpen]);

    return (
        <>
            {/* Trigger Button */}
            <button 
                ref={buttonRef}
                onClick={toggleOpen}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded shadow-sm transition-colors ${
                    isOpen ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
            >
                <Plus size={14} className="text-[#4aaada]" />
                <span>Add as</span>
            </button>

            {/* Portal Menu */}
            {isOpen && (
                <Portal>
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-75"
                        style={{ top: coords.top, left: coords.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => { action.onClick(); setIsOpen(false); }}
                                className="block w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </Portal>
            )}
        </>
    );
};

export const getSPSearchTermsColumns = (
    onAddAs: (id: string, action: string) => void,
    currentSort: { key: string; direction: SortDirection },
    onSort: (key: string, direction: SortDirection) => void
): ColumnDef<UnifiedSearchTerm>[] => {

    return [
        { 
            key: 'select', header: '',
            /*
            header: (context) => (
                <div className="flex justify-center" onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" checked={context.isAllSelected} onChange={context.toggleAll} />
                </div>
            ),
            */
            width: '50px', sticky: 'left', stickyOffset: '0px', align: 'center',
            render: (row, context) => (
                <div className="flex justify-center w-full" onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={context.selectedIds.has(row.id)} onChange={() => context.toggleRow(row.id)} className="w-4 h-4 rounded border-gray-300 text-[#4aaada] focus:ring-[#4aaada]" />
                </div>
            )
        },
        // --- Actions Column (Uses PortalDropdown) ---
        { 
            key: 'actions', header: 'Actions', width: '110px', sticky: 'left', stickyOffset: '50px', align: 'center',
            render: (row) => {
                const termIsAsin = isASIN(row.searchTerm);
                
                const actions = termIsAsin ? [
                    { label: "Add as Product Target", onClick: () => onAddAs(row.id, 'product') },
                    { label: "Add as Negative Product Target", onClick: () => onAddAs(row.id, 'neg-product') }
                ] : [
                    { label: "Add as Keyword Target", onClick: () => onAddAs(row.id, 'keyword') },
                    { label: "Add as Negative Keyword Target", onClick: () => onAddAs(row.id, 'neg-keyword') }
                ];

                return (
                    <div className="flex justify-center">
                        <ActionDropdown actions={actions} />
                    </div>
                );
            }
        },
        // --- Search Terms ---
        { 
            key: 'searchTerm', 
            header: () => (
                <ColumnSorter 
                    columnKey="searchTerm" // The actual data key to sort by
                    label="Search Terms"
                    currentSort={currentSort}
                    onSort={onSort}
                    type="text"
                />
            ),  
            sticky: 'left', stickyOffset: '160px', width: '280px',
            render: (row) => {
                const termIsAsin = isASIN(row.searchTerm);
                return (
                    <div className="flex items-start gap-2 group w-[280px]">
                        <span className={`text-sm font-medium leading-tight break-words flex-1 ${termIsAsin ? 'text-[#0066b7]' : 'text-gray-900'}`}>
                            {row.searchTerm}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(row.searchTerm)}>
                            <Files size={12} />
                        </button>
                    </div>
                );
            }
        },
        // --- Added As ---
        { 
            key: 'addedAs', header: 'Added as', width: '200px',
            render: (row) => (
                <div className="flex flex-col gap-1 items-start w-[200px]">
                    {(row.addedAsTypes || []).map((type, idx) => (
                        <div key={idx} className="px-2 py-0.5 rounded-full border text-[10px] bg-white border-gray-300 text-gray-600 whitespace-nowrap">{type}</div>
                    ))}
                    {row.isAutoHarvested && (
                        <div className="flex items-center gap-1 text-[10px] text-[#0066b7] bg-[#f0f9ff] border border-[#0066b7] rounded-full px-2 py-0.5 whitespace-nowrap">
                            <LightningFill size={8} /> Added by Auto-Harvesting
                        </div>
                    )}
                </div>
            )
        },
        // --- Targeting Context ---
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
            width: '260px',
            render: (row) => (
                <div style={{ width: '260px' }}>
                    <EntityCell title={row.targetingText || '-'} badges={[
                        <Badge key="m" variant="neutral">{row.targetingType || 'Broad'}</Badge>,
                        <span key="b" className="text-[10px] font-medium text-gray-900">Bid ${(row.targetingBid ?? 0).toFixed(2)}</span>,
                        <Badge key="s" variant={row.targetingStatus === 'Enabled' ? 'status-enabled' : 'neutral'}>{row.targetingStatus || 'Enabled'}</Badge>
                    ]} />
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
            width: '180px', 
            render: (row) => <div style={{width:'180px'}}><EntityCell title={row.adGroupName} badges={[<Badge key="s" variant="neutral">{row.adGroupStatus}</Badge>]} /></div> 
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
            width: '220px', 
            render: (row) => <div style={{width:'220px'}}><EntityCell title={row.campaignName} badges={[<div key="st" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5"><img src={`https://flagcdn.com/w20/${row.flag}.png`} className="w-3.5 h-2.5"/><span className="text-[10px] text-gray-600">{row.storeName}</span></div>, <Badge key="t" variant="neutral">SP</Badge>]} /></div> 
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