"use client";
import { ReactNode } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="bg-[#eff1f5] min-h-screen w-full">
      <Topbar />
      {/* The Sidebar now manages its own active state via usePathname() */}
      <Sidebar /> 
      
      {/* Main Content Area */}
      <div 
        className="pt-[80px] pr-4 pb-4 min-h-screen transition-all duration-300 ease-in-out"
        style={{ paddingLeft: '72px' }} // 56px sidebar + 16px gap
      >
        {children}
      </div>
    </div>
  );
}