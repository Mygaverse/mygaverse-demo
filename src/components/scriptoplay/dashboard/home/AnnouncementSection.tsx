import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

function AnnouncementRow({ icon, color, text, tag, date }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-xl hover:bg-[#141414] transition-colors cursor-pointer group border border-transparent hover:border-[#262626]">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0 shadow-lg shadow-black/20`}>
                  <Icon icon={icon} size={20} className="text-white" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{text}</span>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{tag}</div>
                <div className="text-[10px] text-gray-500">{date}</div>
            </div>
        </div>
    );
}

export default function AnnouncementSection() {
  return (
    <div className="space-y-4">
      <AnnouncementRow 
        icon={ICONS.bot} color="bg-blue-600" 
        text="AI Chat Bots recently launched!" 
        tag="Info" date="Aug 28, 2025" 
      />
      <AnnouncementRow 
        icon={ICONS.wand} color="bg-purple-600" 
        text="Welcome To MagicAI" 
        tag="New" date="Aug 28, 2025" 
      />
    </div>
  );
}