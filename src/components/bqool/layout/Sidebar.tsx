"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PieChartFill, 
  GridFill, 
  ArchiveFill, 
  Easel2Fill, 
  Clipboard2PulseFill, 
  ClipboardDataFill, 
  ChevronDown, 
  ChevronUp 
} from 'react-bootstrap-icons';

export function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdvertisingOpen, setIsAdvertisingOpen] = useState(true);

  // Menu Configuration with Routes
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: PieChartFill,
      hasSubmenu: false,
      href: '/bqool' 
    },
    { 
      id: 'advertising', 
      label: 'Advertising', 
      icon: GridFill,
      hasSubmenu: true,
      // Parent doesn't need an href, it toggles
      submenu: [
        { id: 'ad-manager', label: 'Ad Manager', icon: ArchiveFill, href: '/bqool/ad-manager' },
        { id: 'budget-manager', label: 'Budget Manager', icon: Easel2Fill, href: '/bqool/budget-manager' },
        { id: 'campaign-builder', label: 'Campaign Builder', icon: Clipboard2PulseFill, href: '/bqool/campaign-builder' },
        { id: 'ad-history', label: 'Ad History', icon: ClipboardDataFill, href: '/bqool/ad-history' },
      ]
    },
  ];

  // Helper to check if a specific path is active
  const isRouteActive = (href: string) => pathname === href;

  return (
    <div
      id="tour-sidebar"
      className={`bg-[#0066b7] h-[calc(100vh-100px)] flex flex-col pt-0 shadow-lg fixed left-0 top-[100px] z-[999] overflow-hidden transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[224px]' : 'w-[56px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        
        // Check if this item (or any of its children) is active
        let isActive = false;
        if (item.hasSubmenu && item.submenu) {
             // Parent is active if any child matches the current route
             isActive = item.submenu.some(sub => isRouteActive(sub.href));
        } else if (item.href) {
             isActive = isRouteActive(item.href);
        }

        return (
          <div key={item.id}>
            {/* Main Menu Item */}
            {item.hasSubmenu ? (
                // If it has a submenu, it's a Toggle Button
                <button
                  onClick={() => setIsAdvertisingOpen(!isAdvertisingOpen)}
                  className={`flex items-center h-[48px] gap-3 mb-1 transition-all w-full cursor-pointer relative
                    ${isActive ? 'bg-[#4aaada] text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}
                    ${isHovered ? 'px-5' : 'px-0 justify-center'}
                  `}
                >
                  <div className="shrink-0">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  
                  {isHovered && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden">{item.label}</span>
                      <div className="ml-auto">
                        {isAdvertisingOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </>
                  )}
                </button>
            ) : (
                // If no submenu (Dashboard), it's a Direct Link
                <Link
                  href={item.href || '#'}
                  className={`flex items-center h-[48px] gap-3 mb-1 transition-all w-full cursor-pointer relative
                    ${isActive ? 'bg-[#4aaada] text-white' : 'text-white/90 hover:bg-white/10 hover:text-white w-full'}
                    ${isHovered ? 'px-5' : 'px-0 justify-center'}
                  `}
                >
                  <div className="shrink-0">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  
                  {isHovered && (
                     <span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                </Link>
            )}

            {/* Submenu Items */}
            {item.hasSubmenu && isAdvertisingOpen && isHovered && item.submenu && (
              <div className="ml-4 space-y-1 mb-2 border-0 border-white/20 pl-2">
                {item.submenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = isRouteActive(subItem.href);
                  
                  return (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all w-full cursor-pointer ${
                        isSubActive ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <SubIcon size={16} />
                      <span className="text-sm text-left whitespace-nowrap">{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}