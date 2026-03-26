'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion, AnimatePresence } from 'framer-motion';

type ModuleTab = 'characters' | 'settings' | 'themes' | 'plots';

interface ModuleItem {
  id: string;
  name: string;
  tag: string;
  color: string;
}

export default function ScriptModules() {
  const [activeTab, setActiveTab] = useState<ModuleTab>('characters');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MOCK DATA ---
  const characters: ModuleItem[] = [
    { id: 'c1', name: 'Jax', tag: 'Protagonist', color: 'from-blue-600 to-cyan-500' },
    { id: 'c2', name: 'Anya', tag: 'Sidekick', color: 'from-pink-600 to-rose-500' },
    { id: 'c3', name: 'Krieg', tag: 'Antagonist', color: 'from-red-600 to-orange-600' },
  ];

  const settings: ModuleItem[] = [
    { id: 's1', name: 'Neo-Chicago', tag: 'City', color: 'from-slate-700 to-slate-900' },
    { id: 's2', name: 'The Jazz Cellar', tag: 'Hideout', color: 'from-amber-700 to-yellow-900' },
  ];

  const themes: ModuleItem[] = [
    { id: 't1', name: 'Humanity', tag: 'Soul vs Code', color: 'from-purple-600 to-indigo-600' },
  ];

  const plots: ModuleItem[] = [
    { id: 'p1', name: 'The Discovery', tag: 'Inciting Incident', color: 'from-gray-700 to-gray-600' },
    { id: 'p2', name: 'The Chase', tag: 'Rising Action', color: 'from-gray-700 to-gray-600' },
  ];

  const getItems = () => {
    switch (activeTab) {
      case 'characters': return characters;
      case 'settings': return settings;
      case 'themes': return themes;
      case 'plots': return plots;
    }
  };

  const tabs: { id: ModuleTab; label: string }[] = [
    { id: 'characters', label: 'Chars' },
    { id: 'settings', label: 'Sets' },
    { id: 'themes', label: 'Themes' },
    { id: 'plots', label: 'Plots' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      
      {/* 1. PILL TOGGLES */}
      <div className="px-4 py-4 shrink-0">
        <div className="flex bg-[#141414] p-1 rounded-lg border border-[#262626]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#262626] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
         {getItems().map((item) => (
            <div 
              key={item.id} 
              className="group relative flex items-center gap-3 p-3 bg-[#141414] border border-[#262626] rounded-xl hover:border-gray-600 hover:bg-[#1a1a1a] transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === item.id ? null : item.id);
              }}
            >
               {/* Visual Icon/Avatar based on type */}
               {activeTab === 'characters' && (
                 <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                    {item.name.charAt(0)}
                 </div>
               )}
               {activeTab === 'settings' && (
                 <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                    <Icon icon={ICONS.map} size={12} className="text-white mix-blend-overlay" />
                 </div>
               )}
               {activeTab === 'themes' && (
                 <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                    <Icon icon={ICONS.sparkles} size={12} className="text-white mix-blend-overlay" />
                 </div>
               )}
               {activeTab === 'plots' && (
                 <div className="w-8 h-8 rounded-md bg-[#262626] flex items-center justify-center text-gray-400">
                    <span className="text-[10px] font-mono">ACT</span>
                 </div>
               )}

               {/* Text Info */}
               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{item.name}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{item.tag}</p>
               </div>

               {/* Kebab Menu Icon */}
               <div className="text-gray-600 group-hover:text-white transition-colors">
                  <Icon icon={ICONS.moreVertical} size={14} />
               </div>

               {/* POPUP MENU */}
               <AnimatePresence>
                 {openMenuId === item.id && (
                    <motion.div 
                      ref={menuRef}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-2 top-10 z-50 w-40 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()} // Prevent clicking menu from toggling it
                    >
                       <div className="py-1">
                          <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 flex items-center gap-2">
                             <Icon icon={ICONS.plus} size={12} /> Add to Script
                          </button>
                          <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#262626] hover:text-white flex items-center gap-2">
                             <Icon icon={ICONS.edit} size={12} /> Edit Item
                          </button>
                          <div className="h-px bg-[#262626] my-1" />
                          <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/10 hover:text-red-300 flex items-center gap-2">
                             <Icon icon={ICONS.delete} size={12} /> Archive
                          </button>
                       </div>
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>
         ))}

         {/* Add New Button */}
         <button className="w-full py-3 border border-dashed border-[#262626] rounded-xl text-xs text-gray-500 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2">
            <Icon icon={ICONS.plus} size={14} /> Create New {activeTab.slice(0, -1)}
         </button>
      </div>
    </div>
  );
}