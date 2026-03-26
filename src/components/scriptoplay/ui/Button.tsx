import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import Icon from './Icon';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  isLoading?: boolean;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  ...props
}: ButtonProps) {

  const variants = {
    branding: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-600/20 border-transparent',
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-sm font-bold text-white transition-all shadow-lg shadow-purple-600/30',
    secondary: 'bg-[#1a1a1a] hover:bg-[#262626] text-white border border-[#262626]',
    outline: 'bg-transparent border border-[#262626] text-gray-300 hover:text-white hover:border-gray-500',
    ghost: 'bg-transparent hover:bg-[#1a1a1a] text-gray-400 hover:text-white',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : icon ? (
        <Icon icon={icon} size={size === 'sm' ? 14 : 18} />
      ) : null}
      {children}
    </button>
  );
}
