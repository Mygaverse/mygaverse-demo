import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export default function DashboardCard({ children, className, title, action }: DashboardCardProps) {
  return (
    <div className={cn("bg-[#111111] border border-white/5 rounded-2xl p-5", className)}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}