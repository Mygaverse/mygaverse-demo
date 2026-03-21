'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from "react-bootstrap-icons";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20]
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Dropdown visibility state (simplified for this demo, usually handled by a Select component)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4 border-t border-[#e2e2e2] flex items-center justify-between bg-white text-sm text-gray-600 shrink-0 z-[100] relative">
      
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span>Display</span>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="border border-[#e2e2e2] rounded px-2 py-1 flex items-center gap-1 bg-white hover:bg-gray-50 min-w-[50px] justify-between"
          >
            {pageSize} <ChevronDown size={12} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-[#e2e2e2] rounded shadow-lg z-50">
              {pageSizeOptions.map(size => (
                <div 
                  key={size}
                  onClick={() => { onPageSizeChange(size); setIsDropdownOpen(false); }}
                  className={`px-2 py-1 hover:bg-gray-50 cursor-pointer ${size === pageSize ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Info & Navigation */}
      <div className="flex items-center gap-4">
        <span>
          {startItem}-{endItem} of {totalItems} Results
        </span>
        
        {/* Page Input (Optional Jump to Page) */}
        <div className="flex items-center gap-2">
          <span>Page</span>
          <input 
            type="number" 
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= totalPages) onPageChange(val);
            }}
            className="w-[50px] text-center border border-[#e2e2e2] rounded py-1 outline-none focus:border-[#4aaada]" 
          />
          <span>of {totalPages}</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-1">
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 border border-[#e2e2e2] rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-[#e2e2e2] rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};