'use client';

import { useState } from 'react';
import { SidebarProvider } from '@/app/scriptoplay/context/SidebarContext';
import Sidebar from '@/components/scriptoplay/dashboard/layout/Sidebar';
import Topbar from '@/components/scriptoplay/dashboard/layout/Topbar';

const GlobalFooter = () => (
  <footer className="h-10 px-6 border-t border-[#262626] bg-[#0a0a0a] flex items-center justify-between text-[10px] text-zinc-500 shrink-0 z-30">
    <span>Version: 9.8.0</span>
    <span>Copyright © 2025 Scriptoplay. All rights reserved.</span>
  </footer>
);

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarProvider>
      {/* 1. VIEWPORT FRAME: Locked to screen size */}
      <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
        
        {/* Left Sidebar */}
        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

        {/* Main Column */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
          
          {/* Topbar (Fixed Top) */}
          <Topbar isCollapsed={isCollapsed} />

          {/* 2. DYNAMIC PAGE SLOT:
              flex-1: Takes all vertical space between Topbar and Footer.
              overflow-hidden: Prevents the page from breaking the shell layout.
              relative: Establishes a boundary for absolute children (like Right Panel).
          */}
          <main className="flex-1 w-full relative overflow-hidden flex flex-col">
            {children}
          </main>

          {/* Footer (Fixed Bottom) */}
          <GlobalFooter />
          
        </div>
      </div>
    </SidebarProvider>
  );
}