import React from "react";
import { cn } from "@/utils/scriptoplay/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ className, label, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-zinc-300 text-xs font-medium uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none transition-all",
          "placeholder:text-zinc-600 focus:border-brand focus:ring-1 focus:ring-brand",
          className
        )}
        {...props}
      />
    </div>
  );
}
