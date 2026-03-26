'use client';

import React, { useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type VibeThemeSelectorProps = {
  vibe: string;
  theme: string;
  audience: CartoonProjectConfig['audience'];
  genre: CartoonProjectConfig['genre'];
  onUpdate: (vibe: string, theme: string) => void;
};

// --- Smart Default Logic ---
const getSmartDefaults = (audience: string | null, genre: string | null) => {
  let vibe = "Fun";
  let theme = "Adventure";

  if (audience === 'preschool') {
    vibe = "Whimsical & Gentle";
    theme = "Kindness & Sharing";
    if (genre === 'Action') { vibe = "Bouncy & Safe"; theme = "Teamwork"; }
    if (genre === 'Sci-Fi') { vibe = "Curious & Bright"; theme = "Discovery"; }
  } else if (audience === 'kids') {
    vibe = "High Energy";
    theme = "Friendship";
    if (genre === 'Slapstick') { vibe = "Chaotic & Loud"; theme = "Resilience"; }
    if (genre === 'Fantasy') { vibe = "Magical & Colorful"; theme = "Believing in Yourself"; }
  } else if (audience === 'tween') {
    vibe = "Epic & Dramatic";
    theme = "Identity";
    if (genre === 'Action') { vibe = "Intense & Cool"; theme = "Courage"; }
    if (genre === 'Sci-Fi') { vibe = "Mysterious & Techy"; theme = "Truth"; }
  } else if (audience === 'teen_adult' || audience === 'corporate') {
    vibe = "Cynical & Witty";
    theme = "Society";
    if (genre === 'Slapstick') { vibe = "Absurdist & Dark"; theme = "Existentialism"; }
    if (genre === 'Slice of Life') { vibe = "Dry & Realistic"; theme = "Modern Life"; }
    if (audience === 'corporate') {
      vibe = "Professional & Clean";
      theme = "Solution-Focused";
    }
  }

  return { vibe, theme };
};

// --- Constants ---
const VIBE_OPTIONS = [
  "Fun",
  "Whimsical & Gentle",
  "Bouncy & Safe",
  "Curious & Bright",
  "High Energy",
  "Chaotic & Loud",
  "Magical & Colorful",
  "Epic & Dramatic",
  "Intense & Cool",
  "Mysterious & Techy",
  "Cynical & Witty",
  "Absurdist & Dark",
  "Dry & Realistic",
  "Spooky & Fun",
  "Heartwarming",
  "Satirical"
];

const THEME_OPTIONS = [
  "Adventure",
  "Kindness & Sharing",
  "Teamwork",
  "Discovery",
  "Friendship",
  "Resilience",
  "Believing in Yourself",
  "Identity",
  "Courage",
  "Truth",
  "Society",
  "Existentialism",
  "Modern Life",
  "Family Dynamics",
  "Good vs. Evil",
  "Nature vs. Tech"
];

export default function VibeThemeSelector({ vibe, theme, audience, genre, onUpdate }: VibeThemeSelectorProps) {

  // Auto-populate defaults if empty
  useEffect(() => {
    if (!vibe || !theme) {
      const defaults = getSmartDefaults(audience, genre);
      onUpdate(defaults.vibe, defaults.theme);
    }
  }, [audience, genre]); // Run only when inputs change (or on mount if empty)

  const defaults = getSmartDefaults(audience, genre);
  const isDefault = vibe === defaults.vibe && theme === defaults.theme;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">The Heart & Soul</h2>
        <p className="text-gray-400">Defining the emotional core of the show.</p>
      </div>

      {/* Smart Analysis Card */}
      <div className={`
        rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border
        ${isDefault
          ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
          : 'bg-[#141414]/30 border-[#262626] opacity-60 grayscale-[0.8]'
        }
      `}>
        <div className="absolute top-0 right-0 p-4 opacity-20"><Icon icon={ICONS.sparkles} size={64} /></div>

        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDefault ? 'text-purple-400' : 'text-gray-500'}`}>
          <Icon icon={ICONS.cpu} size={16} /> AI Suggestion
        </h3>

        <p className={`${isDefault ? 'text-gray-300' : 'text-gray-500'} mb-6`}>
          Based on your target of <strong className={isDefault ? 'text-white' : 'text-gray-400'}>{audience}</strong> and genre of <strong className={isDefault ? 'text-white' : 'text-gray-400'}>{genre}</strong>,
          we recommend a show that feels:
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className={`flex-1 rounded-xl p-4 border ${isDefault ? 'bg-black/20 border-white/5' : 'bg-black/10 border-[#262626]'}`}>
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Recommended Vibe</div>
            <div className={`text-xl font-bold ${isDefault ? 'text-white' : 'text-gray-400'}`}>{defaults.vibe}</div>
          </div>
          <div className={`flex-1 rounded-xl p-4 border ${isDefault ? 'bg-black/20 border-white/5' : 'bg-black/10 border-[#262626]'}`}>
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Recommended Theme</div>
            <div className={`text-xl font-bold ${isDefault ? 'text-white' : 'text-gray-400'}`}>{defaults.theme}</div>
          </div>
        </div>

        {!isDefault && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onUpdate(defaults.vibe, defaults.theme)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-purple-900/40 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Icon icon={ICONS.refresh} size={16} /> Use Recommended Strategy
            </button>
          </div>
        )}
      </div>

      {/* User Custom Selection Box */}
      <div className={`
        rounded-2xl border-2 p-6 transition-all duration-300
        ${!isDefault
          ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
          : 'border-[#262626] bg-[#141414]/50 opacity-80'
        }
      `}>
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${!isDefault ? 'text-purple-400' : 'text-gray-500'}`}>
          <Icon icon={ICONS.edit} size={16} /> User Custom Selection
        </h3>

        {/* Dropdown Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400">Vibe (Atmosphere)</label>
            <div className="relative">
              <select
                value={vibe}
                onChange={(e) => onUpdate(e.target.value, theme)}
                className={`
                  w-full bg-[#141414] border rounded-xl px-4 py-3 text-white appearance-none focus:outline-none transition-colors cursor-pointer
                  ${!isDefault ? 'border-purple-500/50 focus:border-purple-500' : 'border-[#262626] focus:border-gray-500'}
                `}
              >
                {VIBE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <Icon icon={ICONS.chevronDown} size={20} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400">Theme (Core Message)</label>
            <div className="relative">
              <select
                value={theme}
                onChange={(e) => onUpdate(vibe, e.target.value)}
                className={`
                  w-full bg-[#141414] border rounded-xl px-4 py-3 text-white appearance-none focus:outline-none transition-colors cursor-pointer
                  ${!isDefault ? 'border-purple-500/50 focus:border-purple-500' : 'border-[#262626] focus:border-gray-500'}
                `}
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <Icon icon={ICONS.chevronDown} size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
