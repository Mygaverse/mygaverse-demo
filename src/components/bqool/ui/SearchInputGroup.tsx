'use client';

import React from 'react';
import { Search } from 'react-bootstrap-icons';
import { SingleSelect } from './SingleSelect';

interface SearchInputGroupProps {
  options: string[];
  selectedOption: string;
  onOptionChange: (val: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  // Callback for triggering the search action
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchInputGroup = ({
  options,
  selectedOption,
  onOptionChange,
  searchTerm,
  onSearchChange,
  onSearch,
  placeholder,
  className = ""
}: SearchInputGroupProps) => {

  // Extract the noun for the placeholder.
  // If selectedOption is "Search by Goals", this returns "Goals".
  // If placeholder prop is explicitly passed (e.g. from Tab init), we use that, cleaning it just in case.
  const cleanPlaceholder = (placeholder || selectedOption).replace('Search by ', '');

  // Handle Enter Key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div className={`flex items-center h-full ${className}`}>
        {/* The Dropdown part (No Label mode) */}
        <div className="h-full z-20 relative">
             <SingleSelect 
                // Value is the real selection ("Goals") so the list highlights correctly
                value={selectedOption}
                // Display is forced to "Search by" per requirements
                displayValue="Search by"
                options={options} 
                onChange={onOptionChange} 
                width="w-[110px]" 
                // Force menu to be wider than the button so text isn't cut off
                menuWidth="min-w-[240px]"
                // This class applies to the inner clickable div
                triggerClassName="rounded-l-md border border-[#e2e2e2] border-r-1 font-medium text-gray-600"
             />
        </div>

        {/* The Input part */}
        <div className="flex-1 flex items-center h-full relative z-10">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown} // Listen for Enter
                placeholder={cleanPlaceholder} 
                className="h-full w-full border border-[#e2e2e2] border-l-0 px-3 text-sm outline-none focus:border-[#4aaada] focus:ring-1 focus:ring-[#4aaada] transition-all rounded-none"
            />
        </div>

        {/* The Search Button */}
        <button 
            onClick={onSearch} // Trigger Search
            className="h-full w-[48px] bg-[#4aaada] rounded-r-md flex items-center justify-center hover:bg-[#3a9aca] text-white shrink-0 z-20">
            <Search size={18} />
        </button>
    </div>
  );
};