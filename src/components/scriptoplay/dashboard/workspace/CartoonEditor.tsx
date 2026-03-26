'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion, AnimatePresence } from 'framer-motion';
// Reuse Phases for logic, but wrapped in new UI
import LoglinePhase from '@/components/scriptoplay/dashboard/workspace/LoglinePhase';
import BeatSheetPhase, { BeatCard } from '@/components/scriptoplay/dashboard/workspace/BeatSheetPhase';
import VisualGallery from '@/components/scriptoplay/dashboard/workspace/VisualGallery';
import AudioStudio from '@/components/scriptoplay/dashboard/workspace/AudioStudio';
import CartoonScriptAssembly from '@/components/scriptoplay/dashboard/workspace/CartoonScriptAssembly';
import ProductionPhase from '@/components/scriptoplay/dashboard/workspace/ProductionPhase';
import PostProductionPhase from '@/components/scriptoplay/dashboard/workspace/PostProductionPhase';
import ScriptBlender from '@/components/scriptoplay/dashboard/tools/ScriptBlender';
import { aiService } from '@/services/scriptoplay/aiService';
import { projectService } from '@/services/scriptoplay/projectService';
import { getCartoonTemplate, getAudienceGuidelines } from '@/utils/scriptoplay/cartoonTemplates';
import { VISUAL_STYLES, getStyleConfig } from '@/config/scriptoplay/styles';

// --- CONSTANTS ---
const CARTOON_PHASES = [
  { id: 'logline', label: '1. The Idea', icon: ICONS.sparkles, color: 'from-pink-500 to-rose-500' },
  { id: 'beats', label: '2. Beat Sheet', icon: ICONS.list, color: 'from-purple-500 to-indigo-500' },
  { id: 'visuals', label: '3. Visuals', icon: ICONS.image, color: 'from-cyan-500 to-blue-500' },
  { id: 'audio', label: '4. Audio', icon: ICONS.music || ICONS.volume, color: 'from-amber-500 to-orange-500' },
  { id: 'script', label: '5. Script', icon: ICONS.fileText, color: 'from-emerald-500 to-teal-500' },
  { id: 'production', label: '6. Production', icon: ICONS.video || ICONS.magic, color: 'from-pink-600 to-rose-600' },
  { id: 'post_production', label: '7. Post-Production', icon: ICONS.film, color: 'from-fuchsia-600 to-purple-800' },
];

export default function CartoonEditor({
  projectId, // Add projectId
  projectData,
  onSave,
  onSaveDraft,
  versions,
  isGenerated
}: any) {

  // Helper to enforce type: 'cartoon'
  const handleSave = (newData: any) => {
    onSave({
      ...newData,
      data: { ...newData.data, type: 'cartoon' } // For full project object
    });
    // However, onSave usually expects the Project DATA object directly, or the full project?
    // Looking at WorkspaceLayout: <CartoonEditor onSave={saveProject} ... />
    // useProject -> saveProject calls projectService.updateProject(id, newData)
    // So we just need to pass the data object with type='cartoon'
    // Let's wrap the passed onSave.
  };

  // Actually, let's keep it simple. We intercept specific save calls below.
  const safeSave = async (dataToSave: any) => {
    await onSave({ ...dataToSave, type: 'cartoon' });
  };

  const [phase, setPhase] = useState('logline');
  const [loglineText, setLoglineText] = useState("");

  const isHobbyist = ['Hobbyist', 'Demo'].includes(projectData?.tier) || ['Hobbyist', 'Demo'].includes(projectData?.modules?.tier);

  // Style & Audience & Genre & Vibe/Theme State
  const [selectedStyle, setSelectedStyle] = useState('pixar_3d');
  const [selectedAudience, setSelectedAudience] = useState('kids');
  const [selectedGenre, setSelectedGenre] = useState('Comedy');
  const [selectedVibe, setSelectedVibe] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [audioConfig, setAudioConfig] = useState<{ dialogue: string, sfx: string } | null>(null);

  // Beat Sheet State
  const [beatData, setBeatData] = useState<BeatCard[]>([]);
  const [isGeneratingBeats, setIsGeneratingBeats] = useState(false);

  // Script State — held in CartoonEditor (not just in projectData) to prevent regen on remount.
  // When CartoonScriptAssembly unmounts (phase change) and remounts, it receives the saved script
  // via this local state rather than waiting for the async Supabase save to propagate.
  const [scriptData, setScriptData] = useState<any[]>([]);

  // Sync Data
  useEffect(() => {
    // 1. If passed via URL param (from Wizard/Blender) - PRIORITIZE THIS
    // This handles the case where Firestore is stale after a redirect
    const urlLogline = getUrlParam('logline');

    if (urlLogline) {
      setLoglineText(decodeURIComponent(urlLogline));
      // We explicitly DO NOT fallback to projectData.logline here if URL param exists
    }
    else if (projectData && projectData.logline) {
      // 2. Only if NO URL param, use Project Data
      setLoglineText(projectData.logline);
    }

    // Load Style Config - Check BOTH root and modules for backward compatibility
    const loadedStyle = projectData?.style || projectData?.modules?.style;
    if (loadedStyle) setSelectedStyle(loadedStyle);

    const loadedAudience = projectData?.audience || projectData?.modules?.audience;
    if (loadedAudience) setSelectedAudience(loadedAudience);

    const loadedGenre = projectData?.genre || projectData?.modules?.genre;
    if (loadedGenre) setSelectedGenre(loadedGenre);

    const loadedVibe = projectData?.vibe || projectData?.modules?.vibe;
    if (loadedVibe) setSelectedVibe(loadedVibe);

    const loadedTheme = projectData?.theme || projectData?.modules?.theme;
    if (loadedTheme) setSelectedTheme(loadedTheme);

    const loadedAudioConfig = projectData?.audioConfig || projectData?.modules?.audioConfig;
    if (loadedAudioConfig) setAudioConfig(loadedAudioConfig);

    // Load existing beats if available (independent of logline source)
    if (projectData?.modules?.beats) {
      setBeatData(projectData.modules.beats);
    }

    // Load existing script — only populate if local state is empty to avoid overwriting in-progress work
    if (projectData?.modules?.script?.length > 0 && scriptData.length === 0) {
      setScriptData(projectData.modules.script);
    }

    console.log("DEBUG: CartoonEditor projectData:", projectData);
    console.log("DEBUG: CartoonEditor length:", projectData?.length, projectData?.modules?.length);
    console.log("DEBUG: Cartoon Config:", { genre: projectData?.genre, vibe: projectData?.vibe, theme: projectData?.theme });
  }, [projectData]);

  // Helper (since we can't use useSearchParams inside this inner component easily if not passed down)
  const getUrlParam = (key: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get(key);
    }
    return null;
  };

  const activePhaseIdx = CARTOON_PHASES.findIndex(p => p.id === phase);
  const currentPhaseConfig = CARTOON_PHASES.find(p => p.id === phase);

  // Save Helper
  const handleSaveBeats = () => {
    // We save beats into the project modules structure
    safeSave({
      ...projectData,
      modules: { ...projectData?.modules, beats: beatData }
    });
  };

  // Update Style Helpers
  const handleUpdateStyle = (id: string) => {
    setSelectedStyle(id);
    // Auto-save logic if needed, or wait for next save
  };

  const handleUpdateAudience = (id: string) => {
    setSelectedAudience(id);
  };


  // Save Helper for Audio
  const handleSaveAudio = (audioConfig: any) => {
    safeSave({
      ...projectData,
      modules: { ...projectData?.modules, audio: audioConfig }
    });
  };



  // ... (existing imports)

  // ... (inside component)
  // Versioning Helper
  const handleSaveVersion = async (phaseId: string) => {
    // Use projectId directly, or fallback to projectData.id if it exists (for backward compatibility?)
    const idToUse = projectId || projectData?.id;
    if (!idToUse) {
      console.error("No project ID found, cannot save version");
      return;
    }

    // 1. Force Save Current State based on Phase
    // This is tricky because we might have unsaved local state in the active component.
    // Ideally, the active component should call onSaveVersion() and we just handle the backend call.
    // BUT, CartoonEditor holds the 'beatData' state for example. 
    // So if we are in 'beats', we should ensure 'beatData' is saved to projectData first.

    let dataToSnapshot = { ...projectData };

    if (phase === 'beats') {
      dataToSnapshot = { ...dataToSnapshot, modules: { ...dataToSnapshot.modules, beats: beatData } };
    }
    // For other phases like Visuals/Audio/Script, we rely on them calling onNext (safeSave) 
    // OR we assume they synced their state to projectData already.
    // VisualGallery: local state is inside component? No, CartoonEditor doesn't hold Visuals state. Use projectData.



    // Let's refine dataToSnapshot to be the DATA object
    let currentData = { ...projectData.data };

    if (phase === 'beats') {
      currentData = { ...currentData, modules: { ...currentData.modules, beats: beatData } };
    }
    if (phase === 'logline') {
      currentData = { ...currentData, logline: loglineText };
    }

    if (onSaveDraft) {
      await onSaveDraft(phaseId, currentData);
    } else {
      await projectService.saveVersion(idToUse, phaseId, currentData);
    }

    // 3. Toast or Notify? (handled by UI usually)
  };

  // Helper to extract characters from assets
  const getCharacters = () => {
    // Ideally we pull from 'assets' in modules, filtering by type='Character'
    // For this prototype, we'll try to use the beat sheet data or just mock if empty
    // But wait, VisualGallery was storing local state. We need to persist VisualGallery state to projectData first!
    // VisualGallery calls 'onNext' but didn't seem to save back to projectData in previous code?
    // Ah, VisualGallery was using local 'assets'. We need to fix that if we want them here.
    // For now, let's assume we pass down what we have or fix VisualGallery.
    return projectData?.modules?.assets?.filter((a: any) => a.type === 'Character') || [];
  };


  return (
    <div className="w-full h-full flex flex-col relative bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* We can add a subtle pattern background here via CSS or absolute div */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

      {/* 1. GAMIFIED HEADER */}
      <div className="h-28 shrink-0 flex flex-col justify-center px-8 z-10 border-b border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto w-full">
          {/* Progress Track */}
          <div className="relative h-3 bg-[#262626] rounded-full mb-6 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${((activePhaseIdx + 1) / CARTOON_PHASES.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>

          {/* Steps */}
          <div className="flex justify-between relative">
            {CARTOON_PHASES.map((p, index) => {
              const isActive = phase === p.id;
              const isPast = activePhaseIdx > index;

              return (
                <button
                  key={p.id}
                  onClick={() => setPhase(p.id)}
                  className={`flex flex-col items-center gap-2 group transition-all relative z-10 ${isActive ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                >
                  <div className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300
                                    ${isActive || isPast ? `bg-gradient-to-br ${p.color} text-white` : 'bg-[#262626] text-gray-400'}
                                    ${isActive ? 'ring-4 ring-purple-500/20' : ''}
                                `}>
                    {isPast ? <Icon icon={ICONS.check} size={20} /> : <Icon icon={p.icon} size={20} />}
                  </div>
                  <span className={`text-xs font-bold tracking-wide uppercase ${isActive ? 'text-white' : 'text-gray-500'
                    }`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN FUN ZONE */}
      <div className={`flex-1 ${phase === 'production' ? 'overflow-hidden' : 'overflow-y-auto p-6 lg:p-10 pb-48'} scrollbar-thin scrollbar-thumb-purple-900/50 transition-all`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`${phase === 'production' ? 'h-full w-full' : 'max-w-7xl mx-auto min-h-full'}`}
          >
            {/* Phase 1: The Idea (Logline) */}
            {phase === 'logline' && (
              <div className="max-w-5xl mx-auto space-y-8">

                {/* Block 1: Script Blender (AI) */}
                <div className="bg-[#141414] border-2 border-[#262626] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                  {/* Decorative Blob */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-1000"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400 rotate-3">
                        <Icon icon={ICONS.blender} size={32} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">Script Blender</h2>
                        <p className="text-gray-400">Use our AI powered idea generator to brainstorm concepts.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams();
                        const idToUse = projectId || projectData?.id;
                        if (idToUse) params.set('projectId', idToUse);
                        // Pass config if we don't have an ID yet, so blender knows constraints
                        if (!idToUse && projectData) {
                          params.set('config', JSON.stringify(projectData));
                        }
                        window.open(`/scriptoplay/dashboard/cartoon-blender?${params.toString()}`, '_self');
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold shadow-lg shadow-purple-500/10 transition-all hover:-translate-y-1"
                    >
                      <Icon icon={ICONS.sparkles} size={18} className="text-purple-600" /> Open Generator
                    </button>
                  </div>
                </div>

                {/* OR Divider */}
                <div className="relative flex items-center justify-center py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#262626]"></div>
                  </div>
                  <div className="relative bg-[#0a0a0a] px-4 text-sm font-bold text-gray-500 uppercase tracking-widest">
                    OR
                  </div>
                </div>

                {/* Block 2: Manual Input */}
                <div className="bg-[#141414] border-2 border-[#262626] rounded-3xl p-8 shadow-2xl">
                  <LoglinePhase
                    value={loglineText}
                    onChange={setLoglineText}
                    isGenerated={isGenerated}
                    isMagicMode={false}
                    selectedStyle={selectedStyle}
                    onSelectStyle={handleUpdateStyle}
                    selectedAudience={selectedAudience}
                    onSelectAudience={handleUpdateAudience}
                    versions={versions?.filter((v: any) => v.phase === 'beats') || []}
                    onNext={() => {
                      safeSave({
                        logline: loglineText,
                        modules: { ...projectData?.modules, style: selectedStyle, audience: selectedAudience }
                      });
                      setPhase('beats');
                    }}
                    onSaveVersion={() => handleSaveVersion('logline')}
                    onGenerateBeatSheet={async () => {
                      if (!loglineText) return;
                      setIsGeneratingBeats(true);

                      // DYNAMIC LENGTH LOGIC VIA TEMPLATE
                      const length = projectData?.length || projectData?.modules?.length;

                      // Use Local State which is now correctly hydrated, or fallback to robust check
                      const audience = selectedAudience || projectData?.audience || projectData?.modules?.audience;
                      const styleID = selectedStyle || projectData?.style || projectData?.modules?.style;

                      const template = getCartoonTemplate(length);
                      const audienceGuidelines = getAudienceGuidelines(audience || 'General');

                      const styleConfig = getStyleConfig(styleID);
                      const styleNarrative = styleConfig?.narrativeInstructions || "Focus on visual storytelling.";

                      try {
                        const structureInstructions = template.beats.map((b: any, i: number) =>
                          `${i + 1}. ${b.label} (${b.duration}s): ${b.description}`
                        ).join('\n                            ');

                        const prompt = `
                            Act as a Cartoon Director.
                            Logline: "${loglineText}"
                            Target Duration: ${template.label} (${template.totalDuration}s)
                            TARGET AUDIENCE: ${audience || 'General'}.
                            SAFETY GUIDELINES: ${audienceGuidelines}

                            VISUAL STYLE: ${styleConfig?.label || 'Generic'}.
                            STYLE GUIDELINES: ${styleNarrative}

                            GENRE: ${selectedGenre || 'Comedy'}
                            VIBE: ${selectedVibe || 'Fun'}
                            THEME: ${selectedTheme || 'None'}
                            DIALOGUE STYLE: ${audioConfig?.dialogue || 'Standard'}

                            STRICT CONSTRAINT: Create exactly ${template.beats.length} beats.
                            Total Duration MUST be exactly ${template.totalDuration} seconds.
                            Follow this pacing structure strictly:

                            ${structureInstructions}

                            Focus on VISUAL GAGS and ACTION appropriate for the ${selectedGenre} genre.
                            Maintain a ${selectedVibe} atmosphere.
                            Avoid dialogue-heavy descriptions unless DIALOGUE STYLE is 'Witty' or 'Narrated'.

                            Output JSON array of objects with ALL fields — this data feeds directly into the script generator:
                            [
                                {
                                    "type": "${template.beats[0].label}",
                                    "visual": "Describe the scene visually in 1-2 sentences...",
                                    "audio": "Ambient sounds, SFX cues...",
                                    "duration": ${template.beats[0].duration},
                                    "camera": { "move": "Static|Pan|Dolly In|Tracking Shot", "angle": "Wide Shot|Medium Shot|Close Up|Low Angle" },
                                    "lighting": "High Key|Golden Hour|Soft Box|etc",
                                    "animation_note": "Disney principle: e.g. Squash & Stretch on impact",
                                    "action_intensity": 5,
                                    "primary_focus": "Action|Dialogue|Ambient|Establishing"
                                },
                                ...
                            ]
                        `;

                        const result = await aiService.generateStructured(prompt);
                        if (Array.isArray(result)) {
                          // Map result to template structure — include all director-level fields
                          // so CartoonScriptAssembly receives a rich beatContext (not empty camera/lighting)
                          const newBeats = template.beats.map((b: any, i: number) => {
                            const generated = result[i] || {};
                            return {
                              id: (i + 1).toString(),
                              type: b.label,
                              visual: generated.visual || '',
                              audio: generated.audio || '',
                              duration: b.duration,
                              camera: generated.camera || undefined,
                              lighting: generated.lighting || undefined,
                              animationNote: generated.animation_note || '',
                              actionIntensity: typeof generated.action_intensity === 'number' ? generated.action_intensity : 5,
                              primaryFocus: generated.primary_focus || 'Action',
                            };
                          });

                          setBeatData(newBeats);
                          // Save immediately
                          await safeSave({
                            ...projectData,
                            logline: loglineText,
                            modules: { ...projectData?.modules, beats: newBeats }
                          });
                          setPhase('beats');
                        }
                      } catch (e) {
                        console.error(e);
                        alert("Failed to generate beats");
                      } finally {
                        setIsGeneratingBeats(false);
                      }
                    }}
                    isGenerating={isGeneratingBeats}
                    onSaveDraft={onSaveDraft}
                    isHobbyist={isHobbyist}
                  />
                </div>

              </div>
            )}

            {/* Phase 2: Beat Sheet */}
            {phase === 'beats' && (
              <BeatSheetPhase
                logline={loglineText}
                beatData={beatData}
                setBeatData={setBeatData}
                selectedStyle={selectedStyle}
                length={projectData?.length || projectData?.modules?.length} // Pass Length Constraint
                audience={selectedAudience}
                genre={selectedGenre}
                vibe={selectedVibe}
                theme={selectedTheme}
                dialogueStyle={audioConfig?.dialogue}
                versions={versions?.filter((v: any) => v.phase === 'beats') || []}
                onSaveVersion={() => handleSaveVersion('beats')}
                isHobbyist={isHobbyist}
                onNext={async (visuals) => {
                  // Save Beats
                  let updatedModules = { ...projectData?.modules, beats: beatData };

                  // Save Visuals if generated
                  if (visuals && visuals.length > 0) {
                    const existingAssets = projectData?.modules?.assets || [];
                    const finalAssets = [...existingAssets];

                    // Sanitize visuals - ensure NO undefined values make it to Firestore
                    const cleanVisuals = visuals.map((v: any) => ({
                      id: v.id || Math.random().toString(),
                      name: v.name || 'Unnamed',
                      type: v.type || 'Character',
                      desc: v.description || v.desc || '',
                      prompt: v.prompt || '',
                      tags: Array.isArray(v.tags) ? v.tags : ['AI-Gen'],
                      role: v.role || 'Supporting',
                      consistencyLock: v.consistencyLock || '' // Preserve Consistency Lock
                    }));

                    // Deduplicate logic
                    cleanVisuals.forEach((newAsset: any) => {
                      const existingIndex = finalAssets.findIndex((ea: any) =>
                        (ea.name || '').toLowerCase().trim() === (newAsset.name || '').toLowerCase().trim() &&
                        ea.type === newAsset.type
                      );

                      if (existingIndex !== -1) {
                        // Merge updates
                        finalAssets[existingIndex] = {
                          ...finalAssets[existingIndex],
                          desc: newAsset.desc || finalAssets[existingIndex].desc || '',
                          role: newAsset.role || finalAssets[existingIndex].role || 'Supporting',
                          prompt: newAsset.prompt || finalAssets[existingIndex].prompt || '',
                          consistencyLock: newAsset.consistencyLock || finalAssets[existingIndex].consistencyLock || '',
                          tags: [...new Set([...(finalAssets[existingIndex].tags || []), ...(newAsset.tags || [])])]
                        };
                      } else {
                        finalAssets.push(newAsset);
                      }
                    });

                    updatedModules.assets = finalAssets;
                  }

                  // Use safeSave (Async) to ensure data is updated before phase switch
                  await safeSave({
                    ...projectData,
                    modules: updatedModules
                  });

                  setPhase('visuals');
                }}
                onBack={() => setPhase('logline')}
              />
            )}

            {/* Phase 3: Visuals */}
            {phase === 'visuals' && (
              <VisualGallery
                logline={loglineText}
                beats={beatData}
                data={projectData}
                onBack={() => setPhase('beats')}
                onNext={async (assets: any[]) => {
                  await safeSave({ ...projectData, modules: { ...projectData?.modules, assets } });
                  setPhase('audio');
                }}
                versions={versions}
                onSaveVersion={() => handleSaveVersion('visuals')}
                isHobbyist={isHobbyist}
              />
            )}

            {/* Phase 4: Audio Studio */}
            {phase === 'audio' && (
              <AudioStudio
                characters={getCharacters()}
                beats={beatData}
                onBack={() => setPhase('visuals')}
                onNext={() => setPhase('script')}
                onSaveConfig={async (audioConfig) => {
                  await safeSave({
                    ...projectData,
                    modules: { ...projectData?.modules, audio: audioConfig }
                  });
                }}
                audience={selectedAudience}
                style={selectedStyle}
                genre={selectedGenre}
                vibe={selectedVibe}
                theme={selectedTheme}
                initialData={projectData?.modules?.audio}
                isHobbyist={isHobbyist}
              />
            )}

            {/* Phase 5: Script Assembly */}
            {phase === 'script' && (
              <CartoonScriptAssembly
                logline={loglineText}
                beats={beatData}
                assets={projectData?.modules?.assets || []}
                // Merge local scriptData into config so CartoonScriptAssembly always sees the
                // latest script on remount — even before the async Supabase save completes.
                // This prevents the regen bug where navigating away + back triggers re-generation.
                config={{ ...projectData, modules: { ...projectData?.modules, script: scriptData } }}
                onNext={async (newScript) => {
                  setScriptData(newScript); // Sync local state immediately
                  await safeSave({ ...projectData, modules: { ...projectData?.modules, script: newScript } });
                  setPhase('production');
                }}
                onSave={(newScript) => {
                  // Sync local state immediately — this is what prevents regen on remount.
                  // The Supabase save is async (fire-and-forget here), but the local state
                  // update is synchronous, so remounting CartoonScriptAssembly will always
                  // find the script in config.modules.script and restore instead of regenerate.
                  setScriptData(newScript);
                  safeSave({ ...projectData, modules: { ...projectData?.modules, script: newScript } });
                }}
                onBack={() => setPhase('audio')}
                isHobbyist={isHobbyist}
              />
            )}

            {/* Phase 6: Production */}
            {phase === 'production' && (
              <ProductionPhase
                projectId={projectId || projectData?.id}
                projectData={projectData}
                onBack={() => setPhase('script')}
                onSave={safeSave}
                onNext={() => setPhase('post_production')}
                isHobbyist={isHobbyist}
              />
            )}

            {/* Phase 7: Post-Production */}
            {phase === 'post_production' && (
              <PostProductionPhase
                projectData={projectData}
                onBack={() => setPhase('production')}
                onSave={safeSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
