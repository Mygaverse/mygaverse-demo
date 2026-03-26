'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion } from 'framer-motion';
import { audioService } from '@/services/scriptoplay/audioService';
import { aiService } from '@/services/scriptoplay/aiService';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { assetService } from '@/services/scriptoplay/assetService';
import { storageService } from '@/services/scriptoplay/storageService';
import { VISUAL_STYLES } from '@/config/scriptoplay/styles';

type AudioStudioProps = {
  characters: any[]; // From Visual Assets
  beats?: any[];      // From Beat Sheet
  onBack: () => void;
  onNext: () => void;
  onSaveConfig: (config: any) => Promise<void> | void;
  versions?: any[];
  onSaveVersion?: () => void;
  audience?: string;
  style?: string; // raw style ID (e.g. 'pixar_3d')
  styleInstructions?: string; // resolved audio instructions text from style config
  genre?: string;
  vibe?: string;
  theme?: string;
  dialogueType?: string;
  sfxStyle?: string;
  initialData?: any;
  isHobbyist?: boolean;
};

type SoundtrackItem = {
  id: string;
  title: string;
  description: string;
  vibe: string;
  url?: string;
  status: 'planned' | 'generating' | 'completed' | 'failed';
  model: 'musicgen' | 'suno' | 'cassetteai';
};

const guessGender = (desc: string = '') => {
  const d = desc.toLowerCase();
  if (/\b(woman|girl|female|she|her|lady|queen|princess|mother|sister|daughter|aunt|grandma|matriarch|heroine)\b/.test(d)) return 'Female';
  if (/\b(man|boy|male|he|him|gentleman|king|prince|father|brother|son|uncle|grandpa|patriarch|hero|dude|guy)\b/.test(d)) return 'Male';
  return 'Neutral';
};

export default function AudioStudio({ characters, beats = [], onBack, onNext, onSaveConfig, versions = [], onSaveVersion, audience, style, styleInstructions, genre, vibe, theme, dialogueType, sfxStyle, initialData, isHobbyist }: AudioStudioProps) {

  const { user } = useAuth();

  // State
  const [voices, setVoices] = useState<any[]>([]);
  // Migrating from simple string to object. Check for legacy data on init.
  const [casting, setCasting] = useState<Record<string, { voiceId: string; speed: number; stability: number }>>({});
  const [bgm, setBgm] = useState<string>('Playful');
  const [isPlaying, setIsPlaying] = useState<string | null>(null); // voiceId playing

  // AI Recommendation State
  const [recommendations, setRecommendations] = useState<Record<string, { voiceId: string, reason: string }>>({});
  const [isCasting, setIsCasting] = useState(false);

  // Soundtrack State
  const [soundtrack, setSoundtrack] = useState<SoundtrackItem[]>([]);
  const [format, setFormat] = useState<'short' | 'long'>('short');
  const [targetVibe, setTargetVibe] = useState<string>(vibe || 'Playful');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [stopSignal, setStopSignal] = useState(false);

  const [musicModel, setMusicModel] = useState<'musicgen' | 'suno' | 'cassetteai'>('cassetteai');
  const [isComposing, setIsComposing] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null); // Visible error for soundtrack planning

  const isInitialDataLoaded = React.useRef(false);

  useEffect(() => {
    // Load voices only once
    audioService.getVoices().then(setVoices);
  }, []);

  useEffect(() => {
    // HYDRATE STATE FROM SAVED DATA ONLY ONCE
    if (initialData && !isInitialDataLoaded.current) {
      if (initialData.casting && Object.keys(initialData.casting).length > 0) {
        setCasting(initialData.casting);
      }
      if (initialData.bgm) setBgm(initialData.bgm);
      if (initialData.soundtrack && Array.isArray(initialData.soundtrack)) {
        setSoundtrack(initialData.soundtrack);
      }
      isInitialDataLoaded.current = true;
    }
  }, [initialData]);

  const handlePreview = async (config: { voiceId: string; speed: number; stability: number }) => {
    if (isPlaying) return; // Prevent overlapping plays
    setIsPlaying(config.voiceId);
    // Pass advanced config to preview
    await audioService.previewVoice(config.voiceId); // TODO: Update previewVoice to accept options too? For now just voiceId
    setIsPlaying(null);
  };

  const assignVoice = (charId: string, voiceId: string) => {
    setCasting(prev => ({
      ...prev,
      [charId]: {
        voiceId,
        speed: prev[charId]?.speed || 1.0,
        stability: prev[charId]?.stability || 0.5
      }
    }));
  };

  const updateVoiceSettings = (charId: string, setting: 'speed' | 'stability', value: number) => {
    setCasting(prev => ({
      ...prev,
      [charId]: {
        ...prev[charId],
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    onNext();
  };

  // --- AUTO SAVE LOGIC ---
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (onSaveConfig) {
        onSaveConfig({ casting, bgm, soundtrack });
      }
    }, 500); // Debounce saves by 500ms

    return () => clearTimeout(timer);
  }, [casting, bgm, soundtrack, onSaveConfig]);

  // Auto-Cast Effect or Button Handler
  const handleAutoCast = async () => {
    setIsCasting(true);
    try {
      if (voices.length === 0) return; // Wait for voices
      if (characters.length === 0) {
        setPlanError('No characters found. Go back to Visuals to create your cast first.');
        return;
      }
      const suggestions = await aiService.castVoices(characters, voices, audience);

      const newCasting: Record<string, { voiceId: string; speed: number; stability: number }> = {};
      const newRecs: Record<string, any> = {};

      suggestions.forEach((s: any) => {
        // Robust matching: try exact id match first, then name match as fallback
        const matchedVoice = voices.find(v =>
          v.id === s.voiceId ||
          v.name.toLowerCase() === s.voiceId.toLowerCase() ||
          v.id === s.name ||
          (s.name && v.name.toLowerCase() === s.name.toLowerCase())
        );
        const resolvedVoiceId = matchedVoice ? matchedVoice.id : s.voiceId;

        // Use s.characterId directly — AI is now instructed to copy the exact id
        const charId = s.characterId || s.character_id || s.character || s.id;

        if (charId) {
          newCasting[charId] = { voiceId: resolvedVoiceId, speed: 1.0, stability: 0.5 };
          newRecs[charId] = { voiceId: resolvedVoiceId, reason: s.reason };
        }
      });

      setCasting(prev => ({ ...prev, ...newCasting }));
      setRecommendations(newRecs);
    } catch (e) {
      console.error("Auto cast failed", e);
    } finally {
      setIsCasting(false);
    }
  };

  const stopSignalRef = React.useRef(false);

  const handlePlanSoundtrack = async () => {
    setIsPlanning(true);
    setPlanError(null);

    // Guard: can't compose a score without beat data
    if (!beats || beats.length === 0) {
      setPlanError('No beat sheet found. Go back to the Beat Sheet phase and generate beats first.');
      setIsPlanning(false);
      return;
    }

    try {
      // Use resolved audioInstructions if provided, else fall back to raw style ID
      const musicStyle = styleInstructions || style;
      const plan = await aiService.composeSoundtrack(beats, format, audience, musicStyle, genre, targetVibe, theme, sfxStyle);

      // Guard: AI sometimes returns an object instead of array
      const planArray = Array.isArray(plan) ? plan : [];

      if (planArray.length === 0) {
        setPlanError('AI returned an empty plan. Make sure your beat sheet has content, or try a different vibe.');
        return;
      }

      const newPlan: SoundtrackItem[] = planArray.map((p: any, i: number) => ({
        id: `track-${Date.now()}-${i}`,
        title: p.title || `Track ${i + 1}`,
        description: p.description || '',
        vibe: Array.isArray(p.vibe) ? p.vibe.join(', ') : (p.vibe || ''),
        status: 'planned',
        model: musicModel
      }));
      setSoundtrack(newPlan);
    } catch (e: any) {
      console.error('Soundtrack planning failed:', e);
      setPlanError(e?.message || 'Planning failed. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGenerateTrack = async (id: string) => {
    // Find track from current state (closure might be stale, but functional update handles write)
    // We assume track data (prompt) doesn't change mid-stream for now.
    let track = soundtrack.find(t => t.id === id);
    if (!track) return;

    setSoundtrack(prev => prev.map(t => t.id === id ? { ...t, status: 'generating' } : t));

    try {
      const prompt = `${track.vibe} ${track.description}, ${style} style`;
      // musicgen is hard-capped at 30s; cassetteai supports 10-180s (default 30s for speed)
      const duration = track.model === 'musicgen' ? 30 : 30;
      const url = await audioService.generateMusic(prompt, duration, track.model);

      if (url) {
        setSoundtrack(prev => prev.map(t => t.id === id ? { ...t, status: 'completed', url } : t));
        if (soundtrack.length === 1 || format === 'short') {
          setBgm(url);
        }

        // --- PERSIST TO ASSETS LIBRARY ---
        if (user?.uid) {
          try {
            console.log("Uploading audio track to storage...");
            // 1. Fetch blob from local blob URL
            const blobRes = await fetch(url);
            const blob = await blobRes.blob();

            // 2. Upload to Supabase Storage
            const timestamp = Date.now();
            const storagePath = `users/${user.uid}/assets/${timestamp}_audio_${id}.mp3`;
            const finalUrl = await storageService.uploadFile(storagePath, blob);
            console.log("Audio uploaded, final URL:", finalUrl);

            // 3. Save DB Record
            await assetService.saveAsset(user.uid, {
              type: 'audio',
              url: finalUrl,
              name: track.title || `Soundtrack - ${track.vibe}`,
              prompt: prompt,
              metadata: {
                style: style || 'default',
                genre: genre,
                vibe: vibe,
                description: track.description
              }
            });
            console.log("Audio asset metadata saved to library");

            // Note: We don't necessarily need to replace 'url' in local state immediately 
            // since 'blob:' works while on page, but it's safer for safeSave.
            setSoundtrack(prev => prev.map(t => t.id === id ? { ...t, url: finalUrl } : t));
            if (soundtrack.length === 1 || format === 'short') {
              setBgm(finalUrl);
            }

          } catch (err) {
            console.error("Failed to save audio asset to storage", err);
          }
        }

      } else {
        setSoundtrack(prev => prev.map(t => t.id === id ? { ...t, status: 'failed' } : t));
      }
    } catch (e) {
      setSoundtrack(prev => prev.map(t => t.id === id ? { ...t, status: 'failed' } : t));
    }
  };

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    stopSignalRef.current = false;
    setStopSignal(false);

    // Copy current queue
    const queue = [...soundtrack];

    for (const track of queue) {
      if (stopSignalRef.current) break;
      if (track.status === 'completed') continue;

      await handleGenerateTrack(track.id);
    }

    setIsGeneratingAll(false);
    setStopSignal(false);
  };

  const stopGeneration = () => {
    stopSignalRef.current = true;
    setStopSignal(true);
    setIsGeneratingAll(false);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Audio Studio</h2>
          <p className="text-gray-400">Cast the voices and set the vibe.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full overflow-hidden">

        {/* LEFT: CASTING BOARD */}
        {/* LEFT: CASTING BOARD */}
        <div className="lg:col-span-3 overflow-y-auto pr-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Icon icon={ICONS.usersMenu || ICONS.user} className="text-purple-500" size={24} />
              <span>Casting Board</span>
            </h3>
            <button
              onClick={handleAutoCast}
              disabled={isCasting}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all text-xs font-bold bg-purple-600/20 text-purple-400 border-purple-500/30 hover:bg-purple-600 hover:text-white disabled:opacity-50`}
            >
              {isCasting ? <Icon icon={ICONS.spinner} className="animate-spin" /> : <Icon icon={ICONS.sparkles} />}
              <span>Auto-Cast Voices</span>
            </button>
          </div>

          <div className="space-y-4">
            {characters.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-[#262626] rounded-xl text-gray-500">
                No characters found. Go back to Visuals to create your cast.
              </div>
            )}

            {characters.map((char) => {
              const charCasting = casting[char.id];
              const voiceId = charCasting?.voiceId || '';

              return (
                <div key={char.id} className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col gap-4 group hover:border-purple-500/30 transition-all">

                  <div className="flex items-start gap-4">
                    {/* Character Avatar */}
                    <div className="w-16 h-16 rounded-full bg-[#262626] border-2 border-gray-700 overflow-hidden shrink-0">
                      {char.image ? (
                        <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Icon icon={ICONS.user} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-lg break-words leading-tight">{char.name}</h4>
                          <p className="text-xs text-gray-500 break-words mt-1 line-clamp-3" title={char.desc}>{char.desc}</p>
                        </div>
                        {/* Recommendation Badge */}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Badge (Moved) */}
                  {recommendations[char.id] && (
                    <div className="text-xs text-purple-400 bg-purple-900/20 border border-purple-500/20 rounded-lg p-2 flex items-center gap-2 animate-in fade-in">
                      <Icon icon={ICONS.sparkles} size={14} className="shrink-0" />
                      <span className="font-medium">AI Suggestion: {recommendations[char.id].reason}</span>
                    </div>
                  )}

                  {/* Voice Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Voice Selection */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-600 mb-1 block">Voice Persona</label>
                      <div className="flex gap-2">
                        <select
                          value={voiceId}
                          onChange={(e) => assignVoice(char.id, e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#333] text-sm text-gray-300 rounded-lg p-2 focus:border-purple-500 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Select Voice --</option>
                          {(() => {
                            const charGender = guessGender(char.desc);
                            let validVoices = voices.filter(v =>
                              v.id === voiceId ||
                              charGender === 'Neutral' ||
                              v.gender === 'Neutral' ||
                              v.gender === charGender
                            );
                            if (validVoices.length === 0) validVoices = voices;

                            return validVoices.map(v => {
                              const tags = v.tags && Array.isArray(v.tags) ? ` • ${v.tags.slice(0, 2).join(', ')}` : '';
                              return (
                                <option key={v.id} value={v.id}>
                                  {v.name} ({v.gender}){tags} {recommendations[char.id]?.voiceId === v.id ? '✨' : ''}
                                </option>
                              );
                            });
                          })()}
                        </select>
                        {/* Preview Button */}
                        {voiceId && (
                          <button
                            onClick={() => handlePreview(charCasting)}
                            className="p-2 bg-[#262626] rounded-lg text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                            title="Audition"
                          >
                            <Icon icon={isPlaying === voiceId ? ICONS.close : ICONS.play || ICONS.smile} size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Advanced Settings (Speed / Stability) */}
                    {voiceId && (
                      <div className="space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase font-bold text-gray-600 w-16">Speed: {charCasting.speed}x</label>
                          <input
                            type="range"
                            min="0.25" max="2.0" step="0.25"
                            value={charCasting.speed}
                            onChange={(e) => updateVoiceSettings(char.id, 'speed', parseFloat(e.target.value))}
                            className="flex-1 accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase font-bold text-gray-600 w-16">Stability: {charCasting.stability}</label>
                          <input
                            type="range"
                            min="0" max="1.0" step="0.1"
                            value={charCasting.stability}
                            onChange={(e) => updateVoiceSettings(char.id, 'stability', parseFloat(e.target.value))}
                            className="flex-1 accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              )
            })}
          </div>
        </div>

        {/* RIGHT: SOUNDTRACK COMPOSER */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden pb-20">

          {/* Header */}
          <div className="shrink-0 mb-4 bg-[#1a1a1a] p-3 rounded-xl border border-[#333] flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Icon icon={ICONS.music} className="text-cyan-500" size={24} />
              <span>Soundtrack Planner</span>
            </h3>
          </div>

          <div className="shrink-0 flex flex-col gap-3">
            {/* Planner Controls */}
            <div className="flex justify-between items-center bg-[#141414] border border-[#262626] p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400 font-bold">Vibe:</label>
                <select
                  value={targetVibe}
                  onChange={(e) => setTargetVibe(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] text-xs text-gray-300 rounded-lg p-1.5 focus:border-cyan-500 outline-none"
                >
                  <option value="Playful">Playful / Fun</option>
                  <option value="Epic">Epic / Cinematic</option>
                  <option value="Dark">Dark / Tense</option>
                  <option value="Ambient">Ambient / Chill</option>
                  <option value="Upbeat">Upbeat / Energetic</option>
                  <option value="Emotional">Emotional / Sad</option>
                  <option value="Quirky">Quirky / Weird</option>
                  <option value="Lo-Fi">Lo-Fi Beats</option>
                </select>
              </div>

              {/* Format Toggle */}
              <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-[#333]">
                <button
                  onClick={() => setFormat('short')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${format === 'short' ? 'bg-cyan-900 text-cyan-400' : 'text-gray-500 hover:text-white disabled:opacity-50'}`}
                >
                  Short ({'<'}30s)
                </button>
                <button
                  onClick={() => setFormat('long')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${format === 'long' ? 'bg-cyan-900 text-cyan-400' : 'text-gray-500 hover:text-white disabled:opacity-50'}`}
                >
                  Long ({'>'}30s)
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {planError && (
              <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>⚠</span>
                <span>{planError}</span>
                <button onClick={() => setPlanError(null)} className="ml-auto text-red-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col gap-2 bg-[#141414] border border-[#262626] p-2 rounded-xl">
              {soundtrack.length === 0 ? (
                <button
                  disabled={isPlanning}
                  onClick={handlePlanSoundtrack}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isPlanning ? <Icon icon={ICONS.spinner} className="animate-spin" size={14} /> : <Icon icon={ICONS.sparkles} size={14} />}
                  Plan Music Score
                </button>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    <button
                      disabled={isGeneratingAll || isPlanning}
                      onClick={handlePlanSoundtrack} // Re-plan
                      className="flex-1 py-2 bg-[#262626] hover:bg-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2"
                      title="Re-Plan Score"
                    >
                      {isPlanning ? <Icon icon={ICONS.spinner} className="animate-spin" size={14} /> : <Icon icon={ICONS.refresh || ICONS.magic} size={14} />}
                      Re-Plan Score
                    </button>

                    {!isHobbyist && !isGeneratingAll && (
                      <button
                        onClick={handleGenerateAll}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2"
                      >
                        <Icon icon={ICONS.play} size={14} />
                        Generate All ({soundtrack.length})
                      </button>
                    )}
                    {!isHobbyist && isGeneratingAll && (
                      <button
                        onClick={stopGeneration}
                        className="flex-1 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 animate-pulse"
                      >
                        <Icon icon={ICONS.close} size={14} />
                        Stop Generation
                      </button>
                    )}
                  </div>
                  {isHobbyist && (
                    <div className="w-full py-2 bg-cyan-900/20 text-cyan-500 border border-cyan-500/20 rounded-lg text-xs font-bold text-center">
                      AI Ambient Audio will attach during Render
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex-1 overflow-y-auto">
            {soundtrack.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                <Icon icon={ICONS.music} size={48} className="mb-4" />
                <p className="text-sm text-center">Select format and click "Plan Music Score"<br />to start composing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {soundtrack.map((track) => (
                  <div key={track.id} className={`bg-[#0a0a0a] border ${track.status === 'completed' ? 'border-cyan-500/30' : 'border-[#262626]'} p-3 rounded-xl transition-all`}>
                    {/* Track Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-200">{track.title}</h4>
                        <span className="text-[10px] text-cyan-400">{track.vibe}</span>
                      </div>
                      {/* Status Badge - Hidden for Hobbyists since they don't generate individually */}
                      {!isHobbyist && (
                        <div className={`text-[10px] px-2 py-0.5 rounded-full border ${track.status === 'completed' ? 'bg-green-900/20 text-green-400 border-green-500/20' :
                          track.status === 'generating' ? 'bg-blue-900/20 text-blue-400 border-blue-500/20' :
                            track.status === 'failed' ? 'bg-red-900/20 text-red-400 border-red-500/20' :
                              'bg-gray-800 text-gray-500 border-gray-700'
                          }`}>
                          {track.status === 'generating' ? 'Generating...' : track.status}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mb-3 line-clamp-2" title={track.description}>{track.description}</p>

                    {/* Controls Area (Only for Pro/Elite) */}
                    {!isHobbyist && (
                      <div className="flex flex-col gap-2 mt-2">
                        {track.status === 'completed' && track.url ? (
                          <div className="space-y-2">
                            <audio controls src={track.url} className="w-full h-8" />
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <select
                              className="bg-[#1a1a1a] text-[10px] text-gray-300 p-1.5 rounded border border-[#333] outline-none flex-1 disabled:opacity-50"
                              value={track.model}
                              onChange={(e) => {
                                const newModel = e.target.value as 'musicgen' | 'suno' | 'cassetteai';
                                setSoundtrack(prev => prev.map(t => t.id === track.id ? { ...t, model: newModel } : t));
                              }}
                              disabled={track.status === 'generating' || isGeneratingAll}
                            >
                              <option value="cassetteai">Fast · CassetteAI (Fal)</option>
                              <option value="musicgen">Clip · MusicGen (30s)</option>
                              <option value="suno">Quality · Suno (Full)</option>
                            </select>
                            <button
                              disabled={track.status === 'generating' || isGeneratingAll}
                              onClick={() => handleGenerateTrack(track.id)}
                              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[100px] ${track.status === 'generating'
                                ? 'bg-blue-900/40 text-blue-300 border border-blue-500/40 cursor-wait'
                                : 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-600 hover:text-white border border-cyan-500/30 disabled:opacity-50'
                                }`}
                            >
                              {track.status === 'generating' ? (
                                <>
                                  <Icon icon={ICONS.spinner} size={14} />
                                  <span>Generating...</span>
                                </>
                              ) : 'Generate Preview'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER NAV */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#262626]">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl hover:bg-[#262626] text-gray-400 hover:text-white transition-colors"
        >
          Back to Visuals
        </button>
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-900/30 transition-all"
        >
          Save & Generate Script &rarr;
        </button>
      </div>
    </div>
  );
}
