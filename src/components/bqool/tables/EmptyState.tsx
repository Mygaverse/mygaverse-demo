'use client';

import React from 'react';
import { Folder, Plus, PlusCircleFill } from "react-bootstrap-icons";

interface EmptyStateProps {
  variant?: 'blank' | 'cta' | 'no-results';
  title: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState = ({
  variant = 'cta',
  title,
  description,
  onAction,
  actionLabel
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white">
      {/* Icon Placeholder - Matches the folder icon in your image */}
      <div className="mb-4 bg-gray-50 p-4 rounded-full">
         <Folder size={48} className="text-gray-300" />
      </div>

      <h3 className="text-gray-900 font-medium text-base mb-1">{title}</h3>
      
      {description && (
        <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
          {description}
        </p>
      )}

      {/* Action Button (Only for 'cta' variant) */}
      {variant === 'cta' && onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 flex items-center gap-2 bg-[#4aaada] hover:bg-[#3a9aca] text-white px-4 py-3 rounded-md text-sm font-medium transition-colors"
        >
          <PlusCircleFill size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};