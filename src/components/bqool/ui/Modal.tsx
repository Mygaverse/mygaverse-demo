'use client';

import React, { useEffect, useRef } from 'react';
import { X } from "react-bootstrap-icons";
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string; // Optional width class (e.g., 'max-w-2xl')
  headerStyle?: 'default' | 'branding';
}

export const Modal = ({ isOpen, onClose, title, children, width = 'max-w-3xl', headerStyle = 'default' }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close on click outside content area
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Header Styles
  const isBranding = headerStyle === 'branding';
  const headerBg = isBranding ? 'bg-[#4aaada]' : 'bg-white border-b border-gray-200';
  const titleColor = isBranding ? 'text-white' : 'text-gray-900';
  const closeBtnColor = isBranding ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100';

  // Use createPortal to render outside the parent DOM hierarchy
  // Ensure have a <div id="modal-root"></div> in layout.tsx or index.html
  // If not using portal, remove createPortal wrap and render directly.
  // For current settting, render directly assuming z-index handles stacking.

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${width} max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-t-md shrink-0 ${headerBg}`}>
          <h2 className={`text-base font-bold ${titleColor}`}>{title}</h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${closeBtnColor}`}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};