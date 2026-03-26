import React, { useState, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import HobbyistPostProductionPhase from './HobbyistPostProductionPhase';

interface PostProductionPhaseProps {
  projectData: any;
  onBack: () => void;
  onSave: (data: any) => void;
  onFinish?: () => void;
  versions?: any[];
  onSaveVersion?: () => void;
  isHobbyist?: boolean;
}

export default function PostProductionPhase({ projectData, onBack, onSave, onFinish, versions = [], onSaveVersion, isHobbyist }: PostProductionPhaseProps) {
  if (isHobbyist) {
    return <HobbyistPostProductionPhase projectData={projectData} onBack={onBack} onFinish={onFinish || (() => { })} />;
  }

  const [scenes, setScenes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'captions' | 'transitions' | 'vfx'>('video');

  // Post Production State
  const [config, setConfig] = useState({
    intro: { enabled: false, text: '', style: 'cinematic' },
    outro: { enabled: false, text: '', style: 'fade' },
    captions: { enabled: false, style: 'karaoke', color: '#ffffff' },
    transitions: { default: 'cut' },
    soundtrackMix: { enabled: true, volume: 50 },
    vfx: { filmGrain: false, vignette: false },
  });

  const [isAssembling, setIsAssembling] = useState(false);
  const [assembleProgress, setAssembleProgress] = useState<{ msg: string; ratio?: number }>({ msg: '' });
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!finalVideoUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(finalVideoUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${projectData?.title || 'Scriptoplay_Cartoon'}_final.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert('Download failed. Right-click the video and select "Save Video As" instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (projectData?.modules?.script) {
      setScenes(projectData.modules.script);
    }
    if (projectData?.modules?.postProduction) {
      setConfig(projectData.modules.postProduction);
      if (projectData.modules.postProduction.finalOutputUrl) {
        setFinalVideoUrl(projectData.modules.postProduction.finalOutputUrl);
      }
    }
  }, [projectData]);

  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    // Auto save to project
    if (onSave) {
      onSave({
        ...projectData,
        modules: { ...projectData.modules, postProduction: newConfig }
      });
    }
  };

  const handleAssemble = async () => {
    setIsAssembling(true);

    const steps = [
      'Sending scenes to server...',
      'Downloading clips server-side...',
      'Muxing scene audio tracks...',
      'Concatenating timeline...',
      'Mixing soundtrack (BGM)...',
      'Applying VFX...',
      'Uploading final render...',
    ];
    let stepIdx = 0;

    // Cycle through steps to give the user progress feedback
    setAssembleProgress({ msg: steps[0], ratio: 0 });
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setAssembleProgress({ msg: steps[stepIdx], ratio: stepIdx / steps.length });
    }, 10000); // advance message every 10s

    try {
      const bgmUrl = projectData?.modules?.audio?.bgm;
      const projectId = projectData?.id || 'unknown';

      const response = await fetch('/api/scriptoplay/assemble-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes,
          bgmUrl,
          vfx: config.vfx,
          projectId,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Assembly failed (${response.status})`);
      }

      const { url: outputUrl } = await response.json();

      if (outputUrl) {
        setFinalVideoUrl(outputUrl);
        updateConfig({ finalOutputUrl: outputUrl });
        setAssembleProgress({ msg: 'Complete! 🎬', ratio: 1 });
      }
    } catch (e: any) {
      clearInterval(stepInterval);
      console.error('[PostProduction] Assembly error:', e);
      setAssembleProgress({ msg: `Error: ${e.message}`, ratio: 0 });
      alert(`Assembly Failed: ${e.message}`);
    } finally {
      setIsAssembling(false);
    }
  };


  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] overflow-hidden text-white font-sans">

      {/* HEADER */}
      <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <Icon icon={ICONS.chevronLeft} />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Icon icon={ICONS.film} className="text-purple-500" />
            Post-Production Suite
          </h1>
        </div>
        <div>
          <button
            onClick={handleAssemble}
            disabled={isAssembling || scenes.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            {isAssembling ? (
              <><Icon icon={ICONS.spinner} className="animate-spin" /> {assembleProgress.msg || 'ASSEMBLING TIMELINE...'}</>
            ) : (
              <><Icon icon={ICONS.magic} /> RENDER FINAL VIDEO</>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - TOOLBOX */}
        <div className="w-80 border-r border-[#262626] bg-[#0f0f0f] flex flex-col">
          <div className="p-4 grid grid-cols-2 gap-2 border-b border-[#262626]">
            {[
              { id: 'video', label: 'Title & End', icon: ICONS.image },
              { id: 'captions', label: 'Captions', icon: ICONS.fileText },
              { id: 'transitions', label: 'Transitions', icon: ICONS.sparkles },
              { id: 'vfx', label: 'FX & Color', icon: ICONS.magic },
              { id: 'audio', label: 'Audio Mix', icon: ICONS.music },
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all
                  ${activeTab === tab.id ? 'bg-[#262626] text-white border border-[#444]' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'}
                `}
              >
                <Icon icon={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* VIDEO TAB */}
            {activeTab === 'video' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Intro Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Intro Scene</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={config.intro.enabled}
                        onChange={e => updateConfig({ intro: { ...config.intro, enabled: e.target.checked } })} />
                      <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  {config.intro.enabled && (
                    <div className="space-y-3 p-3 bg-[#141414] rounded-xl border border-[#262626]">
                      <input
                        type="text"
                        placeholder="e.g. A Scriptoplay Production"
                        value={config.intro.text}
                        onChange={e => updateConfig({ intro: { ...config.intro, text: e.target.value } })}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-white"
                      />
                      <select
                        value={config.intro.style}
                        onChange={e => updateConfig({ intro: { ...config.intro, style: e.target.value } })}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-gray-300"
                      >
                        <option value="cinematic">Cinematic Fade In</option>
                        <option value="typewriter">Typewriter Reveal</option>
                        <option value="bold">Bold & Action</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Outro Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Outro Scene</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={config.outro.enabled}
                        onChange={e => updateConfig({ outro: { ...config.outro, enabled: e.target.checked } })} />
                      <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  {config.outro.enabled && (
                    <div className="space-y-3 p-3 bg-[#141414] rounded-xl border border-[#262626]">
                      <input
                        type="text"
                        placeholder="e.g. Thanks for watching!"
                        value={config.outro.text}
                        onChange={e => updateConfig({ outro: { ...config.outro, text: e.target.value } })}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CAPTIONS TAB */}
            {activeTab === 'captions' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Subtitles</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={config.captions.enabled}
                      onChange={e => updateConfig({ captions: { ...config.captions, enabled: e.target.checked } })} />
                    <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {config.captions.enabled && (
                  <div className="space-y-4 p-4 bg-[#141414] border border-[#262626] rounded-xl">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Caption Style</label>
                      <select
                        value={config.captions.style}
                        onChange={e => updateConfig({ captions: { ...config.captions, style: e.target.value } })}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-gray-300"
                      >
                        <option value="karaoke">Karaoke (Word by word pop)</option>
                        <option value="cinematic">Cinematic (Bottom classic)</option>
                        <option value="tiktok">Social (Large center)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Highlight Color</label>
                      <div className="flex gap-2">
                        {['#ffffff', '#fcd34d', '#34d399', '#f472b6', '#38bdf8'].map(color => (
                          <button
                            key={color}
                            onClick={() => updateConfig({ captions: { ...config.captions, color } })}
                            className={`w-6 h-6 rounded-full border-2 ${config.captions.color === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRANSITIONS TAB */}
            {activeTab === 'transitions' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Global Transitions</h3>
                  <p className="text-xs text-gray-500 mb-4">Select how scenes blend into each other across the entire timeline.</p>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cut', label: 'Hard Cut', icon: ICONS.list },
                      { id: 'fade', label: 'Fade to Black', icon: ICONS.moon },
                      { id: 'dissolve', label: 'Cross Dissolve', icon: ICONS.shuffle },
                      { id: 'wipe', label: 'Action Wipe', icon: ICONS.play }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateConfig({ transitions: { default: t.id } })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${config.transitions.default === t.id ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-[#141414] border-[#262626] text-gray-500 hover:border-[#444] hover:text-gray-300'}`}
                      >
                        <Icon icon={t.icon} size={20} />
                        <span className="text-[10px] font-bold uppercase">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AUDIO TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Master Mix</h3>
                  <Icon icon={ICONS.music} className="text-gray-500" />
                </div>
                <div className="space-y-4 p-4 bg-[#141414] border border-[#262626] rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest break-words leading-relaxed">
                    This controls the master volume level of your generated soundtrack relative to character dialogue and sound effects.
                  </p>
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                      <span>Background ({config.soundtrackMix.volume}%)</span>
                      <span>Foreground</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="100"
                      value={config.soundtrackMix.volume}
                      onChange={e => updateConfig({ soundtrackMix: { ...config.soundtrackMix, volume: parseInt(e.target.value) } })}
                      className="w-full h-2 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VFX TAB */}
            {activeTab === 'vfx' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Global Film Grain</h3>
                      <p className="text-[10px] text-gray-500">Adds cinematic texture across the entire timeline to unify clips.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={config.vfx.filmGrain}
                        onChange={e => updateConfig({ vfx: { ...config.vfx, filmGrain: e.target.checked } })} />
                      <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Cinematic Vignette</h3>
                      <p className="text-[10px] text-gray-500">Soft dark edges drawing focus to the center.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={config.vfx.vignette}
                        onChange={e => updateConfig({ vfx: { ...config.vfx, vignette: e.target.checked } })} />
                      <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* CENTER PANEL - THE THEATER */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black relative">

          <div className="w-full max-w-4xl aspect-video bg-[#050505] border border-[#262626] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative items-center justify-center">

            {finalVideoUrl ? (
              <video src={finalVideoUrl} controls className="w-full h-full object-contain" />
            ) : isAssembling ? (
              <div className="flex flex-col items-center">
                <Icon icon={ICONS.spinner} size={64} className="text-purple-500 animate-spin opacity-50 mb-4" />
                <p className="text-purple-400 font-bold uppercase tracking-widest">{assembleProgress.msg}</p>
                {assembleProgress.ratio !== undefined && (
                  <div className="w-64 h-2 bg-[#262626] rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${(assembleProgress.ratio * 100)}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Icon icon={ICONS.play} size={64} className="text-white/10" />
                <p className="mt-4 text-gray-600 font-mono text-sm tracking-widest">TIMELINE PREVIEW UNAVAILABLE</p>
                <p className="text-gray-700 text-xs mt-2">Server-side rendering required for composite preview.</p>
              </>
            )}

            {/* Overlay Mock Captions Example */}
            {config.captions.enabled && !finalVideoUrl && (
              <div className="absolute bottom-10 left-0 w-full text-center">
                <span className={`text-2xl font-black italic shadow-black drop-shadow-lg px-2 py-1 rounded`} style={{ color: config.captions.color, textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000' }}>
                  "Preview of your caption style..."
                </span>
              </div>
            )}
          </div>

          {/* Download action bar — visible after render completes */}
          {finalVideoUrl && (
            <div className="w-full max-w-4xl mt-4 flex flex-col gap-3">
              {/* Re-render warning */}
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">⚠️</span>
                <p className="text-yellow-300 text-xs leading-relaxed">
                  <strong>Download before re-rendering.</strong> Re-renders overwrite this file in storage.
                  Your current render is saved and will be replaced if you click Render Final Video again.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30"
                >
                  <Icon icon={isDownloading ? ICONS.spinner : ICONS.download} className={isDownloading ? 'animate-spin' : ''} />
                  {isDownloading ? 'Downloading...' : 'Download MP4'}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(finalVideoUrl); alert('Link copied!'); }}
                  className="px-5 py-3 bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] hover:border-gray-500 text-gray-300 hover:text-white font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                  <Icon icon={ICONS.copy} />
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {/* SIMULATED TIMELINE TRACK */}
          <div className="w-full max-w-5xl mt-8 bg-[#0f0f0f] border border-[#262626] h-24 rounded-xl flex overflow-hidden shadow-xl">

            {/* Intro Block */}
            {config.intro.enabled && (
              <div className="w-16 h-full bg-purple-900/30 border-r border-[#333] flex flex-col items-center justify-center group relative cursor-pointer hover:bg-purple-900/50 transition-colors shrink-0">
                <Icon icon={ICONS.image} size={14} className="text-purple-400 mb-1" />
                <span className="text-[10px] font-mono text-purple-300">INTRO</span>
              </div>
            )}

            {/* Dynamic Scenes */}
            <div className="flex-1 flex overflow-x-auto scrollbar-none">
              {scenes.length > 0 ? scenes.map((scene, i) => (
                <div key={scene.id} className="h-full border-r border-[#262626] min-w-[120px] flex-1 flex flex-col relative bg-[#141414]">
                  {/* Scene Thumbnail / Visual indicator */}
                  <div className="h-10 border-b border-[#262626] bg-[#0a0a0a] flex items-center px-2 opacity-50 relative overflow-hidden">
                    {scene.production_video ? (
                      <div className="absolute inset-0 bg-green-500/10"></div>
                    ) : (
                      <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-500">MISSING 🎥</div>
                    )}
                    <span className="text-[10px] text-gray-500 font-bold z-10">SCENE {i + 1}</span>
                  </div>
                  {/* Scene Info */}
                  <div className="p-2 flex-1">
                    <p className="text-[10px] text-gray-400 line-clamp-2">{scene.action}</p>
                  </div>
                  {/* Audio Track Indicator */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-cyan-900/30 border-t border-[#333]"></div>
                </div>
              )) : (
                <div className="flex items-center justify-center w-full h-full text-xs text-gray-600 font-mono">
                  NO SCENES ASSEMBLED
                </div>
              )}
            </div>

            {/* Outro Block */}
            {config.outro.enabled && (
              <div className="w-16 h-full bg-purple-900/30 border-l border-[#333] flex flex-col items-center justify-center shrink-0">
                <Icon icon={ICONS.image} size={14} className="text-purple-400 mb-1" />
                <span className="text-[10px] font-mono text-purple-300">OUTRO</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
