'use client';
import React from 'react';
import { ExclamationTriangleFill, GearFill, CurrencyDollar } from "react-bootstrap-icons";
import { NumberStepper } from "../../ui/NumberStepper";

interface BudgetCellProps {
    value: string | number | null;
    onChange: (val: number ) => void;
    
    // --- Layout Flags ---
    isAuto?: boolean;        // Triggers the standard "Auto-Budgeting" badge
    isAiBidding?: boolean;   // Triggers the complex "AI-Bidding" box
    
    // --- Detailed Data ---
    maxBid?: number;         // Shows "Max Bid $X" row (only if isAiBidding is true)
    budgetType?: string;     // 'Daily' or 'Lifetime'
    spent?: number;          // Percentage (e.g. 64.23)
    spentAmount?: number;    // Dollar amount (e.g. 56.00)
    
    // --- Validation ---
    errorMessage?: string;   // Force a specific error message
}

export const BudgetCell = ({ 
    value, 
    onChange, 
    isAuto, 
    isAiBidding, 
    maxBid, 
    budgetType, 
    spent, 
    spentAmount,
    errorMessage 
}: BudgetCellProps) => {

    // 1. Error Logic: Treat 0, null, or empty as error unless custom message exists
    const numericVal = value ? parseFloat(value.toString()) : 0;
    const hasInternalError = !value || numericVal <= 0;
    const finalError = errorMessage || (hasInternalError ? "Invalid bid" : null);

    // 2. Determine Badge Label & Style based on props
    const showBadge = isAuto || isAiBidding;
    const badgeLabel = isAiBidding ? "AI-Bidding" : "Auto-Budgeting";
    
    // AI-Bidding gets a box (rounded-md), Auto-Budgeting gets a pill (rounded-full)
    const containerClass = isAiBidding 
        ? 'rounded-md border-[#4aaada]' 
        : 'rounded-full border-[#4aaada]';

    return (
        <div className="flex flex-col items-center gap-1.5 w-full py-1">
            
            {/* --- INPUT ROW --- */}
            <div className="w-[130px]">
                <NumberStepper 
                    value={value} 
                    onChange={onChange} 
                    prefix="$" 
                    step={1} 
                    size="md"
                    isError={!!finalError}
                />
            </div>

            {/* --- BADGE / BOX AREA --- */}
            {showBadge && (
                <div className={`
                    flex flex-col w-[130px] overflow-hidden border shadow-sm select-none transition-all bg-white
                    ${containerClass}
                `}>
                    {/* Header Row */}
                    <div className={`
                        px-2 py-1 flex items-center gap-1.5 text-[#0066b7] text-[11px] font-bold h-[22px]
                        ${(isAiBidding && maxBid !== undefined) ? 'bg-[#f0f9ff] border-b border-[#e2e2e2]' : 'bg-white justify-center'}
                    `}>
                        {/* Blue Icon Circle */}
                        <div className="w-3.5 h-3.5 rounded-full bg-[#4aaada] text-white flex items-center justify-center shrink-0">
                            <CurrencyDollar size={10} />
                        </div>
                        
                        <span className="truncate flex-1">{badgeLabel}</span>
                        
                        {/* Settings Gear (Only for AI-Bidding) */}
                        {isAiBidding && <GearFill className="text-[#4aaada]" size={10} />}
                    </div>

                    {/* Max Bid Footer (Only for AI-Bidding) */}
                    {isAiBidding && maxBid !== undefined && (
                        <div className="px-2 py-0.5 text-[10px] text-center text-gray-700 bg-white">
                            Max Bid ${maxBid.toFixed(2)}
                        </div>
                    )}
                </div>
            )}

            {/* --- SPENT DETAILS PILL --- */}
            {/* Shows if budgetType AND spent % are provided */}
            {budgetType && spent !== undefined && (
                <div className="flex items-center text-[10px] border border-gray-200 rounded-full bg-white overflow-hidden shadow-sm mt-0.5 max-w-[200px]">
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-600 font-semibold border-r border-gray-200">
                        {budgetType}
                    </span>
                    <span className="px-1.5 py-0.5 text-gray-500 font-medium border-r border-gray-100">
                        Spent
                    </span>
                    <div className="px-1.5 py-0.5 flex gap-1 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{spent}%</span>
                        {spentAmount && <span className="text-gray-400">${spentAmount.toFixed(0)}</span>}
                    </div>
                </div>
            )}

            {/* --- ERROR MESSAGE --- */}
            {finalError && (
                <div className="flex items-center gap-1 text-red-500 text-[10px] font-medium animate-in slide-in-from-top-1">
                    <ExclamationTriangleFill size={10} />
                    <span>{finalError}</span>
                </div>
            )}
        </div>
    );
};