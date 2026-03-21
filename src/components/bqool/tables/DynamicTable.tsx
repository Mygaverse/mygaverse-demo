'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { EmptyState } from "./EmptyState";

// 1. Define the Context we will pass to columns
export interface TableContext<T> {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  toggleRow: (id: string) => void;
  toggleAll: () => void;
  resetSelection: () => void;
  data: T[];
}

export interface ColumnDef<T> {
  key: string;
  // Header can now be a node OR a function receiving context
  header: React.ReactNode | ((context: TableContext<T>) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right' | null;
  stickyOffset?: string;
  // Render now receives the context as the second argument
  render?: (row: T, context: TableContext<T>) => React.ReactNode; 
  renderSummary?: (data: any) => React.ReactNode;
}

interface DynamicTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  summaryData?: any;
  emptyVariant?: 'blank' | 'cta' | 'no-results';
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  className?: string; 
}

export function DynamicTable<T extends { id: number | string }>({ 
  data, 
  columns,
  summaryData,
  emptyVariant = 'cta',
  emptyTitle = "No data available",
  emptyDescription,
  onEmptyAction,
  emptyActionLabel,
  className = '' 
}: DynamicTableProps<T>) {

  const isEmpty = data.length === 0;

  // --- SELECTION STATE MANAGEMENT ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection if data changes (optional, prevents selecting stale IDs)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => String(d.id))));
    }
  };

  const resetSelection = () => setSelectedIds(new Set());

  // The context object we pass to columns
  const tableContext: TableContext<T> = {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    toggleRow,
    toggleAll,
    resetSelection,
    data
  };

  return (
    <div className={`flex flex-col bg-white border-0 border-[#e2e2e2] rounded-md shadow-sm h-full w-full overflow-hidden ${className}`}>
      
      {/* Scrollable Area */}
      <div className="flex-1 overflow-auto relative w-full">
        <table className="w-full border-collapse" style={{ minWidth: '100%' }}>
          
          {/* Sticky Header */}
          <thead className="bg-[#F1F7FF] text-xs font-semibold text-gray-600 tracking-wider z-30 sticky top-0">
            <tr>
              {columns.map((col, colIndex) => {
                const isSticky = !!col.sticky;
                
                const style: React.CSSProperties = {
                    width: col.width,      
                    minWidth: col.width,   
                    ...(isSticky ? {       
                        left: col.stickyOffset, 
                        position: 'sticky', 
                        zIndex: 50 + (columns.length - colIndex),
                    } : {})
                };
                
                return (
                  <th 
                    key={col.key}
                    style={style}
                    className={`
                      ${isSticky ? 'bg-[#F1F7FF] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''} 
                      border-r border-[#e2e2e2] border-b p-4 
                      text-${col.align || 'left'} 
                      whitespace-nowrap
                    `}
                  >
                    {/* Check if header is function, otherwise render node */}
                    {typeof col.header === 'function' 
                      ? col.header(tableContext) 
                      : col.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e2e2e2]">
            {/* Empty State */}
            {isEmpty && (
                <tr>
                    <td colSpan={columns.length} className="p-0 border-none h-40">
                        <div className="sticky left-0 w-full">
                            <EmptyState 
                                variant={emptyVariant}
                                title={emptyTitle}
                                description={emptyDescription}
                                onAction={onEmptyAction}
                                actionLabel={emptyActionLabel}
                            />
                        </div>
                    </td>
                </tr>
            )}

            {/* Summary Row */}
            {!isEmpty && summaryData && (
              <tr className="bg-[#fafafa] font-medium text-gray-900 border-b border-[#e2e2e2]">
                {columns.map((col, colIndex) => {
                  const isSticky = !!col.sticky;
                  const style: React.CSSProperties = {
                      width: col.width,
                      minWidth: col.width,
                      ...(isSticky ? { 
                          left: col.stickyOffset, 
                          position: 'sticky', 
                          zIndex: 40 + (columns.length - colIndex),
                      } : {})
                  };

                  return (
                    <td 
                      key={`summary-${col.key}`}
                      style={style}
                      className={`
                        ${isSticky ? 'bg-[#fafafa] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''} 
                        border-r border-[#e2e2e2] py-3 px-4 
                        text-${col.align || 'left'} text-sm
                      `}
                    >
                      {col.renderSummary ? col.renderSummary(summaryData) : (summaryData[col.key] || '')}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Data Rows */}
            {!isEmpty && data.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-gray-50 group transition-colors">
                {columns.map((col, colIndex) => {
                    const isSticky = !!col.sticky;
                    const cellZIndex = 20  + (columns.length - colIndex);

                    const style: React.CSSProperties = {
                        width: col.width,
                        minWidth: col.width,
                        ...(isSticky ? { 
                            left: col.stickyOffset, 
                            position: 'sticky', 
                            zIndex: cellZIndex 
                        } : {})
                    };

                    return (
                        <td 
                            key={`${row.id}-${col.key}`}
                            style={style}
                            className={`
                                ${isSticky ? 'bg-white group-hover:bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''} 
                                border-r border-[#e2e2e2] py-3 px-4 
                                text-${col.align || 'left'} 
                                text-sm text-gray-700 align-top
                                whitespace-normal overflow-visible
                            `}
                        >
                            {/* Pass ROW and TABLECONTEXT */}
                            {col.render 
                              ? col.render(row, tableContext) 
                              : (row as any)[col.key]}
                        </td>
                    );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}