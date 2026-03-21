'use client';

import React, { useState } from 'react';
import { ExclamationTriangleFill } from "react-bootstrap-icons";
import { NumberStepper } from "./NumberStepper";

interface BiddingControlPopoverProps {
  initialMinBid: number | null;
  initialMaxBid: number | null;
  onSave: (min: number | null, max: number | null) => void;
  onCancel: () => void;
}

export const BiddingControlPopover = ({ 
  initialMinBid, 
  initialMaxBid, 
  onSave, 
  onCancel 
}: BiddingControlPopoverProps) => {
  
  const [enableMin, setEnableMin] = useState(initialMinBid !== null);
  const [minBid, setMinBid] = useState<string | number | null>(initialMinBid);
  
  const [enableMax, setEnableMax] = useState(initialMaxBid !== null);
  const [maxBid, setMaxBid] = useState<string | number | null>(initialMaxBid);

  // Validation Logic
  const isMinInvalid = enableMin && (!minBid || Number(minBid) <= 0);
  const isMaxInvalid = enableMax && (!maxBid || Number(maxBid) <= 0);
  const isValid = !isMinInvalid && !isMaxInvalid;

  const handleSave = () => {
    if (isValid) {
      onSave(
        enableMin ? Number(minBid) : null,
        enableMax ? Number(maxBid) : null
      );
    }
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-md shadow-xl p-4 w-[300px] z-[200]">
      <div className="flex flex-col gap-4">
        
        {/* Min Bid Row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               {/* Custom Toggle */}
               <button 
                  onClick={() => setEnableMin(!enableMin)}
                  className={`w-9 h-5 rounded-full flex items-center transition-colors p-1 ${enableMin ? 'bg-[#4aaada]' : 'bg-gray-300'}`}
               >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform ${enableMin ? 'translate-x-4' : 'translate-x-0'}`} />
               </button>
               <span className="text-sm font-medium text-gray-700">Set Min Bid</span>
            </div>
            
            <div className="w-[100px]">
                <NumberStepper 
                   value={minBid} 
                   onChange={(val) => setMinBid(val)} 
                   prefix="$" 
                   className={!enableMin ? 'opacity-50 pointer-events-none' : ''}
                   isError={isMinInvalid}
                   step={0.01}
                />
            </div>
          </div>
          {isMinInvalid && (
             <div className="flex items-center justify-end gap-1 text-red-500 text-xs">
                <ExclamationTriangleFill size={10} /> <span>Invalid bid</span>
             </div>
          )}
        </div>

        {/* Max Bid Row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setEnableMax(!enableMax)}
                  className={`w-9 h-5 rounded-full flex items-center transition-colors p-1 ${enableMax ? 'bg-[#4aaada]' : 'bg-gray-300'}`}
               >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform ${enableMax ? 'translate-x-4' : 'translate-x-0'}`} />
               </button>
               <span className="text-sm font-medium text-gray-700">Set Max Bid</span>
            </div>
            
            <div className="w-[100px]">
                <NumberStepper 
                   value={maxBid} 
                   onChange={(val) => setMaxBid(val)} 
                   prefix="$" 
                   className={!enableMax ? 'opacity-50 pointer-events-none' : ''}
                   isError={isMaxInvalid}
                   step={0.01}
                />
            </div>
          </div>
          {isMaxInvalid && (
             <div className="flex items-center justify-end gap-1 text-red-500 text-xs">
                <ExclamationTriangleFill size={10} /> <span>Bid required</span>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e2e2e2] mt-1">
            <button 
                onClick={onCancel}
                className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
            >
                ✕ Cancel
            </button>
            <button 
                onClick={handleSave}
                disabled={!isValid}
                className="px-4 py-1.5 text-sm bg-[#4aaada] hover:bg-[#3a9aca] text-white rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                ✓ Save
            </button>
        </div>

      </div>
    </div>
  );
};