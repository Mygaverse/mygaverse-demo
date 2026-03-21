'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'react-bootstrap-icons';

interface SingleSelectProps {
  label?: string; // Made optional
  value: string;
  options: string[];
  onChange: (value: string) => void;
  width?: string;
  className?: string; // Styles for the outer container
  triggerClassName?: string; // Styles for the clickable button
  placeholder?: string;
  displayValue?: string; // Overrides the text shown in the button
  menuWidth?: string; // Controls the width of the dropdown list
  disabled?: boolean;
}

export const SingleSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  width = 'w-auto', 
  className = '',
  triggerClassName = '',
  placeholder,
  displayValue, // Destructure new prop
  menuWidth, // Destructure new prop
  disabled = false // Default to false
}: SingleSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Default trigger styles (can be overridden by triggerClassName)
  const baseTriggerStyles = "px-3 h-full flex items-center justify-between transition-colors";
  const stateStyles = disabled 
    ? "bg-[#e2e2e2] text-gray-400 cursor-not-allowed" 
    : "bg-white cursor-pointer hover:bg-gray-50 text-gray-800";
  // If no specific border class is passed in triggerClassName, add the default right border
  const defaultBorder = triggerClassName.includes('border') ? '' : 'border border-[#e2e2e2]';

  const handleToggle = () => {
      if (!disabled) {
          setIsOpen(!isOpen);
      }
  };

  return (
    <div 
        className={`relative h-full ${width} ${className}`} 
        ref={containerRef}
    >
      <div 
        onClick={handleToggle}
        className={`
            ${baseTriggerStyles}
            ${stateStyles}
            ${defaultBorder}
            ${!label ? 'py-0' : 'py-1'} 
            ${triggerClassName}
        `}
      >
        <div className="flex flex-col min-w-0 overflow-hidden">
          {/* Only render label if provided */}
          {label && (
             <span className="text-[10px] text-gray-400 leading-tight truncate">{label}</span>
          )}
          <span className={`text-[14px] text-gray-800 font-medium mt-1 leading-tight truncate ${!label ? 'text-[14px]' : ''}`}>
             { displayValue || value || placeholder}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-gray-600 ml-2 mt-2 shrink-0" />
      </div>

      {isOpen && !disabled && (
        <div 
            // Use menuWidth if provided, otherwise default to 'w-full' (matching trigger width)
            className={`
              absolute top-full left-0 mt-1 w-full bg-white border border-[#e2e2e2] rounded-md shadow-lg z-[200] max-h-[300px] overflow-y-auto
              ${menuWidth ? menuWidth : 'w-full'}
            `}
        >
          {options.map((opt) => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer truncate ${value === opt ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              title={opt}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};