'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from "react-bootstrap-icons";

interface NameEditorPopoverProps {
  initialName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
  position: { top: number, left: number };
  title?: string; // Optional title (e.g., "Edit Goal Name")
  label?: string; // Optional input label (e.g., "Goal Name")
}

export const NameEditorPopover = ({ 
  initialName, 
  onSave, 
  onCancel,
  position,
  //title = "Edit Name",
  //label = "Name"
}: NameEditorPopoverProps) => {
  const [name, setName] = useState(initialName);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, []);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };
    // Slight delay to prevent immediate closing upon opening click
    setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 0);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name);
    }
  };

  // Handle Enter key to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') onCancel();
  };

  return (
    <div 
      ref={popoverRef}
      style={{ top: position.top, left: position.left }}
      // Fixed width matching the visual reference
      className="absolute z-[100] w-[320px] bg-white border border-[#e2e2e2] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 origin-top-left"
    >
      

      {/* Body */}
      <div className="p-4">
        <div className="flex flex-col gap-1.5">
           
           <input 
              ref={inputRef}
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#4aaada] focus:border-[#4aaada] transition-all shadow-sm"
           />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#e2e2e2] bg-gray-50 rounded-b-lg">
         <button 
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
         >
            Cancel
         </button>
         <button 
            onClick={handleSave}
            disabled={!name.trim() || name === initialName}
            className="px-3 py-1.5 text-sm font-medium text-white bg-[#4aaada] rounded-md hover:bg-[#3a9aca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
         >
            Save
         </button>
      </div>
    </div>
  );
};