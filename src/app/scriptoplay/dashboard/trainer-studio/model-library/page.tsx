'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loraService } from '@/services/scriptoplay/loraService';
import { trainerImageService } from '@/services/scriptoplay/trainerImageService';

// MVP: Hardcoded 20 Master Shots list
const PHASE_1_PILLARS = [
  {
    id: 'humanoid',
    title: 'Pillar A: Humanoid Mechanics',
    desc: 'Fundamental physics, weight, perspective',
    shots: [
      { id: 'shot_1', title: 'Walk toward camera', desc: 'Perspective & Depth' },
      { id: 'shot_2', title: 'Run side-to-side', desc: 'Lateral Velocity' },
      { id: 'shot_3', title: 'Squash & Stretch jump', desc: 'Weight & Impact' },
      { id: 'shot_4', title: 'Sit to Stand', desc: 'Center of Gravity' },
    ]
  },
  {
    id: 'creature',
    title: 'Pillar B: Animal & Creature Logic',
    desc: 'Skeletal diversity and non-human gait',
    shots: [
      { id: 'shot_5', title: 'Quadrupedal walk (Bear)', desc: 'Heavy 4-legged gait' },
      { id: 'shot_6', title: 'Explosive hop (Rabbit)', desc: 'Coiled energy & release' },
      { id: 'shot_7', title: 'Flapping wings (Bird)', desc: 'Non-grounded physics' },
      { id: 'shot_8', title: 'Tail movement', desc: 'Follow-through & overlap' },
    ]
  },
  {
    id: 'emotion',
    title: 'Pillar C: Emotional Performance',
    desc: 'Expression and micro-movements',
    shots: [
      { id: 'shot_9', title: 'Laughing close-up', desc: 'Lip-sync & Mouth shapes' },
      { id: 'shot_10', title: 'Sad/Crying close-up', desc: 'Fluid & Eye micro-moves' },
      { id: 'shot_11', title: 'Shouting/Angry', desc: 'Aggressive facial deformation' },
      { id: 'shot_12', title: 'Thinking medium shot', desc: 'Subtle blinking & eye-darts' },
    ]
  },
  {
    id: 'environment',
    title: 'Pillar D: Environmental Interaction',
    desc: 'World rules and particle physics',
    shots: [
      { id: 'shot_13', title: 'Wind in fur/hair', desc: 'Cloth & Particle physics' },
      { id: 'shot_14', title: 'Pick up/Hold object', desc: 'Contact & Interaction' },
      { id: 'shot_15', title: 'Water splashing/flowing', desc: 'Fluid dynamics' },
      { id: 'shot_16', title: 'Fire/smoke rising', desc: 'FX & Transparency' },
    ]
  },
  {
    id: 'camera',
    title: 'Pillar E: Cinematography',
    desc: 'Camera mastery and spatial consistency',
    shots: [
      { id: 'shot_17', title: 'Slow Dolly-In (Landscape)', desc: 'Spatial consistency' },
      { id: 'shot_18', title: 'Fast Pan-Right tracking', desc: 'Motion blur & Tracking' },
      { id: 'shot_19', title: 'High-Angle look down', desc: 'Perspective distortion' },
      { id: 'shot_20', title: 'Low-Angle hero shot', desc: 'Scale & Presence' },
    ]
  },
];

export default function ModelLibraryPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Gate: admin or trainer only
  const role = user?.accessStatus || user?.access_status;
  if (role !== 'admin' && role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-12">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold text-white">Model Library</h1>
        <p className="text-gray-400 max-w-sm">This area is restricted to Trainers and Admins.</p>
        <button onClick={() => router.push('/scriptoplay/dashboard')} className="mt-2 text-cyan-400 hover:underline text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  // MVP: Simply storing assignments in local state for the UI demonstration
  // In production, this would read from Supabase `model_library_progress` table
  const [assignedShots, setAssignedShots] = useState<Record<string, string>>({}); // shotId -> videoUrl

  // For expanding/collapsing pillars
  const [expandedPillar, setExpandedPillar] = useState<string>('humanoid');

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [trainedLoraUrl, setTrainedLoraUrl] = useState<string>('');

  const filledCount = Object.keys(assignedShots).length;
  const isPhase1Complete = filledCount === 20;

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingStatus('Fetching Vault Anchor Images...');

    try {
      // For the MVP, we gather the anchor images from the vault to feed the Image LoRA trainer
      // (LTX-Video reads standard FLUX/SD image LoRAs to enforce character consistency)
      const assets = await trainerImageService.getAll();
      const imageUrls = assets.map(a => a.url).slice(0, 15); // Grab up to 15 recent anchors

      if (imageUrls.length < 5) {
        alert("You need at least 5 character images in your Trainer Asset Vault to train a LoRA.");
        setIsTraining(false);
        return;
      }

      setTrainingStatus('Submitting LoRA Job to Fal.ai...');
      const { requestId, model } = await loraService.submitTraining(
        imageUrls,
        "Master Character", // MVP default name
        "CSTUDIO_V1" // Default trigger
      );

      setTrainingStatus('Training... (This usually takes 5-10 minutes)');

      // Setup simple polling
      const pollInterval = setInterval(async () => {
        try {
          const res = await loraService.checkStatus(requestId, model);
          if (res.status === 'ready' && res.loraUrl) {
            clearInterval(pollInterval);
            setIsTraining(false);
            setTrainedLoraUrl(res.loraUrl);
            alert("Training Complete! LoRA saved.");
          } else if (res.status === 'failed') {
            clearInterval(pollInterval);
            setIsTraining(false);
            alert("Training Failed on Fal.ai.");
          }
        } catch (e) {
          // keep polling on network error
        }
      }, 10000);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Training failed to start');
      setIsTraining(false);
    }
  };

  return (
    <div className="min-h-full bg-[#080808] text-white">

      {/* ── Header ── */}
      <div className="border-b border-[#1a1a1a] bg-gradient-to-r from-[#0d0d0d] to-[#0a0a14] px-8 py-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/trainer-studio')} className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1a1a1a] flex items-center justify-center text-gray-400 transition-colors">
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">❖</span> Library Roadmap
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Track the 4-phase journey to the Industry-Standard Custom Model</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

        {/* ════════════════════════════════════════
            PHASE 1: THE FOUNDATION (INTERACTIVE)
        ════════════════════════════════════════ */}
        <section className="bg-[#0f0f0f] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
          <div className="p-6 border-b border-[#1e1e1e] bg-gradient-to-r from-cyan-950/20 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">MVP Target</span>
                  <h2 className="text-xl font-bold text-white">Phase 1: The Foundation</h2>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                  Train the <span className="text-cyan-300 font-mono text-xs">CSTUDIO_V1</span> Grand Master Style LoRA.
                  This dictates the visual laws of the studio. You must fill all 20 Master Shots across the 5 pillars.
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-white">{filledCount}<span className="text-gray-600 text-xl">/20</span></div>
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Clips Assigned</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500"
                style={{ width: `${(filledCount / 20) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Left Col: Pillars List */}
            <div className="md:col-span-1 space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-3 px-2">The 5 Pillars</div>
              {PHASE_1_PILLARS.map(pillar => {
                const completedInPillar = pillar.shots.filter(s => assignedShots[s.id]).length;
                const isSelected = expandedPillar === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setExpandedPillar(pillar.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50'
                      : 'bg-[#141414] border-[#222] hover:bg-[#1a1a1a]'
                      }`}
                  >
                    <div className={`font-semibold text-sm ${isSelected ? 'text-cyan-300' : 'text-gray-300'}`}>
                      {pillar.title.split(': ')[1]}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="text-[10px] text-gray-500">{pillar.desc}</div>
                      <div className={`text-xs font-bold ${completedInPillar === 4 ? 'text-green-400' : 'text-gray-500'}`}>
                        {completedInPillar}/4
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Col: Shots Grid */}
            <div className="md:col-span-3">
              {PHASE_1_PILLARS.map(pillar => (
                <div key={pillar.id} className={expandedPillar === pillar.id ? 'block' : 'hidden'}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-white">{pillar.title}</h3>
                    <button className="text-[10px] bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] px-3 py-1.5 rounded-lg text-gray-300 transition-colors uppercase font-bold tracking-wider">
                      Browse Studio Library →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pillar.shots.map((shot, idx) => {
                      const isAssigned = !!assignedShots[shot.id];
                      return (
                        <div key={shot.id} className={`border rounded-xl p-4 transition-all relative overflow-hidden ${isAssigned ? 'bg-cyan-950/10 border-cyan-500/30' : 'bg-[#121212] border-[#222]'
                          }`}>
                          <div className="flex items-start justify-between mb-3 z-10 relative">
                            <div>
                              <div className="text-[10px] font-mono text-cyan-500/70 mb-1">SHOT_{String(idx + 1).padStart(2, '0')}</div>
                              <div className={`font-bold text-sm ${isAssigned ? 'text-cyan-100' : 'text-gray-300'}`}>{shot.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{shot.desc}</div>
                            </div>
                            {isAssigned ? (
                              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-[#333] shrink-0" />
                            )}
                          </div>

                          <div className="mt-4 flex gap-2 z-10 relative">
                            {isAssigned ? (
                              <button
                                onClick={() => setAssignedShots(prev => { const n = { ...prev }; delete n[shot.id]; return n; })}
                                className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                Unassign
                              </button>
                            ) : (
                              <button
                                onClick={() => setAssignedShots(prev => ({ ...prev, [shot.id]: 'assigned' }))}
                                className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] text-gray-300 transition-colors border-dashed"
                              >
                                + Assign Clip
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isPhase1Complete && (
                <div className="mt-8 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/40 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-cyan-300">Foundation Complete 🚀</div>
                    <div className="text-xs text-gray-400">All 20 Master Shots assigned. Ready for training integration.</div>
                    {trainingStatus && <div className="text-xs text-yellow-400 mt-1">{trainingStatus}</div>}
                    {trainedLoraUrl && <div className="text-xs text-green-400 mt-1">Ready: {trainedLoraUrl}</div>}
                  </div>
                  <button
                    onClick={handleTrainModel}
                    disabled={isTraining || !!trainedLoraUrl}
                    className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors"
                  >
                    {isTraining ? 'Training...' : trainedLoraUrl ? 'Trained!' : 'Train CSTUDIO_V1 Master Model'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            PHASE 2, 3, 4: VISUAL SHELLS
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-5 opacity-60 hover:opacity-100 transition-opacity">
            <h2 className="font-bold text-white mb-1">Phase 2: Action Library</h2>
            <p className="text-xs text-gray-500 mb-4 h-8">Plug-and-play motion modules for physics constraints.</p>
            <div className="space-y-2">
              {['Locomotion (CS_GAIT)', 'Impact (CS_PHYS)', 'Combat (CS_CBT)'].map((mod, i) => (
                <div key={i} className="flex items-center justify-between bg-[#141414] border border-[#222] px-3 py-2 rounded-lg">
                  <span className="text-xs font-mono text-gray-400">{mod}</span>
                  <span className="text-[10px] text-gray-600">Pending</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-5 opacity-60 hover:opacity-100 transition-opacity">
            <h2 className="font-bold text-white mb-1">Phase 3: Brand IP Vault</h2>
            <p className="text-xs text-gray-500 mb-4 h-8">Digital souls: Identity LoRA + Pose Bible + Voice Seed.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-[#141414] border border-[#222] px-3 py-2 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-violet-900/50 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-300">H1</div>
                <div className="flex-1">
                  <div className="text-xs text-gray-300">Hero Prototype</div>
                  <div className="w-full h-1 bg-[#1a1a1a] rounded mt-1 overflow-hidden"><div className="w-2/3 h-full bg-violet-500/50" /></div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-5 opacity-60 hover:opacity-100 transition-opacity">
            <h2 className="font-bold text-white mb-1">Phase 4: Sovereign MLOps</h2>
            <p className="text-xs text-gray-500 mb-4 h-8">Monthly retraining loop harvesting top 5% user videos.</p>
            <div className="flex flex-col items-center justify-center py-4 bg-[#141414] border border-[#222] rounded-lg border-dashed">
              <div className="text-xl mb-1 text-yellow-500/50">⭐</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Queue: 0 / 50</div>
              <div className="text-[9px] text-gray-600 mt-0.5">Videos awaiting review</div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
