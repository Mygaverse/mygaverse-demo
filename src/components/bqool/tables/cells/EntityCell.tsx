'use client';
import React from 'react';

interface EntityCellProps {
  title: string;
  subTitle?: string; // Optional ID or SKU
  badges?: React.ReactNode[]; // Flexible array of badges
  onClick?: () => void;
  className?: string;
}

export const EntityCell = ({ title, subTitle, badges = [], onClick }: EntityCellProps) => (
  <div className="flex flex-col gap-1.5 ${className}`}">
    <div 
      onClick={onClick}
      className="text-sm text-[#0066b7] font-medium hover:underline block text-left leading-tight cursor-pointer line-clamp-2 break-words" 
      title={title}
    >
      {title}
    </div>
    
    {/* Flexible Badge Row */}
    {badges.length > 0 && (
      <div className="flex items-center gap-2 flex-wrap">
        {badges.map((badge, index) => (
          <div key={index}>{badge}</div>
        ))}
      </div>
    )}
    
    {/* Optional Subtitle */}
    {subTitle && (
      <div className="text-xs text-gray-400 truncate">{subTitle}</div>
    )}
  </div>
);