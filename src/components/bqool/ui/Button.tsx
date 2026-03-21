'use client';

import React from 'react';

// Define the available styles
type ButtonVariant = 
  | 'primary'    // Solid Blue (Action: Add, Submit)
  | 'secondary'  // White + Gray Border (Functional: Preview, Columns)
  | 'secondaryIcon'  // for icon
  | 'branding'   // Dark Blue (Marketing: Learn)
  | 'outline'    // White + Blue Border (Alternative Action)
  | 'ghost'      // No background (Icon only triggers)
  | 'ghostOutline' // with outline for cancel and close buttons
  | 'danger';    // Red text (Delete)

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hideTextOnMobile?: boolean; // The responsive feature (md breakpoint)
  fullWidth?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'secondary', 
  size = 'md', 
  icon,
  rightIcon, 
  iconPosition = 'left',
  hideTextOnMobile = false,
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) => {

  // 1. Base Styles
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group";

  // 2. Variants (Color Schemes)
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#4aaada] text-white hover:bg-[#3a9aca] border border-transparent shadow-sm",
    secondary: "bg-white text-[#212529] border border-[#e2e2e2] hover:bg-[#4aaada] hover:text-white hover:border-[#4aaada] shadow-sm",
    secondaryIcon: "bg-white border border-[#e2e2e2] hover:bg-[#f1f7ff] hover:text-white hover:border-[#4aaada] shadow-sm",
    branding: "bg-[#0066b7] text-white hover:bg-[#0052a3] border border-transparent",
    outline: "bg-white text-[#4aaada] border border-[#4aaada] hover:bg-[#f1f7ff]",
    ghost: "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    ghostOutline: "bg-transparent text-gray-500 border border-[#e2e2e2] hover:text-gray-700 hover:bg-gray-100",
    danger: "bg-white text-red-500 border border-transparent hover:bg-red-50",
  };

  // ICON WRAPPER COLORS
  // This wrapper controls the SVG color via inheritance
  const iconWrapperColors: Record<ButtonVariant, string> = {
    primary: "text-white",
    secondary: "text-[#4aaada] group-hover:text-white transition-colors", 
    secondaryIcon: "text-[#4aaada]",
    branding: "text-white",
    outline: "text-[#4aaada]",
    ghostOutline: "text-current",
    ghost: "text-current",
    danger: "text-current",
  };

  // 3. Sizes
  const sizes: Record<ButtonSize, string> = {
    xs: "h-6 px-2 text-xs",
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-[48px] px-4 text-sm", // Default
    xl: "h-[48px] px-6 text-[14px]",
    icon: "h-[42px] w-[42px] p-0", // Fixed square
  };

  // 4. Responsive Logic
  // If hideTextOnMobile is true, we adjust padding on mobile to make it look like an icon button
  const responsiveStyles = hideTextOnMobile 
    ? "px-0 w-[42px] lg:w-auto lg:px-3 justify-center" 
    : "";

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${size === 'icon' ? sizes.icon : sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${responsiveStyles}
        ${className}
      `}
      {...props}
    >
      {/* Icon - Left */}
      {icon && iconPosition === 'left' && (
        <span className={`
          inline-flex items-center justify-center
          ${iconWrapperColors[variant]}
          ${children ? (hideTextOnMobile ? "mr-0 lg:mr-2" : "mr-2") : ""}
        `}>
          {icon}
        </span>
      )}

      {/* Text Content */}
      {children && (
        <span className={hideTextOnMobile ? "hidden lg:inline-block" : "inline-block"}>
          {children}
        </span>
      )}

      {/* Explicit Right Icon */}
      {rightIcon && (
        <span className={`
          inline-flex items-center justify-center
          ${iconWrapperColors[variant]}
          ${children ? (hideTextOnMobile ? "ml-0 lg:ml-2" : "ml-2") : ""}
        `}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};