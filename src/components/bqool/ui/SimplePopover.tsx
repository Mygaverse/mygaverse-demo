"use client";
import { useState, useRef, useEffect, ReactNode } from "react";

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  align?: "left" | "right";
  width?: string;
  isOpen?: boolean;            // If passed, parent controls visibility
  onOpenChange?: (open: boolean) => void; // Parent listens to changes
}

export function SimplePopover({ trigger, content, align = "left", width = "w-[300px]", isOpen: controlledOpen, onOpenChange }: PopoverProps) {

  // Internal state for uncontrolled mode (fallback)
  const [internalOpen, setInternalOpen] = useState(false);

  // Determine if we are using controlled or uncontrolled state
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (open: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const popoverRef = useRef<HTMLDivElement>(null);

  // Helper to update state (notifies parent if controlled, sets state if uncontrolled)
  const handleOpenChange = (newState: boolean) => {
    if (isControlled) {
      onOpenChange?.(newState);
    } else {
      setInternalOpen(newState);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        handleOpenChange(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isControlled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div 
          className={`absolute top-full mt-2 ${width} bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[9999] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}