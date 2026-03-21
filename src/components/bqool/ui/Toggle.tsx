'use client';
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Toggle = ({ checked, onChange, className = '', disabled = false }: ToggleProps) => {
  return (
    <button
      type="button"
      onClick={(e) => { 
          e.stopPropagation(); 
          if(!disabled) onChange(!checked); 
      }}
      disabled={disabled}
      className={`
        w-[32px] h-[16px] rounded-full relative transition-colors duration-200 focus:outline-none shrink-0
        ${checked ? "bg-[#4aaada]" : "bg-[#e2e2e2]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <div 
        className={`
            absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full transition-transform duration-200 shadow-sm
            ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}
        `} 
      />
    </button>
  );
};