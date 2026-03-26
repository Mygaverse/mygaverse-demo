'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

interface MagicLoglineProps {
  text: string;
  isMagicMode: boolean;
}

export default function MagicLogline({ text, isMagicMode }: MagicLoglineProps) {
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  // Mock Parser: In a real app, your AI would return indices of entities.
  // Here we manually define keywords to highlight for the demo.
  const keywords = ['Mars Colony', 'Cyborg', 'Saxophone', 'power grid'];

  const handleKeywordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (!isMagicMode) return;

    // Calculate position for popover relative to the click
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const parentRect = (e.currentTarget.closest('.magic-container') as HTMLElement).getBoundingClientRect();

    setPopoverPos({
      x: rect.left - parentRect.left + (rect.width / 2),
      y: rect.top - parentRect.top - 10
    });
    setActiveKeyword(word);
  };

  // Helper to render text with highlighting
  const renderInteractiveText = () => {
    let parts = [text];

    keywords.forEach(keyword => {
      const newParts: any[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          // Split by the keyword (case insensitive)
          const split = part.split(new RegExp(`(${keyword})`, 'gi'));
          newParts.push(...split);
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) => {
      const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());

      if (isKeyword) {
        return (
          <span
            key={i}
            onMouseEnter={(e) => handleKeywordClick(e, part)}
            className={`
              rounded px-1 transition-all duration-300 relative inline-block cursor-pointer
              ${isMagicMode
                ? 'bg-purple-500/20 text-purple-200 border-b-2 border-purple-500 hover:bg-purple-500 hover:text-white'
                : 'text-gray-200'
              }
            `}
          >
            {part}
            {isMagicMode && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
            )}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="relative magic-container" onClick={() => setActiveKeyword(null)}>
      {/* The Text Display */}
      <div className="p-6 text-xl leading-relaxed min-h-[160px] transition-all">
        {renderInteractiveText()}
      </div>

      {/* The Popover Menu */}
      <AnimatePresence>
        {activeKeyword && isMagicMode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            style={{ top: popoverPos.y, left: popoverPos.x }}
            className="absolute z-50 -translate-x-1/2 -translate-y-full mb-2 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-1 w-48"
          >
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase border-b border-[#262626] mb-1">
              {activeKeyword}
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-purple-600 hover:text-white rounded transition-colors text-left">
              <Icon icon={ICONS.layers} size={14} /> Add to Modules
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-purple-600 hover:text-white rounded transition-colors text-left">
              <Icon icon={ICONS.shuffle} size={14} /> Make Variations
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-purple-600 hover:text-white rounded transition-colors text-left">
              <Icon icon={ICONS.pin} size={14} /> Pin Down (Keep)
            </button>

            {/* Tiny Arrow */}
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-[#333] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}