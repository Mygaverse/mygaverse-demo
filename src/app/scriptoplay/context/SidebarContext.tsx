'use client';

import React, { createContext, useContext, useState } from 'react';
import { SidebarSection } from '@/types/scriptoplay/interface/sidebar';
import { INITIAL_SIDEBAR_DATA } from '@/config/scriptoplay/sidebar-data';

interface SidebarContextType {
  sections: SidebarSection[];
  expandedMenus: string[];
  toggleMenu: (menuId: string) => void;
  // Future proofing:
  addSection: (section: SidebarSection) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<SidebarSection[]>(INITIAL_SIDEBAR_DATA);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const addSection = (section: SidebarSection) => {
    setSections(prev => [...prev, section]);
  };

  return (
    <SidebarContext.Provider value={{ sections, expandedMenus, toggleMenu, addSection }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};
