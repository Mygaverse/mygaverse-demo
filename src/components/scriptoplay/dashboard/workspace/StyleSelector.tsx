import React from 'react';
import { VISUAL_STYLES, AUDIENCE_TARGETS } from '@/config/scriptoplay/styles';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

type StyleSelectorProps = {
  selectedStyle: string;
  onSelectStyle: (id: string) => void;
  selectedAudience: string;
  onSelectAudience: (id: string) => void;
};

export default function StyleSelector({ selectedStyle, onSelectStyle, selectedAudience, onSelectAudience }: StyleSelectorProps) {
  return (
    <div className="space-y-8 animate-in fade-in">

      {/* 1. Audience Selector */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon icon={ICONS.usersMenu} className="text-purple-500" />
          Target Audience
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AUDIENCE_TARGETS.map(aud => (
            <button
              key={aud.id}
              onClick={() => onSelectAudience(aud.id)}
              className={`p-4 rounded-xl border text-left transition-all ${selectedAudience === aud.id
                ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/30'
                : 'bg-[#0a0a0a] border-[#262626] hover:border-gray-500'}`}
            >
              <div className="font-bold text-white mb-1">{aud.label}</div>
              <div className="text-xs text-gray-500 leading-tight">{aud.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Visual Style Selector */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon icon={ICONS.palette} className="text-pink-500" />
          Visual Style Reference
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          This style will be applied to <strong>all</strong> characters, scenes, and videos to ensure consistency.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {VISUAL_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className={`group relative rounded-xl border overflow-hidden text-left transition-all h-48 flex flex-col justify-end p-4 ${selectedStyle === style.id
                ? 'border-pink-500 ring-2 ring-pink-500/30'
                : 'border-[#262626] hover:border-gray-500'}`}
            >
              {/* Background Image (In real app, use optimized Next/Image) */}
              <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(${style.preview})` }} />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />

              <div className="relative z-10">
                {selectedStyle === style.id && (
                  <div className="absolute -top-32 right-0 bg-pink-500 text-white p-1 rounded-full shadow-lg">
                    <Icon icon={ICONS.check} size={14} />
                  </div>
                )}
                <div className="font-bold text-white text-sm mb-1">{style.label}</div>
                <div className="text-[10px] text-gray-300 line-clamp-2">{style.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
