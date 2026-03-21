'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'react-bootstrap-icons';

interface Option {
  id: string;
  label: string;
  parentId?: string; // For nesting (e.g. "Campaign Enabled" is child of "All Campaign Status")
}

interface MultipleSelectorProps {
  label?: string;
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  width?: string;
  className?: string;
}

export const MultipleSelector = ({ 
  label, 
  options, 
  selectedIds, 
  onChange, 
  width = 'w-auto', 
  className = '' 
}: MultipleSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Internal state for "pending" selection before applying
  const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTempSelected(selectedIds); // Reset on cancel
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedIds]);

  const toggleSelection = (id: string) => {
    // Basic logic: Toggle ID. 
    // (Complex parent/child logic can be added here if strictly required, simplified for UI demo)
    if (tempSelected.includes(id)) {
      setTempSelected(prev => prev.filter(i => i !== id));
    } else {
      setTempSelected(prev => [...prev, id]);
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const displayValue = tempSelected.length === options.length ? 'All' : `${tempSelected.length} Selected`;

  return (
    <div className={`relative h-full ${width} ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white px-3 py-2 h-full flex items-center justify-between cursor-pointer hover:bg-gray-50 border border-[#e2e2e2] rounded-md"
      >
        <div className="flex flex-col min-w-0">
          {label && <span className="text-[10px] text-gray-400 uppercase leading-tight truncate">{label}</span>}
          <span className="text-sm text-gray-900 font-medium leading-tight truncate">{displayValue}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-[#e2e2e2] rounded-md shadow-xl z-[200] flex flex-col">
          {/* Options List */}
          <div className="p-2 max-h-[250px] overflow-y-auto space-y-1">
            {options.map((opt) => {
                const isSelected = tempSelected.includes(opt.id);
                return (
                    <div 
                        key={opt.id}
                        onClick={() => toggleSelection(opt.id)}
                        className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-gray-50 ${opt.parentId ? 'ml-4' : 'font-medium'}`}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <Check className="text-white w-3 h-3" />}
                        </div>
                        <span className="text-sm text-gray-700">{opt.label}</span>
                    </div>
                );
            })}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-[#e2e2e2] flex items-center justify-between bg-gray-50 rounded-b-md">
            <button 
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
                Close
            </button>
            <button 
                onClick={handleApply}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#4aaada] rounded hover:bg-[#3a9aca]"
            >
                Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};