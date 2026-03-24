"use client";
import { ReactNode } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { VersionTopBar } from './VersionTopBar';
import { BQoolPilotWidget } from '@/components/bqool/pilot/BQoolPilotWidget';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="bg-[#eff1f5] min-h-screen w-full">
      <VersionTopBar />

      {/*
        VersionTopBar is fixed at top-0 (h-40px).
        Topbar is fixed at top-40px (h-60px).
        Sidebar is fixed at top-100px.
      */}
      <Topbar />
      <Sidebar />

      {/* Main Content Area */}
      <div
        className="pt-[110px] pr-4 pb-4 min-h-screen transition-all duration-300 ease-in-out"
        style={{ paddingLeft: '72px' }} // 56px sidebar + 16px gap
      >
        {children}
      </div>

      <BQoolPilotWidget />
    </div>
  );
}