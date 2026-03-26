'use client';

import { useSidebar } from '@/app/scriptoplay/context/SidebarContext';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { SidebarItem, SidebarSubmenu } from './SidebarComponents';
//import Logo from '@/components/scriptoplay/ui/Logo';
import Link from 'next/link';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { cn } from '@/utils/scriptoplay/cn'; // Or your utility path

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void; // 1. Add Prop
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { sections, expandedMenus, toggleMenu } = useSidebar();
  const { user } = useAuth(); // Get current user

  return (
    <aside
      className={cn(
        "bg-[#0a0a0a] border-r border-[#262626] flex flex-col h-full transition-all duration-300 flex-shrink-0 font-sans",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo & Toggle Area */}
      <div className={cn(
        "h-[69px] flex items-center border-b border-[#262626] shrink-0 transition-all",
        isCollapsed ? "justify-center px-0" : "justify-between px-6"
      )}>

        {/* Logo Group (Hidden if collapsed to make room for the toggle button) */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Icon icon={ICONS.logo} className="text-white" size={16} />
            </div>
            <span className="font-semibold text-base text-white tracking-tight whitespace-nowrap">
              Scriptoplay
            </span>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center bg-black/90 rounded-lg hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#262626] text-gray-400 hover:text-white cursor-pointer",
            isCollapsed ? "w-9 h-9 bg-[#1a1a1a] border-[#262626]" : "w-8 h-8"
          )}
        >
          <Icon
            icon={isCollapsed ? ICONS.chevronRight : ICONS.chevronLeft}
            size={isCollapsed ? 20 : 18}
          />
        </button>

      </div>

      {/* 2. Main Navigation - Scrollable */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent">

        {sections.map((section) => (
          <div key={section.id} className={section.id === 'main' ? 'space-y-1' : 'pt-2'}>

            {/* Section Header (Hidden if main or collapsed) */}
            {section.title && !isCollapsed && (
              <div className="text-[11px] tracking-wide text-gray-500 mb-3 px-3 uppercase font-medium">
                {section.title}
              </div>
            )}
            {/* If collapsed and not main, show a divider instead of title */}
            {section.title && isCollapsed && (
              <div className="h-px bg-[#262626] my-2 mx-2" />
            )}

            {/* Items Loop */}
            <div className="space-y-1">
              {section.items.map((item) => (
                item.submenu ? (
                  <SidebarSubmenu
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    expanded={expandedMenus.includes(item.id)}
                    onToggle={() => toggleMenu(item.id)}
                  />
                ) : (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                  />
                )
              ))}
            </div>
          </div>
        ))}

        {/* ADMIN SECTION - Only visible if admin */}
        {user?.accessStatus === 'admin' && (
          <>
            <div className="my-4 h-px bg-[#262626] mx-4" />
            <div className="px-4 mb-2 text-[12px] font-bold text-gray-500 uppercase">Admin</div>
            <Link href="/scriptoplay/dashboard/admin/users" className="flex items-center gap-3 px-4 py-2 hover:bg-[#1a1a1a] rounded-lg transition-colors text-gray-300">
              <Icon icon={ICONS.user} size={16} />
              {!isCollapsed && <span className='text-sm'>User Management</span>}
            </Link>
            <Link href="/scriptoplay/dashboard/trainer-studio" className="flex items-center gap-3 px-4 py-2 hover:bg-[#1a1a1a] rounded-lg transition-colors text-gray-300">
              <span className="text-base leading-none">🎓</span>
              {!isCollapsed && <span className='text-sm'>Trainer Studio</span>}
            </Link>
          </>
        )}

        {/* TRAINER SECTION - trainer role only (not admin, they already see it above) */}
        {user?.accessStatus === 'trainer' && (
          <>
            <div className="my-4 h-px bg-[#262626] mx-4" />
            <div className="px-4 mb-2 text-[12px] font-bold text-gray-500 uppercase">Trainer</div>
            <Link href="/scriptoplay/dashboard/trainer-studio" className="flex items-center gap-3 px-4 py-2 hover:bg-[#1a1a1a] rounded-lg transition-colors text-gray-300">
              <span className="text-base leading-none">🎓</span>
              {!isCollapsed && <span className='text-sm'>Trainer Studio</span>}
            </Link>
          </>
        )}

        {/* 3. Credits Section (Static) */}
        {!isCollapsed && (
          <div className="pt-2 pb-4">
            <div className="text-[11px] tracking-wide text-gray-500 mb-4 px-3 uppercase">Credits</div>
            <div className="mx-3 mb-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <Icon icon={ICONS.circle} size={8} className="text-purple-500" />
                  <span className="text-gray-300">ScriptoKEN</span>
                  <span className="ml-auto text-gray-400">100</span>
                </div>
                <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-purple-600 to-purple-400"></div>
                </div>
              </div>
              <button className="w-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] rounded-lg py-2.5 text-xs text-gray-300 transition-colors">
                View Your Credits
              </button>
            </div>
          </div>
        )}

        {/* 4. Affiliation Section (Static) */}
        {!isCollapsed && (
          <div className="pt-2 pb-6">
            <div className="text-[11px] tracking-wide text-gray-500 mb-4 px-3 uppercase">Affiliation</div>
            <div className="mx-3 bg-[#0f0f0f] border border-[#262626] rounded-xl p-5">
              <div className="flex justify-center mb-4">
                <Icon icon={ICONS.gift} size={32} className="text-orange-500" />
              </div>
              <p className="text-center text-sm text-gray-300 mb-4 leading-relaxed">
                Invite your friend and get 10% on all their purchases.
              </p>
              <button className="w-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] rounded-lg py-2.5 text-sm text-gray-300 transition-colors">
                Invite
              </button>
            </div>
          </div>
        )}

      </nav>
    </aside>
  );
}