'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, ButtonProps } from './Button'; // Reusing your existing Button
import { CaretDownFill } from "react-bootstrap-icons";

interface ActionItem {
  label: string;
  onClick: () => void;
}

interface DropdownButtonProps extends Omit<ButtonProps, 'onClick'> {
  actions: ActionItem[];
  width?: string; // Optional prop to control width manually
}

export const DropdownButton = ({ 
  children, 
  actions, 
  variant = 'primary', // Default to blue primary style
  width = 'w-auto', // Default to auto width
  className = '',
  ...props 
}: DropdownButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${width} shrink-0`} ref={containerRef}>
      {/* 1. Trigger Button: Reuses your Button UI but adds toggle logic */}
      <Button 
         variant={variant} 
         {...props}
         onClick={() => setIsOpen(!isOpen)}
         className={`flex-nowrap w-full ${className}`} // Add padding for arrow
      >
        <div className="flex items-center gap-2 whitespace-nowrap">
           <span>{children}</span>
           <CaretDownFill size={10} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      {/* 2. Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[230px] bg-white border border-[#e2e2e2] rounded-md shadow-xl z-[200] py-0 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0066b7] transition-colors border-b border-transparent last:border-0"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};