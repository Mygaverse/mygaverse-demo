'use client';

import React, { useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import Tooltip from '@/components/scriptoplay/ui/Tooltip';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion, AnimatePresence } from 'framer-motion';
// Import the new Tool Components
import ScriptCopilot from '@/components/scriptoplay/dashboard/tools/ScriptCopilot';
import ScriptModules from '@/components/scriptoplay/dashboard/tools/ScriptModules';

type ToolId = 'copilot' | 'modules' | 'agent' | 'insights';

const AI_TOOLS = [
  { id: 'copilot', label: 'Script Copilot', icon: ICONS.copilot, color: 'text-purple-400' },
  { id: 'modules', label: 'Script Modules', icon: ICONS.grid, color: 'text-orange-400' },
  { id: 'agent', label: 'Script Agent', icon: ICONS.user, color: 'text-blue-400' },
  { id: 'insights', label: 'Script Insights', icon: ICONS.barChart, color: 'text-green-400' },
];

export default function RightPanel({ isMagicMode, setMagicMode }: { isMagicMode: boolean, setMagicMode: (b: boolean) => void }) {
  const [activeTool, setActiveTool] = useState<ToolId>('copilot');

  return (
    <div className="w-96 border-l border-[#262626] bg-[#0f0f0f] flex flex-col h-full shrink-0 relative z-20">
      
      {/* 1. TOP TABS (Fixed) */}
      <div className="h-20 border-b border-[#262626] flex items-center justify-between px-4 bg-[#0f0f0f] shrink-0 z-30">
         <div className="flex gap-1">
            {AI_TOOLS.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <div key={tool.id} className="relative z-50"> 
                   {isActive ? (
                    <button 
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded-lg transition-all"
                      onClick={() => setActiveTool(tool.id as ToolId)}
                    >
                      <Icon icon={tool.icon} size={16} className={tool.color} />
                      <span className="text-xs font-bold text-white whitespace-nowrap">{tool.label}</span>
                    </button>
                  ) : (
                    <Tooltip content={tool.label}>
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        onClick={() => setActiveTool(tool.id as ToolId)}
                      >
                        <Icon icon={tool.icon} size={18} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
         </div>
         <button className="text-gray-500 hover:text-white"><Icon icon={ICONS.moreVertical} size={16} /></button>
      </div>

      {/* 2. DYNAMIC TOOL CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
         <AnimatePresence mode="wait">
            <motion.div 
              key={activeTool}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
                {activeTool === 'copilot' && (
                  <ScriptCopilot isMagicMode={isMagicMode} setMagicMode={setMagicMode} />
                )}
                
                {activeTool === 'modules' && (
                  <ScriptModules />
                )}

                {/* Placeholders for future components */}
                {(activeTool === 'agent' || activeTool === 'insights') && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                      <Icon icon={AI_TOOLS.find(t=>t.id===activeTool)?.icon || ICONS.bot} size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">Active Tool: <span className="text-white font-bold">{AI_TOOLS.find(t=>t.id===activeTool)?.label}</span></p>
                      <p className="text-sm mt-2 text-purple-500">Coming Soon!</p>
                    </div>
                )}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}