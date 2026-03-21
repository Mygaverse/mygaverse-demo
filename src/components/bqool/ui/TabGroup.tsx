'use client';

import React from 'react';
import { X } from 'react-bootstrap-icons';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  deletable?: boolean;
}

interface TabGroupProps {
  items: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  action?: React.ReactNode; // The Plus Button
  className?: string;
  
  // Layout Options
  variant?: 'scroll' | 'grid'; 
  gridSlots?: number; // E.g. 4 slots for Performance Chart
}

export const TabGroup = ({ 
  items, 
  activeId, 
  onSelect, 
  onDelete, 
  action, 
  className = '',
  variant = 'scroll',
  gridSlots = 0
}: TabGroupProps) => {

  // Logic for Grid Mode (filling empty slots)
  const renderGridSlots = () => {
    if (variant !== 'grid' || gridSlots <= items.length) return null;
    const emptyCount = gridSlots - items.length;
    
    return Array.from({ length: emptyCount }).map((_, i) => (
      <div 
        key={`empty-${i}`} 
        className="flex-1 bg-[#fafafa] border-r border-[#e2e2e2] last:border-r-0" 
      />
    ));
  };

  return (
    <div className={`flex items-center gap-3 w-full ${className}`}>
      
      {/* Tabs Container */}
      <div className="flex-1 flex items-center border border-[#e2e2e2] rounded-md overflow-hidden h-[42px] bg-white">
        
        {items.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`
                h-full text-sm text-center relative transition-colors font-medium border-r-0 border-[#e2e2e2] last:border-r-0 group
                flex items-center justify-center gap-2 px-4
                ${variant === 'grid' ? 'flex-1' : 'flex-none min-w-[120px]'} 
                ${isActive ? 'text-[#212529] bg-gray-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}
              `}
            >
              <span className="truncate">{tab.label}</span>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4aaada]" />
              )}

              {/* Delete Button (if deletable) */}
              {tab.deletable && onDelete && (
                <span 
                  onClick={(e) => { e.stopPropagation(); onDelete(tab.id); }}
                  className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </span>
              )}
            </button>
          );
        })}

        {/* Render Empty Slots (for Grid Layout) */}
        {renderGridSlots()}
        
        {/* Fill remaining space for Scroll Layout if needed */}
        {variant === 'scroll' && <div className="flex-1 bg-white" />}
      </div>

      {/* Action Button (The Plus Button) */}
      {action && (
        <div className="relative flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};