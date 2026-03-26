'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import NarrativeLengthSelector from './NarrativeLengthSelector';
import AudienceSelector from './AudienceSelector';
import VisualStyleSelector from './VisualStyleSelector';
import GenreSelector from './GenreSelector';
import VibeThemeSelector from './VibeThemeSelector';
import AudioDialogueSelector from './AudioDialogueSelector';
import TierSelector from './TierSelector';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { projectService } from '@/services/scriptoplay/projectService';

// --- Types ---
export type CartoonProjectConfig = {
  tier: 'Demo' | 'Hobbyist' | 'Creator' | 'Director' | null;
  length: '15s' | '60s' | '3m' | '5m' | '11m' | '22m' | null;
  audience: 'preschool' | 'kids' | 'tween' | 'teen_adult' | 'corporate' | null;
  visualStyle: 'pixar_3d' | 'bluey_vector' | 'ghibli_anime' | 'adventure_time' | 'stop_motion' | string | null;
  genre: 'Action' | 'Slapstick' | 'Slice of Life' | 'Fantasy' | 'Sci-Fi' | null;
  vibe: string;
  theme: string;
  audio: {
    dialogue: 'Silent' | 'Narrated' | 'Sparse' | 'Witty';
    sfx: 'Cartoon' | 'Realistic' | '8-Bit';
  };
};

// --- Steps Enum ---
enum WizardStep {
  TIER = 0,
  LENGTH = 1,
  AUDIENCE = 2,
  VISUALS = 3,
  GENRE = 4,
  VIBE = 5,
  AUDIO = 6,
  REVIEW = 7
}

export default function CartoonDiscoveryWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.TIER);

  // Initialize Config
  const [config, setConfig] = useState<CartoonProjectConfig>({
    tier: null,
    length: null,
    audience: null,
    visualStyle: null,
    genre: null,
    vibe: '',
    theme: '',
    audio: { dialogue: 'Sparse', sfx: 'Cartoon' }
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, WizardStep.REVIEW));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, WizardStep.TIER));

  // Determine if current step is valid to proceed
  const isStepValid = () => {
    switch (currentStep) {
      case WizardStep.TIER: return !!config.tier;
      case WizardStep.LENGTH: return !!config.length;
      case WizardStep.AUDIENCE: return !!config.audience;
      case WizardStep.VISUALS: return !!config.visualStyle;
      case WizardStep.GENRE: return !!config.genre;
      case WizardStep.VIBE: return !!config.vibe && !!config.theme;
      case WizardStep.AUDIO: return !!config.audio.dialogue && !!config.audio.sfx;
      default: return true;
    }
  };

  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.access_status === 'admin';

  const handleSubmit = async () => {
    if (!user) return;

    if (!isAdmin) {
      // Block if demo already used
      if (user.demo_used) {
        setDemoError('You have already completed your demo. Please contact us to reset your access.');
        return;
      }

      // Block if user already has a project (1-project limit)
      const existingProjects = await projectService.getUserProjects(user.uid);
      if (existingProjects.length > 0) {
        setDemoError('Demo accounts are limited to one project. Please contact us to upgrade your access.');
        return;
      }
    }

    setIsCreating(true);
    setDemoError(null);

    try {
      const supabase = (await import('@/lib/scriptoplay/supabase/client')).createClient();

      const newProjectId = await projectService.createProject(user.uid, `Untitled ${config.genre} Cartoon`, {
        type: 'cartoon',
        tier: config.tier,
        length: config.length,
        audience: config.audience,
        style: config.visualStyle,
        genre: config.genre,
        vibe: config.vibe,
        theme: config.theme,
        audioConfig: config.audio
      });

      // Mark demo as used (non-admin Demo tier users only)
      if (!isAdmin && config.tier === 'Demo') {
        await supabase
          .from('profiles')
          .update({ demo_used: true, demo_completed_at: new Date().toISOString() })
          .eq('id', user.uid);
      }

      router.push(`/scriptoplay/dashboard/workspace?id=${newProjectId}`);
    } catch (error: any) {
      console.error("Failed to create cartoon project:", error);
      alert(`Failed to initialize project: ${error.message || 'Unknown error'}`);
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-8 lg:p-12 min-h-screen flex flex-col">

      {/* 1. HEADER: Progress */}
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">New Cartoon Project</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-400 font-bold">Step {currentStep + 1} of 8</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">{WizardStep[currentStep]}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-48 h-1 bg-[#262626] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / 8) * 100}%` }}
            ></div>
          </div>
        </div>

        <button onClick={() => router.push('/scriptoplay/dashboard')} className="text-gray-500 hover:text-white transition-colors bg-[#141414] p-2 rounded-full hover:bg-[#262626]">
          <Icon icon={ICONS.close} size={20} />
        </button>
      </header>

      {/* 2. BODY: Step Content */}
      <main className="flex-1 relative">

        {currentStep === WizardStep.TIER && (
          <>
            {demoError && (
              <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm text-center">
                {demoError}
              </div>
            )}
            <TierSelector
              selected={config.tier}
              onSelect={(val) => {
                // Auto-select 15s for Demo tier
                const autoLength = val === 'Demo' ? '15s' : null;
                setConfig({ ...config, tier: val, length: autoLength });
                setDemoError(null);
              }}
            />
          </>
        )}

        {currentStep === WizardStep.LENGTH && (
          <NarrativeLengthSelector
            tier={config.tier}
            selected={config.length}
            onSelect={(val) => { setConfig({ ...config, length: val }); }}
          />
        )}

        {currentStep === WizardStep.AUDIENCE && (
          <AudienceSelector
            selected={config.audience}
            onSelect={(val) => { setConfig({ ...config, audience: val }); }}
          />
        )}

        {currentStep === WizardStep.VISUALS && (
          <VisualStyleSelector
            selected={config.visualStyle}
            audience={config.audience}
            onSelect={(val) => { setConfig({ ...config, visualStyle: val }); }}
          />
        )}

        {currentStep === WizardStep.GENRE && (
          <GenreSelector
            selected={config.genre}
            onSelect={(val) => { setConfig({ ...config, genre: val }); }}
          />
        )}

        {currentStep === WizardStep.VIBE && (
          <VibeThemeSelector
            vibe={config.vibe}
            theme={config.theme}
            audience={config.audience}
            genre={config.genre}
            onUpdate={(vibe, theme) => setConfig({ ...config, vibe, theme })}
          />
        )}

        {currentStep === WizardStep.AUDIO && (
          <AudioDialogueSelector
            selected={config.audio}
            onUpdate={(val) => setConfig({ ...config, audio: val })}
          />
        )}

        {currentStep === WizardStep.REVIEW && (
          <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col justify-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon={ICONS.check} size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Discovery Phase Complete</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              We have defined the constraints. Next, we will generate your Visual Assets and Story Loglines.
            </p>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 max-w-lg mx-auto text-left space-y-3 mb-8 w-full">
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-gray-500 text-sm">Tier</span>
                <span className="text-white font-medium">{config.tier}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-gray-500 text-sm">Format</span>
                <span className="text-white font-medium">{config.length}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-gray-500 text-sm">Target</span>
                <span className="text-white font-medium">{config.audience}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-gray-500 text-sm">Style</span>
                <span className="text-white font-medium">{config.visualStyle}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-gray-500 text-sm">Genre</span>
                <span className="text-white font-medium">{config.genre}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-gray-500 text-sm">Vibe</span>
                <span className="text-purple-400 font-medium">{config.vibe}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-500 text-sm">Theme</span>
                <span className="text-blue-400 font-medium">{config.theme}</span>
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-xl mx-auto">
              <button
                onClick={() => setCurrentStep(WizardStep.LENGTH)}
                className="flex-1 bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626] py-4 rounded-xl font-bold text-lg border border-[#262626] transition-all"
              >
                Modify Selection
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-purple-900/40 transition-all hover:-translate-y-1 border-none"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Icon icon={ICONS.spinner} className="animate-spin" /> Creating Project...
                  </span>
                ) : (
                  <>Generate Studio Assets &rarr;</>
                )}
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 3. FOOTER: Navigation Controls */}
      {currentStep !== WizardStep.REVIEW && (
        <footer className="mt-8 pt-6 pb-12 border-t border-[#262626] flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626] disabled:opacity-0 transition-all font-medium"
          >
            Back
          </button>

          {/* Always show Next button if we are not in Review, logic handled by disabled state */}
          {(currentStep === WizardStep.TIER || currentStep === WizardStep.LENGTH || currentStep === WizardStep.AUDIENCE || currentStep === WizardStep.VISUALS || currentStep === WizardStep.GENRE || currentStep === WizardStep.VIBE || currentStep === WizardStep.AUDIO) && (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 transition-all"
            >
              Continue
            </button>
          )}
        </footer>
      )}

    </div>
  );
}
