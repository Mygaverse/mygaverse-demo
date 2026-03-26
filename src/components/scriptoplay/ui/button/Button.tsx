import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/scriptoplay/cn";


export const buttonVariants = (variant = "primary", className = "") => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all...";
  const styles = {
    primary: "bg-brand text-white...",
    secondary: "bg-surface text-white...",
    // ...
  };
  return cn(base, styles[variant as keyof typeof styles], className);
};

// ... existing Button component ...

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ 
  children, 
  className, 
  variant = "primary", 
  isLoading = false, 
  icon,
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand hover:bg-brand-hover text-white shadow-lg shadow-brand/20 active:scale-[0.98]",
    secondary: "bg-surface border border-border hover:bg-zinc-900 text-white",
    outline: "border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
  };

  const sizes = "h-11 px-8 text-sm"; // Default sizing

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes, className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}