'use client';

import React from 'react';
import { ExclamationTriangleFill } from "react-bootstrap-icons";
import { NumberStepper } from "../../ui/NumberStepper";

interface AIBiddingCellProps {
  isEnabled: boolean;
  strategy: string; 
  targetAcos: number | null;
  onToggle: (val: boolean) => void;
  onStrategyChange: (val: string) => void;
  onAcosChange: (val: number) => void;
}

export const AIBiddingCell = ({
  isEnabled,
  strategy,
  targetAcos,
  onToggle,
  onStrategyChange,
  onAcosChange
}: AIBiddingCellProps) => {
  
  // Show stepper only if Enabled AND Manual
  const showStepper = isEnabled && strategy === 'Manual Target ACOS';

  // Validation: Only show error if enabled AND (value is null or 0)
  const isError = isEnabled && (targetAcos === null || targetAcos <= 0);

  // --- LOGIC CHANGE: Handle Toggle Click ---
  const handleToggleClick = () => {
    const newState = !isEnabled;
    onToggle(newState);

    // If we are enabling it, force the strategy to 'AI Optimized' (Auto Target ACOS)
    if (newState) {
        onStrategyChange('AI Optimized');
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-[280px]">
      
      {/* Row 1: Status Toggle & Dropdown */}
      <div className="flex items-center gap-2">
        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`
            flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors shrink-0
            ${isEnabled ? 'bg-[#4aaada] text-white pl-2 pr-1' : 'bg-gray-300 text-white pl-2 pr-1'}
          `}
        >
          <span className="mr-1">{isEnabled ? 'Enabled' : 'Paused'}</span>
          <div className={`w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-0' : 'translate-x-0'}`} />
        </button>

        {/* LOGIC: Dropdown is HIDDEN if Paused */}
        {isEnabled && (
            <div className="relative flex-1 animate-in fade-in duration-200">
                <select 
                    value={strategy}
                    onChange={(e) => onStrategyChange(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:border-[#4aaada]"
                >
                    <option value="Manual Target ACOS">Manual Target ACOS</option>
                    <option value="AI Optimized">Auto Target ACOS</option>
                </select>
            </div>
        )}
      </div>

      {/* Row 2: Stepper & Error */}
      {showStepper && (
          <div className="flex flex-col gap-1 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                  {/* Spacer */}
                  <div className="w-[70px] shrink-0" /> 
                  
                  {/* Stepper */}
                  <div className="w-[100px]">
                      <NumberStepper 
                          value={targetAcos}
                          onChange={onAcosChange}
                          suffix="%"
                          isError={isError}
                          placeholder="0"
                          min={0}
                          max={100}
                      />
                  </div>
              </div>

              {/* Error Message */}
              {isError && (
                  <div className="flex items-center gap-1 text-red-500 text-xs ml-[70px]">
                      <ExclamationTriangleFill size={10} />
                      <span>Target ACOS required</span>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};