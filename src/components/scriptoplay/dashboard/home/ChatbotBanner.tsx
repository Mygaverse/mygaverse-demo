import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function ChatbotBanner() {
  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0f0f0f] border border-[#262626] rounded-2xl p-8 relative overflow-hidden group">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-20 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
        <div className="flex-1 max-w-xl">
          <h2 className="text-2xl font-bold text-white mb-3">Introducing External Chatbots.</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Allow end users to create, train, and embed custom chatbots directly onto their websites.
          </p>
          <div className="flex gap-3">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30 text-white">
              <Icon icon={ICONS.sparkles} size={16} />
              <span>Try it Now</span>
            </button>
            <button className="bg-[#1a1a1a] hover:bg-[#262626] px-6 py-2.5 rounded-lg text-sm transition-colors border border-[#262626] text-white">
              Dismiss
            </button>
          </div>
        </div>
        
        <div className="w-40 h-40 relative shrink-0 hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-2xl"></div>
          <div className="relative flex items-center justify-center h-full">
             <Icon icon={ICONS.sparkles} size={96} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
}