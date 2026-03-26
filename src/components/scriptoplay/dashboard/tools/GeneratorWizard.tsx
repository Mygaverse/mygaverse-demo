'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/scriptoplay/ui/Icon';
import Button from '@/components/scriptoplay/ui/Button'; // Using your UI kit
import { ICONS } from '@/config/scriptoplay/icons';

// --- Step 1: Configuration ---
const ConfigStep = ({ onNext }: { onNext: (data: any) => void }) => {
  const [genre, setGenre] = useState('');
  const [keywords, setKeywords] = useState('');

  const genres = [
    { id: 'sci-fi', label: 'Sci-Fi', icon: ICONS.globe, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { id: 'horror', label: 'Horror', icon: ICONS.moon, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { id: 'comedy', label: 'Comedy', icon: ICONS.smile, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { id: 'drama', label: 'Drama', icon: ICONS.film, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What kind of story are we telling?</h2>
        <p className="text-gray-400">Select a genre and give us a few sparks.</p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-300">Select Genre</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all duration-200 ${
                genre === g.id 
                  ? `${g.color} border-current ring-1 ring-current` 
                  : 'bg-[#141414] border-[#262626] text-gray-400 hover:border-gray-600 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon icon={g.icon} size={24} />
              <span className="text-sm font-medium">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-300">Keywords / Core Idea</label>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. A robot who learns to love jazz music in a post-apocalyptic Chicago..."
          className="w-full h-32 bg-[#141414] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          size="lg" 
          onClick={() => onNext({ genre, keywords })}
          disabled={!genre || !keywords}
          className="w-full md:w-auto"
        >
          Generate Ideas <Icon icon={ICONS.sparkles} />
        </Button>
      </div>
    </div>
  );
};

// --- Step 2: Loading (AI Thinking) ---
const LoadingStep = ({ onComplete }: { onComplete: () => void }) => {
  // Simulate AI delay
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-l-2 border-purple-500"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-b-2 border-r-2 border-pink-500"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon icon={ICONS.bot} size={32} className="text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Dreaming up stories...</h3>
      <p className="text-gray-400 max-w-md">
        Analyzing genre tropes, synthesizing keywords, and crafting loglines.
      </p>
    </div>
  );
};

// --- Step 3: Results ---
const ResultsStep = ({ onRestart }: { onRestart: () => void }) => {
  // Mock Results
  const ideas = [
    {
      title: "The Jazz Automaton",
      logline: "In the ruins of Chicago, a combat droid discovers a pristine saxophone and must choose between its programming to destroy or its newfound desire to create.",
      tone: "Melancholic / Hopeful"
    },
    {
      title: "Rusty Notes",
      logline: "A scavenger girl forms an unlikely bond with a malfunctioning musical robot, unaware that it holds the launch codes for the last nuclear silo.",
      tone: "Adventure / Thriller"
    },
    {
      title: "Silicon Soul",
      logline: "When AI are banned from making art, a robot runs an underground jazz club that becomes the center of a human/machine revolution.",
      tone: "Noir / Sci-Fi"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Here is what we found</h2>
          <p className="text-gray-400">Select an idea to open in the Workspace.</p>
        </div>
        <Button variant="outline" onClick={onRestart}>
          <Icon icon={ICONS.refresh} className="mr-2"/> Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ideas.map((idea, idx) => (
          <div key={idx} className="group bg-[#141414] border border-[#262626] hover:border-purple-500/50 rounded-xl p-6 transition-all hover:bg-[#1a1a1a] cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button size="sm">Open in Workspace</Button>
            </div>
            
            <div className="mb-2">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">{idea.tone}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{idea.title}</h3>
            <p className="text-gray-300 leading-relaxed max-w-2xl">{idea.logline}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Wizard Controller ---
export default function GeneratorWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>(null);

  return (
    <div className="py-10 px-4">
      {/* Step Indicator */}
      <div className="flex justify-center mb-12 gap-2">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`h-1.5 w-12 rounded-full transition-colors ${
              step >= i ? 'bg-purple-600' : 'bg-[#262626]'
            }`} 
          />
        ))}
      </div>

      {step === 1 && <ConfigStep onNext={(d) => { setData(d); setStep(2); }} />}
      {step === 2 && <LoadingStep onComplete={() => setStep(3)} />}
      {step === 3 && <ResultsStep onRestart={() => setStep(1)} />}
    </div>
  );
}