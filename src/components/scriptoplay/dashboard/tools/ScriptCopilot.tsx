'use client';

import React, { useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import Tooltip from '@/components/scriptoplay/ui/Tooltip';
import { ICONS } from '@/config/scriptoplay/icons';

import { aiService } from '@/services/scriptoplay/aiService';

interface ScriptCopilotProps {
  isMagicMode: boolean;
  setMagicMode: (b: boolean) => void;
}

export default function ScriptCopilot({ isMagicMode, setMagicMode }: ScriptCopilotProps) {
  const suggestions = [
    { label: "+ Romance Subplot" }, 
    { label: "+ Suspense" },
    { label: "Cyborg → Human" },
    { label: "+ Comedy Subplot" }, 
    { label: "+ Drama" },
    { label: "Cyborg → Monster" },
  ];

  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // --- MOCK CHAT MESSAGES ---
  const handleSend = async () => {
  if (!input.trim()) return;
  
  // 1. Add User Message
  const newMessages = [...messages, { role: 'user', text: input }];
  setMessages(newMessages as any);
  setInput("");
  setLoading(true);

  // 2. Call AI
  // Pass previous conversation as context implies memory, 
  // for MVP we just send the last query + current script context if available
  const result = await aiService.generate(input, "You are a screenwriting assistant helping refine a script.");

  // 3. Add AI Response
  setMessages([...newMessages, { role: 'ai', text: result }] as any);
  setLoading(false);
};

  return (
    <div className="flex flex-col h-full">
      {/* Chat History - Scrolls independently */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* Mock Message 1 */}
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1">
              <Icon icon={ICONS.copilot} size={14} className="text-white" />
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-r-2xl rounded-bl-2xl text-sm text-gray-300 border border-[#262626] shadow-sm">
               I've analyzed your generated logline. Use the <strong>Magic Pointer</strong> to refine specific elements.
            </div>
        </div>

        {/* Mock Message 2 */}
        <div className="flex gap-3">
          <div className="bg-[#1a1a1a] p-4 rounded-r-2xl rounded-bl-2xl text-sm text-gray-300 border border-[#262626] shadow-sm">
              I'm ready. Once you finish your Logline, I can help you expand it into a full Synopsis automatically.
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0 mt-1">
              <Icon icon={ICONS.user} size={16} className="text-white" />
          </div>
        </div>

        {/* Spacer for scroll testing */}
        <div className="h-[20px]"></div> 
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="shrink-0 relative bg-[#0f0f0f] z-40">
        
        {/* Suggestion Chips */}
        <div className="relative -top-3 px-4 flex flex-wrap gap-2 z-10 pointer-events-none">
           {suggestions.map(s => (
             <button key={s.label} className="pointer-events-auto text-[11px] font-medium bg-[#141414] border border-[#262626] hover:border-purple-500 text-gray-400 hover:text-purple-300 px-2 py-1 rounded-full shadow-lg transition-colors backdrop-blur-md">
               {s.label}
             </button>
           ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#262626] w-full mt-2" />

        {/* Input Box */}
        <div className="p-4">
           <div className={`relative bg-[#141414] border rounded-xl transition-all ${
             isMagicMode ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-[#262626]'
           }`}>
              <textarea 
                rows={3}
                placeholder={isMagicMode ? "Select text to edit..." : "Ask Script-Copilot..."}
                className="w-full bg-transparent pl-4 pr-12 py-3 text-sm focus:outline-none resize-none scrollbar-hide text-white"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <Tooltip content="Upload Reference">
                    <button className="p-1.5 rounded-lg hover:bg-[#262626] text-gray-400 hover:text-white transition-colors">
                      <Icon icon={ICONS.paperclip} size={16} />
                    </button>
                  </Tooltip>

                  <Tooltip content="Magic Pointer">
                    <button 
                      onClick={() => setMagicMode(!isMagicMode)}
                      className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${
                        isMagicMode 
                          ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                          : 'hover:bg-[#262626] text-gray-400 hover:text-purple-400'
                      }`}
                    >
                      <Icon icon={ICONS.wand} size={16} />
                      {isMagicMode && <span className="text-[10px] font-bold pr-1">ON</span>}
                    </button>
                  </Tooltip>
              </div>

              <button className="absolute right-2 bottom-2 p-1.5 bg-[#262626] rounded-lg hover:bg-purple-600 text-gray-400 hover:text-white transition-colors">
                  <Icon icon={ICONS.send} size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}