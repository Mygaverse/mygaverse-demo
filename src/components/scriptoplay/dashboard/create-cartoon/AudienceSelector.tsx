'use client';

import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type AudienceSelectorProps = {
  selected: CartoonProjectConfig['audience'];
  onSelect: (audience: CartoonProjectConfig['audience']) => void;
};

const AUDIENCE_OPTIONS = [
  {
    id: 'preschool',
    label: 'Preschool (2-5)',
    tags: ['Nurturing', 'Educational', 'Simple Shapes'],
    desc: 'Direct address, slower pacing, emotional learning.',
    icon: ICONS.flower,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30'
  },
  {
    id: 'kids',
    label: 'Kids Bridge (6-9)',
    tags: ['Funny', 'Chaotic', 'Slapstick'],
    desc: 'High energy, physical comedy, no "baby stuff".',
    icon: ICONS.gamepad,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30'
  },
  {
    id: 'tween',
    label: 'Tween (10-13)',
    tags: ['Epic', 'Lore-Rich', 'Character Driven'],
    desc: 'Complex stories, hero\'s journey, "cool factor".',
    icon: ICONS.rocket,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30'
  },
  {
    id: 'teen_adult',
    label: 'Young Adult (18+)',
    tags: ['Witty', 'Satire', 'Meta-Humor'],
    desc: 'Cynical tones, social commentary, complex themes.',
    icon: ICONS.masks,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30'
  },
  {
    id: 'corporate',
    label: 'Corporate (B2B)',
    tags: ['Professional', 'Clean', 'Solution-Focused'],
    desc: 'Explainer videos, training, minimalist vectors.',
    icon: ICONS.presentationGraph,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30'
  },
] as const;

export default function AudienceSelector({ selected, onSelect }: AudienceSelectorProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Who is this for?</h2>
        <p className="text-gray-400">The audience determines the tone, complexity, and allowable themes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {AUDIENCE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id as CartoonProjectConfig['audience'])}
            className={`
                    relative group flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:-translate-y-1
                    ${selected === option.id
                ? `${option.bg} ring-2 ring-offset-2 ring-offset-[#0a0a0a] ring-${option.color.split('-')[1]}-500/50`
                : 'border-[#262626] bg-[#141414] hover:bg-[#1a1a1a] hover:border-gray-600'
              }
                `}
          >
            {/* Header with Icon */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                        ${selected === option.id ? 'bg-black/20' : 'bg-[#262626]'}
                        ${option.color}
                    `}>
                <Icon icon={option.icon} size={24} />
              </div>
              {selected === option.id && (
                <div className={`p-1 rounded-full ${option.color} bg-current`}>
                  <Icon icon={ICONS.check} size={12} className="text-black" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className={`text-xl font-bold ${selected === option.id ? 'text-white' : 'text-gray-200'}`}>
                {option.label}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 opacity-90">
                {option.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-black/20 text-gray-400 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>

              <p className={`text-sm leading-relaxed pt-2 ${selected === option.id ? 'text-gray-200' : 'text-gray-500'}`}>
                {option.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
