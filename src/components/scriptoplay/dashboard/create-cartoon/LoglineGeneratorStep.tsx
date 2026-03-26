'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { aiService } from '@/services/scriptoplay/aiService';
import { CartoonProjectConfig } from './CartoonDiscoveryWizard';

type LoglineOption = {
  id: string;
  angle: 'Action' | 'Comedy' | 'Heart' | 'Twist';
  logline: string;
  reasoning: string;
};

type LoglineGeneratorStepProps = {
  config: CartoonProjectConfig;
  onSelect: (logline: string) => void;
  onBack: () => void;
};

export default function LoglineGeneratorStep({ config, onSelect, onBack }: LoglineGeneratorStepProps) {

  const [options, setOptions] = useState<LoglineOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-generate on mount
  useEffect(() => {
    generateOptions();
  }, []); // Run once

  const generateOptions = async () => {
    setLoading(true);
    try {
      const isMicroShort = config.length === '15s';

      const microShortFormatBlock = isMicroShort ? `
            ⚠️ 15-SECOND SHORT FORMAT — MANDATORY FOR ALL 4 LOGLINES:
            Every logline MUST follow this exact pattern:
            "A [CHARACTER] in [ONE LOCATION] [does/encounters something], which causes [PHYSICAL REACTION], resulting in [RESOLUTION]."

            HARD RULES:
            - ONE primary location only (maximum two settings total).
            - Maximum TWO characters.
            - ONE sustained physical action arc — no subplot, no parallel scenes.
            - The resolution must be reachable from the starting situation in 15 seconds.
            - Think: Tom & Jerry single gag, Pixar Lamp short, viral TikTok animation.
            - The whole story must play out in one continuous physical space.
            - MAXIMUM 35 WORDS per logline. Count every word. Do not exceed 35 words.
      ` : '';

      // Construct Prompt
      const prompt = `
            Act as a Creative Producer for a Cartoon Studio.
            Development Data:
            - Format: ${config.length}
            - Audience: ${config.audience}
            - Genre: ${config.genre}
            - Vibe: ${config.vibe}
            - Theme: ${config.theme}
            ${microShortFormatBlock}

            Task: Pitch 4 distinct story concepts (Loglines) based on this data.
            Each pitch should take a different "Angle":
            1. Action/Plot Driven
            2. Audio/Comedy Driven (Gags)
            3. Emotional/Character Driven (Heart)
            4. Weird/Subversive (Twist)

            ${isMicroShort ? 'ALL 4 loglines MUST follow the 15-SECOND SHORT FORMAT above. No exceptions.' : ''}

            Output JSON Array:
            [
                {
                    "angle": "Action",
                    "logline": "...",
                    "reasoning": "Fits the X audience because..."
                },
                ...
            ]
          `;

      const result = await aiService.generateStructured(prompt);
      if (Array.isArray(result)) {
        setOptions(result.map((item: any, i: number) => ({
          id: i.toString(),
          angle: item.angle,
          logline: item.logline,
          reasoning: item.reasoning
        })));
      }

    } catch (error) {
      console.error(error);
      // Fallback mocks if AI fails (for dev resilience)
      setOptions([
        { id: '1', angle: 'Action', logline: 'Generation failed, but imagine a cool story here.', reasoning: 'System error.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-black text-white">Producer Mode</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Our writers have brainstormed 4 different angles for your <strong>{config.genre}</strong> project.
          Pick the one that sparks joy.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
            <Icon icon={ICONS.spinner} size={64} className="text-purple-500 animate-spin relative z-10" />
          </div>
          <div className="text-gray-500 font-mono animate-pulse">Brewing story concepts...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedId(opt.id)}
              className={`
                            relative p-6 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02]
                            ${selectedId === opt.id
                  ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                  : 'bg-[#141414] border-[#262626] hover:border-gray-500'
                }
                        `}
            >
              {/* Badge */}
              <div className={`
                            inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4
                            ${selectedId === opt.id ? 'bg-purple-500 text-white' : 'bg-[#262626] text-gray-500'}
                        `}>
                <Icon icon={ICONS.sparkles} size={12} />
                {opt.angle} Angle
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-3">
                "{opt.logline}"
              </h3>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                Producer Note: {opt.reasoning}
              </p>

              {/* Checkbox */}
              <div className={`
                            absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                            ${selectedId === opt.id ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}
                        `}>
                {selectedId === opt.id && <Icon icon={ICONS.check} size={14} className="text-white" />}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      {!loading && (
        <div className="flex justify-center gap-4 mt-12">
          <button
            onClick={generateOptions}
            className="px-6 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon={ICONS.refresh} size={20} className="inline mr-2" />
            Regenerate
          </button>
          <button
            onClick={() => selectedId && onSelect(options.find(o => o.id === selectedId)?.logline || '')}
            disabled={!selectedId}
            className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 transition-all scale-100 hover:scale-105 active:scale-95"
          >
            Confirm Concept &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
