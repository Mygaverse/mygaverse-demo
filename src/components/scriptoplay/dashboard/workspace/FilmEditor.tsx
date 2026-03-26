'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion, AnimatePresence } from 'framer-motion';
// Phases
import LoglinePhase from '@/components/scriptoplay/dashboard/workspace/LoglinePhase';
import SynopsisPhase from '@/components/scriptoplay/dashboard/workspace/SynopsisPhase';
import { aiService } from '@/services/scriptoplay/aiService';

// --- CONSTANTS ---
const PHASES = [
  { id: 'logline', label: 'Logline', step: 1 },
  { id: 'synopsis', label: 'Synopsis', step: 2 },
  { id: 'treatment', label: 'Treatment', step: 3 },
  { id: 'outline', label: 'Outline', step: 4 },
  { id: 'draft', label: 'Draft', step: 5 },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function FilmEditor({
  // Props passed from the main layout
  projectData,
  onSave,
  onSaveDraft,
  versions,
  isGenerated,
  isMagicMode
}: any) {

  // --- STATE ---
  const [phase, setPhase] = useState('logline');
  const [loglineText, setLoglineText] = useState("");

  // Synopsis Data
  const [synopsisData, setSynopsisData] = useState({ intro: "", plot: "", resolution: "" });
  const [characters, setCharacters] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [plots, setPlots] = useState<any[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  // Sync Initial Data
  useEffect(() => {
    if (projectData) {
      if (projectData.logline) setLoglineText(projectData.logline);
      if (projectData.synopsis) setSynopsisData(projectData.synopsis);
      if (projectData.modules?.characters) setCharacters(projectData.modules.characters);
      if (projectData.modules?.settings) setSettings(projectData.modules.settings);
      if (projectData.modules?.themes) setThemes(projectData.modules.themes);
      if (projectData.modules?.plots) setPlots(projectData.modules.plots);
    }
  }, [projectData]);

  // Handlers
  const handleAddModule = (type: 'characters' | 'settings' | 'themes' | 'plots') => {
    const id = generateId();
    if (type === 'characters') {
      setCharacters(prev => [...prev, { id, name: "New Character", role: "Supporting", age: "30s", desc: "Description...", tag: "Main" }]);
    } else if (type === 'settings') {
      setSettings(prev => [...prev, { id, name: "New Location", type: "INT", vibe: "Neutral", tag: "Location" }]);
    } else if (type === 'themes') {
      setThemes(prev => [...prev, { id, name: "New Theme", color: "bg-gray-500", tag: "Theme" }]);
    } else if (type === 'plots') {
      setPlots(prev => [...prev, { id, title: "New Beat", type: "Beat", desc: "Description..." }]);
    }
  };

  // Generator
  const generateSynopsisData = async (logline: string, isMagicPolish = false) => {
    if (!logline) return;
    setIsGenerating(true);

    try {
      const prompt = `
            Act as a professional screenwriter.
            Logline: "${logline}"
            ${isMagicPolish ? 'Refine the existing story structure.' : 'Create a detailed synopsis and extract script elements.'}
            Generate JSON:
            {
              "intro": "Introduction text...",
              "plot": "Plot summary text...",
              "resolution": "Resolution text...",
              "characters": [ { "name": "Name", "role": "Role", "age": "Age", "desc": "Short desc" } ],
              "settings": [ { "name": "Location Name", "type": "Int/Ext", "vibe": "Adjective" } ],
              "themes": [ "Theme1", "Theme2" ],
              "plots": [ { "title": "Subplot Title", "type": "Subplot", "desc": "Brief description" } ]
            }
        `;
      const result = await aiService.generateStructured(prompt);

      setSynopsisData({ intro: result.intro || "", plot: result.plot || "", resolution: result.resolution || "" });
      if (Array.isArray(result.characters)) setCharacters(result.characters.map((c: any) => ({ ...c, id: generateId(), tag: "Main" })));
      if (Array.isArray(result.settings)) setSettings(result.settings.map((s: any) => ({ ...s, id: generateId(), tag: "Location" })));
      if (Array.isArray(result.themes)) setThemes(result.themes.map((t: string) => ({ id: generateId(), name: t, color: 'bg-purple-500', tag: "Theme" })));
      if (Array.isArray(result.plots)) setPlots(result.plots.map((p: any) => ({ ...p, id: generateId() })));

      if (!isMagicPolish) setPhase('synopsis');
    } catch (error) {
      console.error(error);
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 bg-[#0a0a0a]">

      {/* TOP TABS - FILM STYLE (Professional, Dark, Sleek) */}
      <div className="h-20 border-b border-[#262626] flex items-center px-8 bg-[#0a0a0a] shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 w-full max-w-4xl mx-auto">
          {PHASES.map((p, index) => {
            const isActive = phase === p.id;
            const isPast = PHASES.findIndex(ph => ph.id === phase) > index;
            return (
              <React.Fragment key={p.id}>
                <button
                  onClick={() => setPhase(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-white text-purple-600 font-bold' : isPast ? 'bg-purple-500 text-black' : 'bg-[#262626]'
                    }`}>
                    {isPast ? <Icon icon={ICONS.checkCircle} size={32} /> : p.step}
                  </span>
                  <span className="whitespace-nowrap">{p.label}</span>
                </button>
                {index < PHASES.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[20px] mx-2 ${isPast ? 'bg-purple-900/50' : 'bg-[#1a1a1a]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* EDITOR CANVAS */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-thin scrollbar-thumb-zinc-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {phase === 'logline' && (
              <LoglinePhase
                value={loglineText}
                onChange={setLoglineText}
                isGenerated={isGenerated}
                isMagicMode={isMagicMode}
                onNext={() => { onSave({ logline: loglineText }); setPhase('synopsis'); }}
                onGenerateBeatSheet={() => generateSynopsisData(loglineText)}
                isGenerating={isGenerating}
                onSaveDraft={() => onSaveDraft('logline', { ...projectData, logline: loglineText })}
                versions={versions}
                selectedStyle={projectData?.style || ''}
                onSelectStyle={() => { }}
                selectedAudience={projectData?.audience || ''}
                onSelectAudience={() => { }}
              />
            )}

            {phase === 'synopsis' && (
              <SynopsisPhase
                logline={loglineText}
                onNext={() => setPhase('treatment')}
                onBack={() => setPhase('logline')}
                synopsisData={synopsisData} setSynopsisData={setSynopsisData}
                characters={characters} setCharacters={setCharacters}
                settings={settings} setSettings={setSettings}
                themes={themes} setThemes={setThemes}
                plots={plots} setPlots={setPlots}
                onMagicPolish={() => generateSynopsisData(loglineText, true)}
                onAddModule={handleAddModule}
                isGenerating={isGenerating}
              />
            )}

            {['treatment', 'outline', 'draft'].includes(phase) && (
              <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
                <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mb-4">
                  <Icon icon={ICONS.lock} size={24} />
                </div>
                <h2 className="text-lg font-medium text-white">Phase Locked</h2>
                <p className="text-sm">Complete the Synopsis to unlock {phase}.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
