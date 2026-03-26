'use client';

import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type AudioDialogueSelectorProps = {
  selected: CartoonProjectConfig['audio'];
  onUpdate: (audio: CartoonProjectConfig['audio']) => void;
};

// Dialogue Options
const DIALOGUE_OPTIONS = [
  { id: 'Silent', label: 'Silent / Physical', desc: 'No spoken lines. Driven by grunts, music, and physical comedy.', icon: ICONS.volumeX, color: 'text-gray-400' },
  { id: 'Narrated', label: 'Narrated / Storybook', desc: 'VO tells the story. Characters may act but barely speak.', icon: ICONS.mic, color: 'text-blue-400' },
  { id: 'Sparse', label: 'Sparse & Punchy', desc: 'Action-first. Characters speak only when necessary.', icon: ICONS.zap, color: 'text-amber-400' },
  { id: 'Witty', label: 'Witty / Fast-Paced', desc: 'Constant banter, ping-pong dialogue, sitcom style.', icon: ICONS.messageSquare, color: 'text-pink-400' },
] as const;

// SFX Options
const SFX_OPTIONS = [
  { id: 'Cartoon', label: 'Classic Cartoon', desc: 'Boings, Zips, Whistles. Exaggerated punctuation.', icon: ICONS.bell },
  { id: 'Realistic', label: 'Cinematic / Real', desc: 'Foley sounds, atmospheric, grounded textures.', icon: ICONS.video },
  { id: '8-Bit', label: '8-Bit / Digital', desc: 'Retro game blips, glitches, and synth sounds.', icon: ICONS.cpu },
] as const;

export default function AudioDialogueSelector({ selected, onUpdate }: AudioDialogueSelectorProps) {

  const handleDialogueChange = (id: string) => {
    onUpdate({ ...selected, dialogue: id as any });
  };

  const handleSfxChange = (id: string) => {
    onUpdate({ ...selected, sfx: id as any });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">The Soundscape</h2>
        <p className="text-gray-400">Animation is 50% audio. Define how your characters speak and the world sounds.</p>
      </div>

      {/* 1. Dialogue Style */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-300 border-b border-[#262626] pb-2">Dialogue Density</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DIALOGUE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleDialogueChange(option.id)}
              className={`
                        p-4 rounded-xl border transition-all text-left flex flex-col gap-3 hover:scale-[1.02]
                        ${selected.dialogue === option.id
                  ? `bg-${option.color.split('-')[1]}-500/10 border-${option.color.split('-')[1]}-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]`
                  : 'bg-[#141414] border-[#262626] text-gray-400 hover:border-gray-500'
                }
                    `}
            >
              <div className="flex justify-between items-start w-full">
                <Icon icon={option.icon} size={24} className={selected.dialogue === option.id ? option.color : option.color} />
                {selected.dialogue === option.id && (
                  <div className={`p-1 rounded-full ${option.color.replace('text-', 'bg-')} text-black`}>
                    <Icon icon={ICONS.check} size={10} />
                  </div>
                )}
              </div>
              <div>
                <div className="font-bold text-sm mb-1">{option.label}</div>
                <div className="text-[10px] leading-tight opacity-70">{option.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. SFX Style */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-300 border-b border-[#262626] pb-2">SFX Intensity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SFX_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSfxChange(option.id)}
              className={`
                        p-4 rounded-xl border transition-all text-left flex items-center gap-4 hover:scale-[1.02]
                        ${selected.sfx === option.id
                  ? 'bg-orange-500/10 border-orange-500 text-white'
                  : 'bg-[#141414] border-[#262626] text-gray-400 hover:border-gray-500'
                }
                    `}
            >
              <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                        ${selected.sfx === option.id ? 'bg-orange-500/20 text-orange-400' : 'bg-[#262626] text-gray-600'}
                    `}>
                <Icon icon={option.icon} size={20} />
              </div>
              <div>
                <div className="font-bold text-sm">{option.label}</div>
                <div className="text-[10px] leading-tight opacity-70">{option.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
