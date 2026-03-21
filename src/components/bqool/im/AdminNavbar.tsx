'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BoxArrowRight, ChevronDown } from 'react-bootstrap-icons';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext'; // Get Real User Data
import { AdminLogo } from './AdminLogo';

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/im/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Helper to determine active class
  const getTabClass = (tabPath: string) => {
    // HOME: Check for exact match OR sub-routes if we had them (but Home usually is dashboard)
    // Also include the root /im which redirects to home, just in case
    if (tabPath === '/im/home') {
      const isActive = pathname === '/im/home' || pathname === '/im'; // Fix: also highlight on /im
      return `px-6 py-2.5 text-sm font-semibold rounded-t-md transition-colors ${isActive ? 'bg-[#f4f6f9] text-[#1a1a1a]' : 'text-white/80 hover:text-white hover:bg-white/10'
        }`;
    }

    // SETTINGS: Check if any settings path is active
    if (tabPath === '/im/settings') {
      const isActive = pathname.startsWith('/im/settings');
      return `px-6 py-2.5 text-sm font-semibold rounded-t-md transition-colors flex items-center gap-2 cursor-pointer relative ${isActive ? 'bg-[#f4f6f9] text-[#1a1a1a]' : 'text-white/80 hover:text-white hover:bg-white/10'
        }`;
    }

    // OTHERS: Starts With check
    const isActive = pathname.startsWith(tabPath);
    return `px-6 py-2.5 text-sm font-semibold rounded-t-md transition-colors ${isActive
        ? 'bg-[#f4f6f9] text-[#1a1a1a]'
        : 'text-white/80 hover:text-white hover:bg-white/10'
      }`;
  };

  // State for Settings Dropdown
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="flex flex-col bg-[#0062cc]">

      {/* TOP ROW: Logo & User Info */}
      <div className="flex justify-between items-center px-6 py-4">
        <AdminLogo />

        <div className="flex items-center gap-6 text-white">
          <span className="text-sm font-medium opacity-90">
            {user?.email || 'Loading...'}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold opacity-80 hover:opacity-100 transition-opacity"
          >
            <BoxArrowRight size={18} />
            LOG OUT
          </button>
        </div>
      </div>

      {/* BOTTOM ROW: Navigation Tabs */}
      <div className="px-6 pt-2 flex gap-1 relative">
        <Link href="/im/home" className={getTabClass('/im/home')}>
          Home
        </Link>

        <Link href="/im/account" className={getTabClass('/im/account')}>
          Account
        </Link>

        <Link href="/im/stores" className={getTabClass('/im/stores')}>
          Amazon Stores
        </Link>

        <Link href="/im/forum" className={getTabClass('/im/forum')}>
          Forum
        </Link>

        {/* SETTINGS DROPDOWN */}
        <div
          className="relative"
          onMouseEnter={() => setIsSettingsOpen(true)}
          onMouseLeave={() => setIsSettingsOpen(false)}
        >
          <div className={getTabClass('/im/settings')}>
            Settings <ChevronDown size={12} />
          </div>

          {isSettingsOpen && (
            <div className="absolute top-full left-0 min-w-[200px] bg-white text-gray-800 rounded-b-md shadow-lg z-50 py-1 border border-gray-100 animate-in fade-in zoom-in-95 duration-75">
              <Link
                href="/im/settings/announcement"
                className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600 transition-colors"
              >
                Announcement
              </Link>
            </div>
          )}
        </div>

        {/* Demo Tab links back to Non-Admin Root */}
        <Link href="/" className="px-6 py-2.5 text-sm font-semibold rounded-t-md transition-colors text-white/80 hover:text-white hover:bg-white/10">
          Demo
        </Link>
      </div>
    </div>
  );
}