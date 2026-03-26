import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import Button from '@/components/scriptoplay/ui/Button';

// --- TYPES ---
export interface Character { id?: string; name: string; role: string; age: string; desc: string; }
export interface Setting { id?: string; name: string; type: string; vibe: string; }
export interface Theme { id?: string; name: string; color?: string; }
export interface PlotModule { id?: string; title: string; desc: string; type: 'Subplot' | 'Arc' | 'Beat'; }

// --- COLOR HELPER ---
const getAvatarColor = (name: string) => {
  const colors = [
    'from-purple-600 to-blue-600', 'from-pink-600 to-rose-600', 
    'from-green-600 to-teal-600', 'from-orange-600 to-red-600',
    'from-cyan-600 to-blue-600', 'from-fuchsia-600 to-purple-600'
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

// --- GENERIC ADD BUTTON ---
export const AddItemButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full py-2 border border-dashed border-[#262626] rounded-lg text-xs text-gray-500 hover:text-white hover:border-gray-500 hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-2"
    >
        <Icon icon={ICONS.plus} size={12} /> {label}
    </button>
);

// --- CHARACTER CARD ---
export const CharacterCard = ({ char }: { char: Character }) => (
  <div className="bg-[#141414] border border-[#262626] p-3 rounded-lg flex items-start gap-3 hover:border-purple-500/30 transition-colors group relative">
     <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(char.name)} flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10`}>
        {char.name.charAt(0)}
     </div>
     <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-gray-200 group-hover:text-purple-400 transition-colors truncate">{char.name}</h4>
        <div className="flex flex-wrap gap-1 my-1">
           <span className="text-[10px] px-1.5 py-0.5 bg-[#262626] rounded text-gray-400">{char.role}</span>
        </div>
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{char.desc}</p>
     </div>
  </div>
);

// --- SETTING CARD ---
export const SettingCard = ({ setting }: { setting: Setting }) => (
  <div className="bg-[#141414] border border-[#262626] p-3 rounded-lg hover:border-blue-500/30 transition-colors group">
     <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{setting.name}</h4>
        <Icon icon={ICONS.pin} size={12} className="text-gray-600 group-hover:text-blue-400" />
     </div>
     <div className="flex gap-2 text-[10px] text-gray-500 mb-2">
        <span className="uppercase tracking-wider">{setting.type}</span>
        <span>•</span>
        <span className="text-blue-400/80">{setting.vibe}</span>
     </div>
  </div>
);

// --- PLOT MODULE CARD ---
export const PlotModuleCard = ({ plot }: { plot: PlotModule }) => (
    <div className="bg-[#141414] border border-[#262626] p-3 rounded-lg hover:border-green-500/30 transition-colors group">
       <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-bold text-gray-200 group-hover:text-green-400 transition-colors">{plot.title}</h4>
          <span className="text-[9px] px-1.5 py-0.5 bg-[#262626] text-green-400 rounded uppercase">{plot.type}</span>
       </div>
       <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mt-1">{plot.desc}</p>
    </div>
  );

// --- THEME TAG ---
export const ThemeTag = ({ theme }: { theme: Theme }) => (
  <div className="px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#262626] text-xs text-gray-300 flex items-center gap-2">
     <span className={`w-2 h-2 rounded-full ${theme.color || 'bg-gray-500'}`}></span>
     {theme.name}
  </div>
);