'use client';

import React, { useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type TierSelectorProps = {
  selected: CartoonProjectConfig['tier'];
  onSelect: (tier: CartoonProjectConfig['tier']) => void;
};

const DEMO_TIER = {
  id: 'Demo',
  label: 'Demo',
  desc: 'Single-take 15-second micro-short. AI handles the full pipeline automatically — perfect for exploring Scriptoplay.',
  icon: ICONS.play,
  activeClasses: 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  iconClasses: 'bg-blue-900/30 text-blue-400',
};

const LOCKED_TIERS = [
  {
    id: 'Hobbyist',
    label: 'Hobbyist',
    desc: 'Single-Take Fast Magic. AI automatically interpolates your story from start to finish. Limited to micro-shorts.',
    icon: ICONS.magic,
    activeClasses: 'border-purple-500',
    iconClasses: 'bg-purple-900/20 text-purple-400',
  },
  {
    id: 'Creator',
    label: 'Creator',
    desc: 'Deep Control & Stitching. Manage individual scenes and assemble them automatically.',
    icon: ICONS.camcorder,
    activeClasses: 'border-pink-500',
    iconClasses: 'bg-pink-900/20 text-pink-400',
  },
  {
    id: 'Director',
    label: 'Director',
    desc: 'Full cinematic control for long-form content. Complete oversight of pacing, audio, and visual sequencing.',
    icon: ICONS.directorChair,
    secondaryIcon: ICONS.starFilled,
    activeClasses: 'border-emerald-500',
    iconClasses: 'bg-emerald-900/20 text-emerald-400',
  },
] as const;

export default function TierSelector({ selected, onSelect }: TierSelectorProps) {
  const [hoveredLocked, setHoveredLocked] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Select Editing Tier</h2>
        <p className="text-gray-400">Choose the level of control and available formats for this project.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Demo Tier — active */}
        <button
          onClick={() => onSelect(DEMO_TIER.id as CartoonProjectConfig['tier'])}
          className={`
            relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden hover:scale-[1.02]
            ${selected === DEMO_TIER.id
              ? 'bg-[#0d1520] ' + DEMO_TIER.activeClasses
              : 'border-blue-600/40 bg-[#0a1018] hover:border-blue-500/70'
            }
          `}
        >
          {/* Available badge */}
          <div className="absolute top-3 right-3 bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Available
          </div>

          <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center transition-transform hover:scale-110 ${DEMO_TIER.iconClasses}`}>
            <Icon icon={DEMO_TIER.icon} size={32} />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${selected === DEMO_TIER.id ? 'text-white' : 'text-blue-300'}`}>
            {DEMO_TIER.label}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {DEMO_TIER.desc}
          </p>
        </button>

        {/* Locked Tiers — dimmed with overlay */}
        {LOCKED_TIERS.map((tier) => (
          <div
            key={tier.id}
            className="relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-[#262626] bg-[#141414] text-center cursor-not-allowed overflow-hidden"
            onMouseEnter={() => setHoveredLocked(tier.id)}
            onMouseLeave={() => setHoveredLocked(null)}
          >
            {/* Dark overlay — dims without full greying */}
            <div className="absolute inset-0 bg-black/50 z-10 transition-opacity duration-200" style={{ opacity: hoveredLocked === tier.id ? 0.65 : 0.5 }} />

            {/* Tooltip */}
            {hoveredLocked === tier.id && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#444] text-gray-300 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-xl">
                Not available for demo
              </div>
            )}

            <div className={`relative z-0 w-16 h-16 rounded-full mb-4 flex items-center justify-center ${tier.iconClasses}`}>
              <Icon icon={tier.icon} size={32} />
              {'secondaryIcon' in tier && (
                <div className="absolute top-1 right-0 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <Icon icon={tier.secondaryIcon} size={18} />
                </div>
              )}
            </div>
            <h3 className="relative z-0 text-xl font-bold mb-2 text-gray-300">{tier.label}</h3>
            <p className="relative z-0 text-sm text-gray-400 leading-relaxed">{tier.desc}</p>
          </div>
        ))}

      </div>
    </div>
  );
}
