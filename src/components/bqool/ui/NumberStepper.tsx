'use client';

import React from 'react';
import { CaretUpFill, CaretDownFill } from "react-bootstrap-icons";

interface NumberStepperProps {
  value: number | string | null;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string; // e.g., "$"
  suffix?: string; // e.g., "%"
  className?: string;
  isError?: boolean;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const NumberStepper = ({
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  prefix,
  suffix,
  className = "",
  isError = false,
  placeholder = "0",
  disabled = false,
  size = 'md'
}: NumberStepperProps) => {

  const handleIncrement = () => {
    if (disabled) return;
    const current = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    // Fix floating point errors (e.g. 0.1 + 0.2)
    const nextVal = parseFloat((current + step).toFixed(2));
    if (nextVal <= max) onChange(nextVal);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const current = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    const nextVal = parseFloat((current - step).toFixed(2));
    if (nextVal >= min) onChange(nextVal);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    if (val === '') {
      onChange(0); // Or handle empty state differently if needed
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) onChange(num);
  };

  // Styles based on state
  const heightClass = size === 'sm' ? 'h-[28px]' : 'h-[32px]';
  const bgClass = disabled ? 'bg-gray-50' : (isError ? 'bg-red-50' : 'bg-white');
  const borderClass = isError ? 'border-red-400' : 'border-gray-300';
  const textClass = disabled ? 'text-gray-400' : 'text-gray-900';
  const cursorClass = disabled ? 'cursor-not-allowed' : '';

  return (
    <div 
      className={`
        flex items-center bg-white border rounded overflow-hidden w-full transition-colors
        ${heightClass} ${bgClass} ${borderClass} ${cursorClass}
        ${className}
      `}
    >
      {/* Prefix (e.g. $) */}
      {prefix && <span className={`pl-2 text-xs select-none ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{prefix}</span>}

      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
            w-full px-2 text-sm outline-none bg-transparent 
            placeholder:text-gray-300 text-right
            appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${textClass} ${cursorClass}
        `}
      />

      {/* Suffix (e.g. %) */}
      {suffix && <span className={`pr-1 text-sm select-none ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{suffix}</span>}

      {/* Custom Stepper Buttons */}
      <div className={`flex flex-col border-l h-full shrink-0 ${borderClass}`}>
        <button 
            type="button"
            onClick={handleIncrement} 
            disabled={disabled}
            className={`
              px-1 h-[15px] flex items-center justify-center border-b transition-colors
              ${borderClass}
              ${disabled ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}
        `}
        >
            <CaretUpFill size={size === 'sm' ? 6 : 8} />
        </button>
        <button 
            type="button"
            onClick={handleDecrement}
            disabled={disabled} 
            className={`
              px-1 h-[16px] flex items-center justify-center transition-colors
              ${disabled ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}
            `}
        >
            <CaretDownFill size={size === 'sm' ? 6 : 8} />
        </button>
      </div>
    </div>
  );
};