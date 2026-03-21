'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';

interface Tab {
  id: string;
  label: string;
  count?: number; // badge count
  disabled?: boolean; // Support for disabled state
}

interface ScrollableTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const ScrollableTabs = ({ tabs, activeTab, onTabChange, className='' }: ScrollableTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300); // Check again after animation
    }
  };

  return (
    <div className="flex-1 flex items-center bg-white border border-[#e2e2e2] rounded-md h-full overflow-hidden relative">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-white/90 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 hover:bg-gray-50"
        >
            <ChevronLeft size={12} />
        </button>
      )}

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={checkScroll}
        className="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth h-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
                flex-1 min-w-max h-full px-6 text-sm font-medium relative transition-colors border-r-0 border-[#e2e2e2] last:border-0 whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'text-gray-900 bg-gray-50' 
                  : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed bg-white'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full 
                ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
              `}>
                {tab.count}
              </span>
            )}

            {/* Active Indicator Line */}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#4aaada]" />}
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center bg-white/90 shadow-[-4px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 hover:bg-gray-50"
        >
            <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
};