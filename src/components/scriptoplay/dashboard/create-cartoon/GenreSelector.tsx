'use client';

import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type GenreSelectorProps = {
  selected: CartoonProjectConfig['genre'];
  onSelect: (genre: CartoonProjectConfig['genre']) => void;
};

const GENRE_OPTIONS = [
  {
    id: 'Action',
    label: 'Action & Adventure',
    hook: 'The Threat / The Quest',
    desc: 'Focus: Exploration, speed, and overcoming physical obstacles.',
    image: '/images/genre-action.png'
  },
  {
    id: 'Slapstick',
    label: 'Slapstick Comedy',
    hook: 'The Mistake / The Accident',
    desc: 'Focus: Visual gags, pain-is-funny, and impossible physics.',
    image: '/images/genre-slapstick.png'
  },
  {
    id: 'Slice of Life',
    label: 'Slice of Life',
    hook: 'The Relatable Problem',
    desc: 'Focus: Everyday struggles, friendship, and emotional small wins.',
    image: '/images/genre-slice-of-life.png'
  },
  {
    id: 'Fantasy',
    label: 'Fantasy / Magic',
    hook: 'The Rules of Magic',
    desc: 'Focus: Discovery of power, hidden realms, and wonder.',
    image: '/images/genre-fantasy.png'
  },
  {
    id: 'Sci-Fi',
    label: 'Sci-Fi / Space',
    hook: 'The Tech Mystery',
    desc: 'Focus: Gadgets, robots, aliens, and "What if?" questions.',
    image: '/images/genre-sci-fi.png'
  },
] as const;

export default function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Select the Flavor</h2>
        <p className="text-gray-400">The genre determines the "Hook" — how the story creates conflict.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GENRE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id as CartoonProjectConfig['genre'])}
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

              {/* Hook Tag (Overlay) */}
              <div className="absolute bottom-2 left-3 z-10">
                <span className="text-[10px] font-bold tracking-wider uppercase text-purple-300 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-purple-500/30">
                  {option.hook}
                </span>
              </div>

              {/* Checkmark Badge */}
              {selected === option.id && (
                <div className="absolute top-3 right-3 bg-purple-500 text-white p-1.5 rounded-full shadow-lg z-10">
                  <Icon icon={ICONS.check} size={14} />
                </div>
              )}
            </div>

            <div className="p-5 space-y-2 border-t border-[#262626]/50">
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
