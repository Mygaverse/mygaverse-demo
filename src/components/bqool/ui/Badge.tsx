'use client';

import React from 'react';
import { LightningChargeFill, CurrencyDollar } from 'react-bootstrap-icons';

export type BadgeVariant =
  | 'status-enabled'
  | 'status-paused'
  | 'type' // Gray background (e.g. Basic, SP Manual)
  | 'flag' // Store flag
  | 'ai-bidding' // Blue outline + Dollar icon
  | 'auto-harvesting' // Blue outline + Lightning icon
  | 'keyword-type' // Gray outline (e.g. Phrase)
  | 'neutral'
  | 'blue' | 'red' | 'yellow' | 'green' | 'gray';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize; // New Prop
  children: React.ReactNode;
  className?: string;
  iconStr?: string; // For flag image URL
}

export const Badge = ({
  variant = 'neutral',
  size = 'md', // Default to medium
  children,
  className = '',
  iconStr
}: BadgeProps) => {

  // Base layout styles
  const baseStyles = "inline-flex items-center justify-center font-medium border whitespace-nowrap gap-1 transition-colors";

  // Size definitions
  const sizeStyles: Record<BadgeSize, string> = {
    'sm': "px-1.5 py-[1px] text-[10px]",
    'md': "px-2 py-0.5 text-[11px]",
    'lg': "px-2.5 py-1 text-[12px]",
  };

  // Variant styles (Removed fixed w-[100px] to allow size prop to work freely)
  const variants: Record<BadgeVariant, string> = {
    'status-enabled': "bg-white border-gray-200 text-gray-700 rounded-full",
    'status-paused': "bg-white border-gray-200 text-gray-500 rounded-full",
    'type': "bg-white border-gray-200 text-gray-700 rounded-full",
    'flag': "bg-white border-gray-200 text-gray-700 rounded-md",
    'ai-bidding': "bg-white border-[#4aaada] text-[#4aaada] rounded-full",
    'auto-harvesting': "bg-white border-[#4aaada] text-[#4aaada] rounded-full",
    'keyword-type': "bg-white border-gray-200 text-gray-600 rounded-full",
    'neutral': "bg-white border-gray-200 text-gray-500 rounded",

    // New Colors
    'blue': "bg-blue-50 border-blue-200 text-blue-700 rounded-full",
    'red': "bg-red-50 border-red-200 text-red-700 rounded-full",
    'yellow': "bg-yellow-50 border-yellow-200 text-yellow-700 rounded-full",
    'green': "bg-green-50 border-green-200 text-green-700 rounded-full",
    'gray': "bg-gray-50 border-gray-200 text-gray-600 rounded-full",
  };

  const getIconSize = () => {
    if (size === 'sm') return 10;
    if (size === 'lg') return 14;
    return 12;
  };

  const getIcon = () => {
    const iconSize = getIconSize();
    switch (variant) {
      case 'flag':
        return iconStr ? <img src={iconStr} alt="flag" className={`object-cover rounded-[1px] ${size === 'sm' ? 'w-3 h-2' : 'w-3.5 h-2.5'}`} /> : null;
      case 'ai-bidding':
        return <CurrencyDollar size={iconSize} />;
      case 'auto-harvesting':
        return <LightningChargeFill size={iconSize} />;
      default:
        return null;
    }
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}>
      {getIcon()}
      {children}
    </span>
  );
};