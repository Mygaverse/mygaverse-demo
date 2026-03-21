'use client';

import React from 'react';
import { ExclamationTriangleFill } from "react-bootstrap-icons";
import { NumberStepper } from "../../ui/NumberStepper";

interface BudgetCellProps {
  value: string | number | null;
  isAuto: boolean;
  onChange: (val: string) => void;
}

export const BudgetCell = ({ value, isAuto, onChange }: BudgetCellProps) => {
  // Logic: Treat empty string, null, or "0" as an error for a bid
  const numericVal = value ? parseFloat(value.toString()) : 0;
  const isError = !value || numericVal <= 0;

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      {/* 1. Stepper Input */}
      <NumberStepper 
        value={value}
        onChange={(val) => onChange(val.toString())}
        prefix="$"
        className="w-[100px]"
        min={0}
        step={0.5} // Typical bid increment
        isError={isError}
        placeholder="0.00"
      />

      {/* 2. Error Message (Only if error) */}
      {isError && (
        <div className="flex items-center gap-1 text-red-500 text-[12px] animate-in slide-in-from-top-1">
            <ExclamationTriangleFill size={10} />
            <span>Out of budget</span>
        </div>
      )}

      {/* 3. Auto-Budgeting Badge (Only show if TRUE) */}
      {isAuto && (
        <div className="text-[10px] px-2 py-0.5 rounded-full border border-[#0066b7] bg-[#f0f9ff] text-[#0066b7] flex items-center gap-1 cursor-pointer select-none">
           <div className="w-1.5 h-1.5 rounded-full bg-[#0066b7]" />
           Auto-Budgeting
        </div>
      )}
    </div>
  );
};