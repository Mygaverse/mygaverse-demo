'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { cn } from '@/utils/scriptoplay/cn';
import { useAuth } from '@/app/scriptoplay/context/AuthContext'; // Import Auth

interface TopbarProps {
  isCollapsed: boolean;
}

export default function Topbar({ isCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth(); // Hook to get user & logout function

  // Dropdown State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/scriptoplay/dashboard' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Learn', href: '/learn' },
    { name: 'Community', href: '/community' },
  ];

  return (
    <header className="bg-[#0a0a0a] border-b border-[#262626] shrink-0 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 h-[68px]">

        {/* Left Side: Navigation Tabs */}
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors relative py-6",
                    isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Icon icon={ICONS.search} size={16} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-[320px] bg-[#1a1a1a] border border-[#262626] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">

          {/* Icon Actions Group */}
          <div className="flex items-center gap-1">
            <ActionButton icon={ICONS.creditCard} />
            <ActionButton icon={ICONS.settings} />
            <ActionButton icon={ICONS.starOutline} />

            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] transition-colors relative text-gray-300 hover:text-white">
              <Icon icon={ICONS.bell} size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
            </button>

            <ActionButton icon={ICONS.globe} />
          </div>

          {/* USER PROFILE DROPDOWN */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-600 hover:border-purple-500 transition-colors relative bg-[#1a1a1a] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-white">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-[#262626]">
                  <p className="text-sm font-bold text-white truncate">{user?.displayName || "Scriptwriter"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  {user?.studioName && <p className="text-[10px] text-purple-400 mt-0.5">{user.studioName}</p>}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link href="/scriptoplay/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors">
                    <Icon icon={ICONS.user} size={16} /> Profile
                  </Link>
                  <Link href="/scriptoplay/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors">
                    <Icon icon={ICONS.settings} size={16} /> Settings
                  </Link>
                </div>

                <div className="border-t border-[#262626] py-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/10 hover:text-red-300 transition-colors"
                  >
                    <Icon icon={ICONS.logOut} size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

// Helper component for repetitive icon buttons
function ActionButton({ icon }: { icon: string }) {
  return (
    <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-300 hover:text-white">
      <Icon icon={icon} size={20} />
    </button>
  );
}