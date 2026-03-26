'use client';

import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type VisualStyleSelectorProps = {
  selected: CartoonProjectConfig['visualStyle'];
  audience: CartoonProjectConfig['audience'];
  onSelect: (style: CartoonProjectConfig['visualStyle']) => void;
};

const STYLE_OPTIONS = [
  {
    id: 'bluey_vector',
    label: '2D Vector / Cel',
    desc: 'Clean lines, flat colors. The standard for modern TV.',
    recAudience: ['Preschool', 'Bridge', 'Corporate'],
    image: '/images/style-2d-vector.png'
  },
  {
    id: 'pixar_3d',
    label: '3D Stylized',
    desc: 'Pixar-like aesthetics with soft lighting and cute proportions.',
    recAudience: ['Preschool', 'Bridge'],
    image: '/images/style-3d-stylized.png'
  },
  {
    id: 'ghibli_anime',
    label: 'Anime',
    desc: 'Japanese animation style. High detail and dramatic angles.',
    recAudience: ['Tween', 'Adult'],
    image: '/images/style-anime.png'
  },
  {
    id: 'adventure_time',
    label: 'Hand-Drawn / Sketchy',
    desc: 'Organic, artistic feel. Great for emotional stories.',
    recAudience: ['Adult', 'Bridge'],
    image: '/images/style-hand-drawn.png'
  },
  {
    id: 'stop_motion',
    label: 'Mixed Media',
    desc: 'Collage of photos, 2D, and 3D. Unique and surreal.',
    recAudience: ['Adult', 'Tween'],
    image: '/images/style-mixed-media.png'
  },
] as const;

export default function VisualStyleSelector({ selected, audience, onSelect }: VisualStyleSelectorProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Choose the Art Style</h2>
        <p className="text-gray-400">This defines the "budget" and visual language of the show.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STYLE_OPTIONS.map((option) => {
          const isRecommended = audience && (option.recAudience as readonly string[]).includes(audience);

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id as CartoonProjectConfig['visualStyle'])}
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
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-lg font-bold ${selected === option.id ? 'text-white' : 'text-gray-300'}`}>
                    {option.label}
                  </h3>
                  {isRecommended && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {option.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
