import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = {
    default: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-[#1a1a1a] text-gray-400 border-[#262626]',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase font-semibold tracking-wide border',
      styles[variant],
      className
    )}>
      {children}
    </span>
  );
}
