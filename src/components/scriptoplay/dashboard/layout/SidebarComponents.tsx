'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { cn } from '@/utils/scriptoplay/cn'; // Assuming you have a class merger
import { SidebarItem as SidebarItemType } from '@/types/scriptoplay/interface/sidebar';

interface ItemProps {
  item: SidebarItemType;
  isCollapsed: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function SidebarItem({ item, isCollapsed }: ItemProps) {
  const pathname = usePathname();
  // Simple matching logic
  const isActive = item.href ? pathname === item.href : false;

  return (
    <Link
      href={item.href || '#'}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
        isCollapsed && "justify-center"
      )}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Active Indicator (Purple Bar) */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full" />
      )}

      {/* Icon */}
      <span className={cn(
        "shrink-0 relative z-10 transition-colors duration-200",
        isActive || item.highlighted ? "text-purple-400" : "text-gray-400 group-hover:text-purple-400"
      )}>
        <Icon icon={item.icon} size={20} />
      </span>

      {/* Label & Badge (Hidden if collapsed) */}
      {!isCollapsed && (
        <>
          <span className={cn(
            "flex-1 text-sm text-left relative z-10 transition-colors duration-200",
            isActive || item.highlighted ? "text-purple-400" : "text-gray-400 group-hover:text-purple-400"
          )}>
            {item.label}
          </span>
          
          {item.badge && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold",
              item.badge === 'NEW' ? "bg-pink-300/90 text-purple-900" : "bg-[#262626] text-gray-300"
            )}>
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Hover Background */}
      <div className={cn(
        "absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none",
        isActive ? "" : "group-hover:bg-purple-500/20 opacity-0 group-hover:opacity-100"
      )} />
    </Link>
  );
}

export function SidebarSubmenu({ item, isCollapsed, expanded, onToggle }: ItemProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
          isCollapsed && "justify-center"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="shrink-0 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
          <Icon icon={item.icon} size={20} />
        </span>

        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm text-left text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
              {item.label}
            </span>
            {/* Rotate Plus Icon */}
            <span className={cn("text-gray-500 group-hover:text-purple-400 transition-transform duration-200", expanded && "rotate-45")}>
              <Icon icon={ICONS.plus} size={14} />
            </span>
          </>
        )}

        <div className="absolute inset-0 rounded-lg transition-all duration-200 -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-purple-500/20" />
      </button>

      {/* Expandable Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        expanded && !isCollapsed ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
      )}>
        <div className="ml-8 border-l border-zinc-800 space-y-1">
            {item.submenu?.map((subLabel, idx) => (
                <button
                key={idx}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors duration-200 rounded-r-lg block"
                >
                {subLabel}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
}