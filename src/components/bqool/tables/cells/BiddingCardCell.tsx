'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GearFill, CurrencyDollar } from "react-bootstrap-icons";
import { BudgetCell } from "./BudgetCell"; // Ensure path is correct
import { BiddingControlPopover } from "../../ui/BiddingControlPopover"; // Ensure path is correct

interface BiddingCardCellProps {
  currentBid: string;
  minBid: number | null;
  maxBid: number | null;
  onUpdateMainBid: (val: number) => void;
  onUpdateMinMax: (min: number | null, max: number | null) => void;
}

export const BiddingCardCell = ({ 
  currentBid, 
  minBid, 
  maxBid, 
  onUpdateMainBid, 
  onUpdateMinMax 
}: BiddingCardCellProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPopoverOpen]);

  // Logic: Are there any limits set?
  const hasLimits = minBid !== null || maxBid !== null;

  return (
    <div className="flex flex-col gap-2 w-[160px] relative">
      {/* 1. Main Bid Input */}
      <BudgetCell 
        value={currentBid} 
        isAuto={false} 
        onChange={onUpdateMainBid} 
      />

      {/* 2. AI-Bidding Card */}
      <div className={`border border-[#4aaada] bg-white rounded overflow-hidden shadow-sm ${!hasLimits ? 'rounded-b-md' : ''}`}>
        
        {/* Card Header */}
        <div className={`bg-[#f0f9ff] px-2 py-1 flex items-center justify-between ${hasLimits ? 'border-b border-[#e2e2e2]' : ''}`}>
           <div className="flex items-center gap-1">
             <div className="w-4 h-4 rounded-full bg-[#4aaada] flex items-center justify-center">
                <CurrencyDollar className="text-white w-3 h-3" />
             </div>
             <span className="text-[11px] font-medium text-gray-700">AI-Bidding</span>
           </div>
           
           {/* Gear Trigger */}
           <button 
             onClick={(e) => { e.stopPropagation(); setIsPopoverOpen(!isPopoverOpen); }}
             className="text-[#4aaada] hover:text-[#3a9aca] transition-colors"
           >
             <GearFill size={12} />
           </button>
        </div>

        {/* Card Body - ONLY RENDER IF LIMITS EXIST */}
        {hasLimits && (
            <div className="px-2 py-1.5 flex flex-col gap-0.5 text-[11px] text-gray-600 bg-white">
               {minBid !== null && (
                   <div className="flex justify-between">
                      <span>Min Bid</span>
                      <span className="font-medium text-gray-900">${minBid.toFixed(2)}</span>
                   </div>
               )}
               {maxBid !== null && (
                   <div className="flex justify-between">
                      <span>Max Bid</span>
                      <span className="font-medium text-gray-900">${maxBid.toFixed(2)}</span>
                   </div>
               )}
            </div>
        )}
      </div>

      {/* 3. Popover */}
      {isPopoverOpen && (
        <div ref={popoverRef} className="absolute top-[calc(100%+4px)] right-0 z-[100]">
           <BiddingControlPopover 
              initialMinBid={minBid}
              initialMaxBid={maxBid}
              onSave={(newMin, newMax) => {
                 onUpdateMinMax(newMin, newMax);
                 setIsPopoverOpen(false);
              }}
              onCancel={() => setIsPopoverOpen(false)}
           />
        </div>
      )}
    </div>
  );
};