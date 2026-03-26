'use client';

import React, { useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/services/scriptoplay/aiService';

import { VISUAL_STYLES, getStyleConfig } from '@/config/scriptoplay/styles';

import { getCartoonTemplate, BeatDefinition, getAudienceGuidelines } from '@/utils/scriptoplay/cartoonTemplates';

// --- Types ---
export type BeatCard = {
  id: string;
  type: string; // Allow dynamic types from templates
  visual: string; // "The Visual Action"
  audio: string;  // "SFX / Dialogue"
  duration: number; // Estimated seconds
  // New Fields (Accuracy Anchors)
  camera?: {
    move: string;
    angle: string;
    shot_type?: string;
  };
  lighting?: string; // New "Vibe" Anchor
  audioLayer?: {
    music: string;
    sfx: string;
    dialogue: string;
  };
  animationNote?: string; // Creativity Anchor
  // Hybrid Pipeline Routing Anchors
  actionIntensity?: number;
  primaryFocus?: 'Dialogue' | 'Action' | 'Ambient' | 'Establishing';
};

type BeatSheetPhaseProps = {
  logline: string;
  onNext: (visuals?: any[]) => void;
  onBack: () => void;
  beatData: BeatCard[];
  setBeatData: (data: BeatCard[]) => void;
  isGenerating?: boolean;
  selectedStyle?: string; // Add optional prop
  length?: string; // e.g. "15s", "1m"
  audience?: string; // Target Audience
  genre?: string; // Added Genre
  vibe?: string;
  theme?: string;
  dialogueStyle?: string; // "Silent" | "Narrated" | "Sparse" | "Witty"
  // Versioning
  versions?: any[];
  onSaveVersion?: () => void | Promise<void>;
  isHobbyist?: boolean;
};

export default function BeatSheetPhase({
  logline, onNext, onBack, beatData = [], setBeatData, isGenerating: parentIsGenerating, selectedStyle,
  length, audience, genre, vibe, theme, dialogueStyle, versions = [], onSaveVersion, isHobbyist
}: BeatSheetPhaseProps) {

  const [localGenerating, setLocalGenerating] = useState(false);
  const [visualGenerating, setVisualGenerating] = useState(false);

  // Get Template based on Length
  const template = getCartoonTemplate(length || '60s');

  // Use passed data or map template to empty beats
  // Use passed data or map template to empty beats
  const beats: BeatCard[] = beatData.length > 0 ? beatData : template.beats.map((b: BeatDefinition, i: number) => ({
    id: (i + 1).toString(),
    type: b.label, // Use friendly label as type for UI
    visual: '',
    audio: '',
    duration: b.duration,
    camera: undefined,
    lighting: undefined,
    audioLayer: undefined,
    animationNote: '',
    actionIntensity: 5,
    primaryFocus: 'Action' as any
  }));

  // AI Generator
  const handleGenerateBeats = async () => {
    console.log("DEBUG: BeatSheetPhase length prop:", length);
    setLocalGenerating(true);

    try {
      // Lookup Style
      const styleConfig = getStyleConfig(selectedStyle);
      const styleNarrative = styleConfig?.narrativeInstructions || 'Generic cartoon style.';

      // Construct Dynamic Prompt from Template
      const structureInstructions = template.beats.map((b: BeatDefinition, i: number) =>
        `${i + 1}. ${b.label} (${b.duration}s): ${b.description}`
      ).join('\n            ');

      const prompt = `
            Act as a Cartoon Director.
            VISUAL STYLE: ${styleConfig?.label || 'Generic'}.
            STYLE GUIDELINES: ${styleNarrative}
            GENRE: ${genre || 'Comedy/General'}
            VIBE (Atmosphere): ${vibe || 'Fun'}
            THEME (Core Message): ${theme || 'None'}
            DIALOGUE STYLE: ${dialogueStyle || 'Standard'}
            Logline: "${logline}"
            Target Duration: ${template.label} (${template.totalDuration}s)
            
            STRICT CONSTRAINT: Create exactly ${template.beats.length} beats.
            Total Duration MUST be exactly ${template.totalDuration} seconds.
            Follow this pacing structure strictly:

            ${structureInstructions}

            NARRATIVE DIRECTIVES:
            1. The script MUST heavily embrace the Vibe: "${vibe}" - Make the atmosphere match this exactly.
            2. The storyline MUST explore the Theme: "${theme}" throughout the arc.
            3. Audience Safety/Tone: Respect the TARGET AUDIENCE (${audience}) constraints at all times.
            4. Focus on clear visual ACTION and emotional beats appropriate for the ${genre || 'Comedy'} genre.

            CREATIVITY ANCHOR (ANIMATION PRINCIPLES):
            Apply Disney's 12 Principles of Animation to the 'animation_note' field.
            Key Principles to use:
            - Squash and Stretch (impact/flexibility)
            - Anticipation (wind-up before action)
            - Exaggeration (push expressions/physics)
            - Slow In & Slow Out (natural timing)
            - Secondary Action (tails, hair, accessories)
            - Arcs (natural motion paths)
            
            DIALOGUE INSTRUCTIONS:
            ${dialogueStyle === 'Silent' ? 'STRICTLY NO DIALOGUE. Use purely visual storytelling and physical action (pantomime).' : ''}
            ${dialogueStyle === 'Witty' ? 'Include snappy, clever dialogue or one-liners.' : ''}
            ${dialogueStyle === 'Narrated' ? 'Include Narrator voiceover lines to guide the story.' : ''}
            ${dialogueStyle === 'Sparse' ? 'Minimal dialogue. Let actions speak louder than words.' : ''}

            HYBRID PIPELINE ROUTING — INTENSITY SCORING (CRITICAL):
            For EACH beat, you MUST analyze the actual PHYSICAL ACTION and MOVEMENT described in the visual content.
            Then assign an 'action_intensity' score (integer 1-10) based on this RUBRIC:

            Score 1-2: STATIC — No movement. Character sitting, standing still, sleeping, reading, meditating.
            Score 3-4: LOW — Slow, deliberate movement. Conversation, walking, subtle gestures, gentle emotion.
            Score 5-6: MODERATE — Light action. Casual running, mild conflict, playful interaction, light comedy.
            Score 7-8: HIGH ACTION — Dynamic movement. Chasing, jumping, fighting, throwing, dramatic physics.
            Score 9-10: PEAK INTENSITY — Climax. Explosions, super-speed, dramatic reveals, maximum chaos.

            RULES:
            - NEVER assign 5 to more than 2 consecutive beats.
            - Scores MUST reflect the physical action described. A dialogue beat CANNOT score above 5.
            - A chase or fight scene MUST score 7+.
            - Scores must vary across the full arc: typically low at start/end, high at climax.

            For 'primary_focus':
            - 'Dialogue': Scene relies primarily on speech/conversation (no or little movement)
            - 'Action': Scene relies primarily on physical movement or dynamic events
            - 'Ambient': Mood/atmosphere scene. Nature, environment, transitional.
            - 'Establishing': Introducing the location, world-building, no clear action yet.

            Output JSON array of objects (schema v2):
            [
                { 
                    "beat_id": "1", 
                    "heading": "${template.beats[0].label}", 
                    "visual_prompt": "Describe the scene... [Consistency Lock applied]", 
                    "camera": { "move": "Static/Pan/Zoom", "angle": "Wide/Medium/Close-up", "shot_type": "Establishing Shot" },
                    "lighting": "Golden Hour/Noir/High Key...",
                    "audio": { "music": "Mood...", "sfx": "Sounds...", "dialogue": "Speech..." },
                    "animation_note": "Disney Principle: Squash & Stretch / Anticipation...",
                    "action_intensity": 8,
                    "primary_focus": "Action",
                    "duration": ${template.beats[0].duration}
                },
                ...
            ]
        `;

      const result = await aiService.generateStructured(prompt);
      if (Array.isArray(result)) {
        // Map result to template structure to ensure safety
        const finalBeats = template.beats.map((b: BeatDefinition, i: number) => {
          const generated = result[i] || {};

          // Helper to create Audio Summary string from object or string
          const audioSummary = typeof generated.audio === 'object'
            ? `🎵 ${generated.audio.music || ''} | 🔊 ${generated.audio.sfx || ''} | 🗣️ ${generated.audio.dialogue || ''}`
            : generated.audio || '';

          return {
            id: (i + 1).toString(), // Force ID
            type: b.label,
            visual: generated.visual_prompt || generated.visual || '',
            audio: audioSummary,
            duration: b.duration,
            // New Anchors
            camera: generated.camera,
            lighting: generated.lighting,
            audioLayer: typeof generated.audio === 'object' ? generated.audio : undefined,
            animationNote: generated.animation_note,
            actionIntensity: typeof generated.action_intensity === 'number' ? generated.action_intensity : 3,
            primaryFocus: generated.primary_focus || 'Ambient',
            tags: generated.tags || []
          };
        });

        setBeatData(finalBeats);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate beats");
    } finally {
      setLocalGenerating(false);
    }
  };

  const updateBeat = (id: string, field: keyof BeatCard, value: any) => {
    const newBeats = beats.map(b => b.id === id ? { ...b, [field]: value } : b);
    setBeatData(newBeats);
  };

  const handleLockAndContinue = async () => {
    setVisualGenerating(true);
    try {
      // 3. Auto-Generate Descriptions
      const styleConfig = getStyleConfig(selectedStyle);
      // Pass vibe to asset generation
      const assets = await aiService.generateVisualDescriptions(beatData, styleConfig, genre, vibe, audience);

      onNext(assets);
    } catch (e) {
      console.error("Failed to generate visuals", e);
      // Proceed anyway if failure, or show error? For now proceed.
      onNext([]);
    } finally {
      setVisualGenerating(false);
    }
  };

  const isGenerating = parentIsGenerating || localGenerating || visualGenerating;

  return (
    <div className="flex flex-col w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">The Visual Beat Sheet</h2>
          <p className="text-gray-400">Map out your cartoon in 5 key moments using visual language.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleGenerateBeats}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
          >
            {isGenerating ? <Icon icon={ICONS.spinner} className="animate-spin" size={20} /> : <Icon icon={ICONS.sparkles} size={20} />}
            <span>Auto-Generate Beats</span>
          </button>
        </div>
      </div>





      {/* BOARD */}
      {/* BOARD */}
      <div className="pb-4">
        <div className="grid grid-cols-2 gap-6 px-2">
          {beats.map((beat, index) => (
            <motion.div
              key={beat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col h-full w-full"
            >
              {/* Card Header */}
              <div className={`
                            p-4 rounded-t-2xl flex flex-col gap-2 text-white
                            ${{
                              // 15s Micro-Short arc (Establish → Provoke → React → Escalate → Land)
                              'Establish':   'bg-emerald-700',
                              'Provoke':     'bg-indigo-600',
                              'React':       'bg-purple-600',
                              'Escalate':    'bg-pink-600',
                              'Land':        'bg-blue-600',
                              // Legacy 60s / longer format beats
                              'Setup':       'bg-blue-600',
                              'Incident':    'bg-indigo-600',
                              'Escalation':  'bg-purple-600',
                              'Climax':      'bg-pink-600',
                              'Resolution':  'bg-emerald-600',
                              // Other common beat names
                              'Status Quo':  'bg-slate-600',
                              'Problem':     'bg-orange-600',
                              'First Attempt': 'bg-amber-600',
                              'Second Attempt': 'bg-red-600',
                              'Outro':       'bg-teal-600',
                            }[beat.type] || 'bg-gray-700'}
                       `}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{index + 1}. {beat.type}</span>
                  <span className="text-xs bg-black/20 px-2 py-1 rounded bg-opacity-50 font-mono">
                    ~{beat.duration}s
                  </span>
                </div>

                {/* Hybrid Engine Decision Tags */}
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className={`px-2 py-1 rounded bg-black/30 flex items-center gap-1 ${beat.primaryFocus === 'Dialogue' ? 'text-blue-300' : beat.primaryFocus === 'Action' ? 'text-orange-300' : 'text-gray-300'}`}>
                    {beat.primaryFocus === 'Dialogue' ? '🗣️' : beat.primaryFocus === 'Action' ? '🎬' : '🎥'} {beat.primaryFocus || 'Action'}
                  </span>
                  <span className={`px-2 py-1 rounded bg-black/30 flex items-center gap-1 ${(beat.actionIntensity || 0) > 7 ? 'text-red-300' : 'text-gray-300'}`}>
                    ⚡ Intensity: {beat.actionIntensity || 5}/10
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 bg-[#1a1a1a] border border-[#262626] border-t-0 rounded-b-2xl p-4 flex flex-col gap-4 shadow-xl hover:border-gray-600 transition-colors group">

                {/* Visual Field */}
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                    <Icon icon={ICONS.eye} size={14} /> The Visual
                  </label>
                  <textarea
                    value={beat.visual}
                    onChange={(e) => updateBeat(beat.id, 'visual', e.target.value)}
                    placeholder="What do we SEE? (e.g. Anvil falls...)"
                    className="flex-1 w-full bg-[#0f0f0f] border border-[#333] rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500 resize-none placeholder:text-gray-700 min-h-[100px] disabled:opacity-50"
                    disabled={isHobbyist}
                  />
                </div>

                {/* Audio Field */}
                <div className="h-24 flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                    <Icon icon={ICONS.volume} size={14} /> Audio / SFX
                  </label>
                  <textarea
                    value={beat.audio}
                    onChange={(e) => updateBeat(beat.id, 'audio', e.target.value)}
                    placeholder="What do we HEAR? (e.g. BOING!)"
                    className="flex-1 w-full bg-[#0f0f0f] border border-[#333] rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500 resize-none placeholder:text-gray-700 disabled:opacity-50"
                    disabled={isHobbyist}
                  />
                </div>

                {/* CAMERA & ANIMATION (Accuracy & Creativity Anchors) */}
                <div className="flex gap-4">
                  {/* Camera Metadata */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                      Camera <span className="opacity-50 text-[10px]">Metadata</span>
                    </label>
                    <div className="bg-[#0f0f0f] border border-[#333] rounded-xl p-2 flex flex-col gap-2">
                      <select
                        className="bg-transparent text-xs text-gray-300 focus:outline-none w-full disabled:opacity-50"
                        value={beat.camera?.move || ''}
                        onChange={(e) => updateBeat(beat.id, 'camera', { ...beat.camera, move: e.target.value })}
                        disabled={isHobbyist}
                      >
                        <option value="">Move...</option>
                        <option value="Static">Static / Tripod</option>
                        <option value="Dolly In">Dolly In (Push)</option>
                        <option value="Dolly Out">Dolly Out (Pull)</option>
                        <option value="Tracking Shot">Tracking / Truck</option>
                        <option value="Orbit">Orbit / 360</option>
                        <option value="Whip Pan">Whip Pan</option>
                        <option value="Pan Left">Pan Left</option>
                        <option value="Pan Right">Pan Right</option>
                        <option value="Tilt Up">Tilt Up</option>
                        <option value="Tilt Down">Tilt Down</option>
                        <option value="Handheld">Handheld / Shake</option>
                      </select>
                      <div className="h-px bg-[#262626] w-full" />
                      <select
                        className="bg-transparent text-xs text-gray-300 focus:outline-none w-full disabled:opacity-50"
                        value={beat.camera?.angle || ''}
                        onChange={(e) => updateBeat(beat.id, 'camera', { ...beat.camera, angle: e.target.value })}
                        disabled={isHobbyist}
                      >
                        <option value="">Angle...</option>
                        <option value="Extreme Wide Shot">Extreme Wide (EWS)</option>
                        <option value="Wide Shot">Wide Shot (WS)</option>
                        <option value="Medium Shot">Medium Shot (MS)</option>
                        <option value="Close Up">Close Up (CU)</option>
                        <option value="Extreme Close Up">Extreme Close Up (ECU)</option>
                        <option value="Low Angle">Low Angle (Hero)</option>
                        <option value="High Angle">High Angle</option>
                        <option value="Dutch Angle">Dutch Angle (Tilt)</option>
                        <option value="Overhead">Overhead / Bird's Eye</option>
                      </select>
                    </div>
                  </div>

                  {/* LIGHTING & VIBE */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                      Lighting <span className="opacity-50 text-[10px]">Env</span>
                    </label>
                    <div className="bg-[#0f0f0f] border border-[#333] rounded-xl p-2 flex flex-col gap-2 h-full">
                      <select
                        className="bg-transparent text-xs text-yellow-500/80 focus:outline-none w-full h-full disabled:opacity-50"
                        value={beat.lighting || ''}
                        onChange={(e) => updateBeat(beat.id, 'lighting', e.target.value)}
                        disabled={isHobbyist}
                      >
                        <option value="">Select Lighting...</option>
                        <option value="Golden Hour">Golden Hour (Warm/Magical)</option>
                        <option value="Rim Lighting">Rim Lighting (Silhouette)</option>
                        <option value="Volumetric">Volumetric (God Rays)</option>
                        <option value="High Key">High Key (Bright/Happy)</option>
                        <option value="Low Key">Low Key (Dark/Noir)</option>
                        <option value="Neon">Neon / Cyberpunk</option>
                        <option value="Overcast">Soft / Overcast</option>
                        <option value="Hard Lighting">Hard / Dramatic</option>
                      </select>
                    </div>
                  </div>

                  {/* Animation Note */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                      Animation <span className="opacity-50 text-[10px]">Principles</span>
                    </label>
                    <textarea
                      value={beat.animationNote || ''}
                      onChange={(e) => updateBeat(beat.id, 'animationNote', e.target.value)}
                      placeholder="Squash & Stretch, Anticipation..."
                      className="flex-1 w-full bg-[#0f0f0f] border border-[#333] rounded-xl p-3 text-xs text-purple-200 focus:outline-none focus:border-purple-500 resize-none placeholder:text-gray-700 h-full disabled:opacity-50"
                      disabled={isHobbyist}
                    />
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </div>

      {/* SAVE VERSION ACTION */}
      {onSaveVersion && (
        <div className="flex flex-col gap-4 mt-6 px-2">
          <div className="flex justify-start">
            <button
              onClick={async () => {
                if (onSaveVersion) {
                  const btn = document.getElementById('save-version-btn');
                  if (btn) btn.innerText = 'Saving...';
                  try {
                    await onSaveVersion();
                    if (btn) {
                      btn.innerText = 'Saved!';
                      setTimeout(() => { if (btn) btn.innerHTML = '<span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Version Snapshot</span>'; }, 2000);
                    }
                  } catch (e) {
                    console.error(e);
                    if (btn) btn.innerText = 'Failed';
                  }
                }
              }}
              id="save-version-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm"
            >
              <Icon icon={ICONS.save} size={14} /> Save Version Snapshot
            </button>
          </div>

          {/* VERSION HISTORY LIST */}
          <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl animate-in slide-in-from-top-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon icon={ICONS.clock} size={12} /> Version History
            </h4>

            {versions.filter((v: any) => v.phase === 'beats').length === 0 ? (
              <div className="text-sm text-gray-600 italic">No saved versions yet.</div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                {versions.filter((v: any) => v.phase === 'beats').map((v: any) => (
                  <div key={v.id} className="flex justify-between items-center text-sm p-2 hover:bg-[#262626] rounded-lg group">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs font-mono">
                        {v.timestamp ? v.timestamp.toDate().toLocaleString() : 'Saving...'}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {(v.snapshotData.modules?.beats || []).length} beats
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Restore this version? Unsaved changes will be lost.")) {
                          if (v.snapshotData.modules?.beats) {
                            setBeatData(v.snapshotData.modules.beats);
                          }
                        }
                      }}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <div className="flex justify-between items-center mt-4 pt-6 border-t border-[#262626]">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl hover:bg-[#262626] text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>

        <button
          onClick={handleLockAndContinue}
          disabled={isGenerating}
          className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-900/30 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
        >
          {visualGenerating
            ? <><Icon icon={ICONS.spinner} className="animate-spin" /> Generating Assets...</>
            : <>Lock Beats & Continue &rarr;</>
          }
        </button>
      </div>
    </div>
  );
}
