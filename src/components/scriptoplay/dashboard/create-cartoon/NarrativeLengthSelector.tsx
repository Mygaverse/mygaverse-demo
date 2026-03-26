'use client';

import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type NarrativeLengthSelectorProps = {
  tier?: CartoonProjectConfig['tier'];
  selected: CartoonProjectConfig['length'];
  onSelect: (length: CartoonProjectConfig['length']) => void;
};

const LENGTH_OPTIONS = [
  {
    id: '15s',
    label: 'Micro-Short (15s)',
    category: 'Social Media',
    desc: 'One visual punchline. Perfect for TikTok/Reels loops.',
    image: '/images/format-shorts.png'
  },
  {
    id: '60s',
    label: 'Story Short (60s)',
    category: 'Social Media',
    desc: 'Full arc: Hook → Conflict → Twist. The YouTube Shorts standard.',
    image: '/images/format-story-short.png'
  },
  {
    id: '3m',
    label: 'Webisode (3m)',
    category: 'Digital Series',
    desc: 'Single scene adventure. Great for episodic web series.',
    image: '/images/format-webisode.png'
  },
  {
    id: '5m',
    label: 'Mid-Form (5m)',
    category: 'Digital / Preschool',
    desc: 'Slower pacing. Standard for preschool shows or pitch pilots.',
    image: '/images/format-preschool.png'
  },
  {
    id: '11m',
    label: 'Quarter-Hour (11m)',
    category: 'Broadcast',
    desc: 'Global TV standard. Focuses on a single strong A-Plot.',
    image: '/images/format-tv.png'
  },
] as const;

export default function NarrativeLengthSelector({ tier, selected, onSelect }: NarrativeLengthSelectorProps) {

  // Filter options based on selected tier
  const filteredOptions = LENGTH_OPTIONS.filter(option => {
    if (!tier) return true; // fallback
    if (tier === 'Demo') return option.id === '15s';
    if (tier === 'Hobbyist') return ['15s', '60s'].includes(option.id);
    if (tier === 'Creator') return ['60s', '3m'].includes(option.id);
    if (tier === 'Director') return ['3m', '5m', '11m'].includes(option.id);
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Format and Length</h2>
        <p className="text-gray-400">This constraint defines the pacing and structure of the script.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id as CartoonProjectConfig['length'])}
            className={`
                    relative group flex flex-col p-0 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden hover:scale-[1.02]
                    ${selected === option.id
                ? 'border-purple-500 bg-[#1a1a1a] shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                : 'border-[#262626] bg-[#141414] hover:border-gray-600'
              }
                `}
          >
            {/* Image Preview */}
            <div className="relative w-full h-32 overflow-hidden">
              <img
                src={option.image}
                alt={option.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent"></div>
              {/* Checkmark Badge */}
              {selected === option.id && (
                <div className="absolute top-3 right-3 bg-purple-500 text-white p-1.5 rounded-full shadow-lg z-10">
                  <Icon icon={ICONS.check} size={14} />
                </div>
              )}
            </div>

            <div className="p-5 space-y-2 border-t border-[#262626]/50">
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">{option.category}</span>
              <h3 className={`text-lg font-bold ${selected === option.id ? 'text-white' : 'text-gray-300'}`}>
                {option.label}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {option.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
