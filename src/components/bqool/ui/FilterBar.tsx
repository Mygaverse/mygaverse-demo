'use client';

import React from 'react';
import { X } from "react-bootstrap-icons";

export interface FilterItem {
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  filters: FilterItem[];
  onReset: () => void;
  className?: string;
}

export const FilterBar = ({ filters, onReset, className='' }: FilterBarProps) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center bg-white border border-[#e2e2e2] rounded-md h-[48px] px-2 shadow-sm mb-4 ${className}`}">
      <div className="px-4 py-2 border-r border-[#e2e2e2] text-sm font-medium text-gray-700 mr-2">
        Filters
      </div>
      <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
        {filters.map((item, i) => (
          <div key={i} className="bg-[#eff1f5] flex items-center px-2 py-1.5 rounded text-xs text-gray-600 border border-transparent hover:border-gray-300 transition-all whitespace-nowrap">
            {item.label}
            <button onClick={item.onRemove} className="ml-2 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button 
        onClick={onReset} 
        className="px-4 py-2 border-l border-[#e2e2e2] text-sm text-gray-500 hover:text-[#4aaada] transition-colors whitespace-nowrap"
      >
        Reset Filters
      </button>
    </div>
  );
};