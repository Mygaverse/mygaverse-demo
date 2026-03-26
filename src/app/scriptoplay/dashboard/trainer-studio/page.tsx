'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { useRouter } from 'next/navigation';
import { loraService } from '@/services/scriptoplay/loraService';
import { motion, AnimatePresence } from 'framer-motion';
import ImagePickerModal from '@/components/scriptoplay/trainer/ImagePickerModal';
import CharacterBuilderForm, { CharacterConfig } from '@/components/scriptoplay/trainer/CharacterBuilderForm';
import { trainerImageService, TrainerImage } from '@/services/scriptoplay/trainerImageService';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

// ─── Types ───────────────────────────────────────────────
type CameraLora = 'static' | 'dolly_in' | 'dolly_out' | 'zoom_in' | 'pan_left' | 'pan_right';
type ClipStatus = 'idle' | 'generating' | 'polling' | 'pending_qa' | 'approved' | 'killed' | 'failed';
type TrainingStatus = 'idle' | 'submitting' | 'training' | 'ready' | 'failed';
type StudioTab = 'generate' | 'asset-gen' | 'asset-vault';

interface TrainingClip {
  id: string;
  imageUrl: string;
  prompt: string;
  cameraLora: CameraLora;
  videoUrl?: string;
  status: ClipStatus;
  requestId?: string;
  characterName: string;
  masterShotId?: string; // Link to Model Library Master Shot
}

interface LoraJob {
  characterName: string;
  triggerWord: string;
  clipsUsed: number;
  status: TrainingStatus;
  loraUrl?: string;
  requestId?: string;
  model?: string;
}

// ─── 20 Master Shots (from Model Library) ────────────────
// Note: Prompts are optimized for LTX-Video. LTX requires: [Camera framing] [Subject] [Explicit physical action verbs].
const MASTER_SHOTS = [
  // Pillar A: Humanoid Mechanics
  { id: 'shot_1', pillar: 'Pillar A: Humanoid', title: 'Walk toward camera', camera: 'dolly_in' as CameraLora, promptTemplate: 'Wide establishing shot. The camera dollies in on [Character]. [Character] is walking rhythmically forward directly toward the camera, legs stepping clearly, arms swinging at their sides, body bouncing slightly with each confident step.' },
  { id: 'shot_2', pillar: 'Pillar A: Humanoid', title: 'Run side-to-side', camera: 'pan_right' as CameraLora, promptTemplate: 'Medium lateral tracking shot panning right. [Character] is sprinting rapidly from the left side of the frame to the right side seamlessly. Legs cycle quickly in a running motion, body leans forward with momentum.' },
  { id: 'shot_3', pillar: 'Pillar A: Humanoid', title: 'Squash & Stretch jump', camera: 'static' as CameraLora, promptTemplate: 'Stationary wide shot. [Character] crouches down deeply, compressing their body, then explodes upward into a high vertical leap into the air, extending fully, before landing back down heavily.' },
  { id: 'shot_4', pillar: 'Pillar A: Humanoid', title: 'Sit to Stand', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium shot. [Character] is initially sitting on an invisible chair, then smoothly pushes upward, leaning their upper body forward and rising up onto their legs to a full standing posture.' },

  // Pillar B: Creature Logic
  { id: 'shot_5', pillar: 'Pillar B: Creature', title: 'Quadrupedal walk (Bear)', camera: 'static' as CameraLora, promptTemplate: 'Stationary wide shot. A massive cartoon bear walks slowly toward the right side. It steps heavily on all four bulky legs in a quadrupedal rhythm, its large head bobbing up and down with each stride.' },
  { id: 'shot_6', pillar: 'Pillar B: Creature', title: 'Explosive hop (Rabbit)', camera: 'static' as CameraLora, promptTemplate: 'Stationary wide shot. A fluffy cartoon rabbit coils its hind legs low to the ground and then launches forcefully upward into a long hopping arc, ears flattening backward during the flight mid-air.' },
  { id: 'shot_7', pillar: 'Pillar B: Creature', title: 'Flapping wings (Bird)', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium shot framing the open sky. A cartoon bird repeatedly flaps its wide wings up and down in a continuous, smooth, rhythmic flying cycle, hovering steadily in the center of the frame.' },
  { id: 'shot_8', pillar: 'Pillar B: Creature', title: 'Tail follow-through', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium shot. A cartoon dog quickly turns its head and body to the left. Its long tail swings around secondary to the body movement, whipping leftward immediately after the body stops.' },

  // Pillar C: Emotional Performance
  { id: 'shot_9', pillar: 'Pillar C: Emotion', title: 'Laughing close-up', camera: 'static' as CameraLora, promptTemplate: 'Tight locked-off close-up on the face. [Character] bursts into joyous laughter. Their mouth opens wide, head tips back slightly, their eyes squint shut tightly, and their shoulders shake up and down rapidly.' },
  { id: 'shot_10', pillar: 'Pillar C: Emotion', title: 'Sad/Crying close-up', camera: 'static' as CameraLora, promptTemplate: 'Tight locked-off close-up on the face. [Character] is crying openly. Large visible tear drops roll down their cheeks. Their bottom lip trembles uncontrollably and their eyebrows furrow upward in deep sadness.' },
  { id: 'shot_11', pillar: 'Pillar C: Emotion', title: 'Shouting/Angry', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium close-up. [Character] screams in total fury. Their mouth is wide open in a yell, head thrust forward aggressively, eyebrows pulled sharply down, fists clenched tight, shaking with anger.' },
  { id: 'shot_12', pillar: 'Pillar C: Emotion', title: 'Thinking medium shot', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium shot. [Character] is lost in thought. Their eyeballs dart slowly toward the upper left corner. They slowly raise one hand and tap their index finger repeatedly against their chin.' },

  // Pillar D: Environmental Interaction
  { id: 'shot_13', pillar: 'Pillar D: Environment', title: 'Wind in fur/hair', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium shot. [Character] stands completely still. A strong gust of wind blows continuously from left to right, causing their hair and loose clothing to ripple and flap wildly toward the right side.' },
  { id: 'shot_14', pillar: 'Pillar D: Environment', title: 'Pick up / Hold object', camera: 'static' as CameraLora, promptTemplate: 'Stationary medium close-up. [Character] reaches their hand down, grabs a solid object from a table, lifts the object up into their chest area, and holds it firmly with their fingers wrapped around it.' },
  { id: 'shot_15', pillar: 'Pillar D: Environment', title: 'Water splashing', camera: 'static' as CameraLora, promptTemplate: 'Static establishing shot. A heavy stream of water falls vertically from the top of the frame, hitting a flat stone surface. As the liquid collides, water droplets and foam splash outward dynamically.' },
  { id: 'shot_16', pillar: 'Pillar D: Environment', title: 'Fire / smoke rising', camera: 'static' as CameraLora, promptTemplate: 'Static environmental shot. A vibrant campfire is intensely burning. Bright orange flames flicker and dance erratically upward while thick plumes of dark grey smoke billow and rise up out of the top of the frame.' },

  // Pillar E: Cinematography
  { id: 'shot_17', pillar: 'Pillar E: Camera', title: 'Slow Dolly-In', camera: 'dolly_in' as CameraLora, promptTemplate: 'The camera pushes in very slowly through a dense forest environment. The background trees scale up smoothly as the viewpoint dollies straight forward continuously. No characters, just environmental motion.' },
  { id: 'shot_18', pillar: 'Pillar E: Camera', title: 'Fast Pan-Right tracking', camera: 'pan_right' as CameraLora, promptTemplate: 'The camera is panning fast to the right side, blurring the background environment sideways. A fast-moving subject remains sharply in focus in the center of the frame as the camera physically sweeps right.' },
  { id: 'shot_19', pillar: 'Pillar E: Camera', title: 'High-Angle down', camera: 'static' as CameraLora, promptTemplate: 'Extreme high-angle bird\'s-eye view looking straight down at the ground. [Character] is standing far below on the dirt floor, looking up briefly. Forced perspective makes them look tiny.' },
  { id: 'shot_20', pillar: 'Pillar E: Camera', title: 'Low-Angle hero', camera: 'static' as CameraLora, promptTemplate: 'Extreme low-angle worm\'s-eye view looking sharply upward. [Character] towers above the camera lens. They plant their hands on their hips confidently. The sky is visible directly behind their head.' },
];

const CAMERA_OPTIONS: { value: CameraLora; label: string; desc: string }[] = [
  { value: 'static', label: '📷 Static', desc: 'Locked camera — ideal for facial expressions' },
  { value: 'dolly_in', label: '🔍 Dolly In', desc: 'Slow push toward subject' },
  { value: 'dolly_out', label: '🔭 Dolly Out', desc: 'Pull back to reveal environment' },
  { value: 'zoom_in', label: '⬆️ Zoom In', desc: 'Tighten on character face' },
  { value: 'pan_left', label: '⬅️ Pan Left', desc: 'Horizontal sweep left' },
  { value: 'pan_right', label: '➡️ Pan Right', desc: 'Horizontal sweep right' },
];

// ─── Sub-components ───────────────────────────────────────
function StatusPill({ status }: { status: ClipStatus | TrainingStatus }) {
  const map: Record<string, { color: string; label: string; dot: string }> = {
    idle: { color: 'text-gray-500', label: 'Idle', dot: 'bg-gray-600' },
    generating: { color: 'text-amber-400', label: 'Generating…', dot: 'bg-amber-400 animate-pulse' },
    polling: { color: 'text-blue-400', label: 'Processing…', dot: 'bg-blue-400 animate-pulse' },
    pending_qa: { color: 'text-yellow-400', label: 'Pending QA', dot: 'bg-yellow-500 animate-pulse' },
    approved: { color: 'text-green-400', label: 'Approved ✓', dot: 'bg-green-400' },
    killed: { color: 'text-red-500', label: 'Killed', dot: 'bg-red-600' },
    submitting: { color: 'text-amber-400', label: 'Submitting…', dot: 'bg-amber-400 animate-pulse' },
    training: { color: 'text-purple-400', label: 'Training…', dot: 'bg-purple-400 animate-pulse' },
    ready: { color: 'text-green-400', label: 'Ready ✓', dot: 'bg-green-400' },
    failed: { color: 'text-red-400', label: 'Failed', dot: 'bg-red-500' },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SectionHeader({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function TrainerStudioPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Gate: admin or trainer only
  const role = user?.accessStatus || user?.access_status;
  if (role !== 'admin' && role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-12">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold text-white">Trainer Studio</h1>
        <p className="text-gray-400 max-w-sm">This area is restricted to Trainers and Admins. Contact your admin to request access.</p>
        <button onClick={() => router.push('/scriptoplay/dashboard')} className="mt-2 text-cyan-400 hover:underline text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  // ── State ──
  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [selectedMasterShot, setSelectedMasterShot] = useState<typeof MASTER_SHOTS[0] | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [cameraLora, setCameraLora] = useState<CameraLora>('static');
  const [clips, setClips] = useState<TrainingClip[]>([]);
  const [loraJobs, setLoraJobs] = useState<LoraJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [masterShotAssignments, setMasterShotAssignments] = useState<Record<string, string>>({});
  const pollingRef = useRef<Record<string, NodeJS.Timeout>>({});

  // ── Asset Vault State ──
  const [vaultAssets, setVaultAssets] = useState<TrainerImage[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  // ── Asset Generator State ──
  const [charConfig, setCharConfig] = useState<CharacterConfig | null>(null);
  const [assetPrompt, setAssetPrompt] = useState('');
  const [assetCharName, setAssetCharName] = useState('');
  const [assetPreviewOpen, setAssetPreviewOpen] = useState(false);
  const [assetGenerating, setAssetGenerating] = useState(false);
  const [assetResult, setAssetResult] = useState<{ url: string; saved: boolean } | null>(null);
  const [assetError, setAssetError] = useState('');

  // ── QA State ──
  const [inspectingClip, setInspectingClip] = useState<TrainingClip | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [qaChecks, setQaChecks] = useState<boolean[]>(new Array(10).fill(false));

  // Group clips by character
  const clipsByChar = clips.reduce<Record<string, TrainingClip[]>>((acc, c) => {
    if (!acc[c.characterName]) acc[c.characterName] = [];
    acc[c.characterName].push(c);
    return acc;
  }, {});

  // ── Select Master Shot Template ──
  const handleSelectMasterShot = (shot: typeof MASTER_SHOTS[0]) => {
    setSelectedMasterShot(shot);
    setPrompt(shot.promptTemplate.replace(/\[Character\]/g, characterName || '[Character]'));
    setCameraLora(shot.camera);
  };

  const handleImagePicked = (url: string, name: string) => {
    setImageUrl(url);
    setImageName(name);
    if (!characterName) setCharacterName(name);
  };

  // ── Generate Clip ──
  const handleGenerateClip = async () => {
    if (!imageUrl.trim() || !prompt.trim() || !characterName.trim()) return;
    const clipId = `clip-${Date.now()}`;
    const newClip: TrainingClip = {
      id: clipId, imageUrl, prompt, cameraLora, status: 'generating',
      characterName, masterShotId: selectedMasterShot?.id,
    };
    setClips(prev => [newClip, ...prev]);
    setIsGenerating(true);

    try {
      const { requestId } = await loraService.generateTrainingClip({ imageUrl, prompt, cameraLora, duration: 3 });
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, status: 'polling', requestId } : c));
      pollClip(clipId, requestId);
    } catch (e: any) {
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, status: 'failed' } : c));
    } finally {
      setIsGenerating(false);
    }
  };

  const pollClip = useCallback((clipId: string, requestId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await loraService.checkClipStatus(requestId);
        if (res.status === 'completed' && res.videoUrl) {
          setClips(prev => prev.map(c => c.id === clipId ? { ...c, status: 'pending_qa', videoUrl: res.videoUrl } : c));
          clearInterval(interval);
        } else if (res.status === 'failed') {
          setClips(prev => prev.map(c => c.id === clipId ? { ...c, status: 'failed' } : c));
          clearInterval(interval);
        }
      } catch { clearInterval(interval); }
    }, 8000);
    pollingRef.current[clipId] = interval;
  }, []);

  // ── QA Handlers ──
  const handleOpenQA = (clip: TrainingClip) => {
    setInspectingClip(clip);
    setRefinedPrompt(clip.prompt);
    setQaChecks(new Array(10).fill(false));
  };

  const handleQAClose = () => setInspectingClip(null);

  const handleApproveClip = () => {
    if (!inspectingClip) return;
    setClips(prev => prev.map(c => c.id === inspectingClip.id ? { ...c, status: 'approved', prompt: refinedPrompt } : c));
    // Auto-assignment: if this clip was generated from a Master Shot task, mark it as done
    if (inspectingClip.masterShotId) {
      setMasterShotAssignments(prev => ({ ...prev, [inspectingClip.masterShotId!]: inspectingClip.id }));
    }
    setInspectingClip(null);
  };

  const handleKillClip = () => {
    if (!inspectingClip) return;
    // Instead of setting status to 'killed', completely remove it from the UI so it disappears
    setClips(prev => prev.filter(c => c.id !== inspectingClip.id));
    setInspectingClip(null);
  };

  // ── Auto-Fetch Asset Vault ──
  React.useEffect(() => {
    if (activeTab === 'asset-vault') {
      loadVaultAssets();
    }
  }, [activeTab]);

  const loadVaultAssets = async () => {
    setIsLoadingVault(true);
    try {
      const assets = await trainerImageService.getAll();
      setVaultAssets(assets);
    } catch (err) {
      console.error('Failed to load vault assets:', err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const handleDeleteVaultAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await trainerImageService.deleteImage(id);
      setVaultAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  // ── Asset Generator ──
  const handleGenerateAsset = async () => {
    if (!assetPrompt.trim() || !assetCharName.trim()) return;
    setAssetGenerating(true);
    setAssetResult(null);
    setAssetError('');

    try {
      const res = await fetch('/api/scriptoplay/trainer-studio/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: assetPrompt, characterName: assetCharName }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Generation failed');
      setAssetResult({ url: data.imageUrl, saved: data.saved });
    } catch (e: any) {
      setAssetError(e.message || 'Generation failed');
    } finally {
      setAssetGenerating(false);
    }
  };

  // ── Submit Training ──
  const handleSubmitTraining = async (charName: string) => {
    const charClips = clips.filter(c => c.characterName === charName && c.status === 'approved' && c.videoUrl);
    if (charClips.length < 5) return;
    const triggerWord = loraService.generateTriggerWord(charName);
    const imageUrls = charClips.map(c => c.videoUrl!);

    setLoraJobs(prev => [{ characterName: charName, triggerWord, clipsUsed: charClips.length, status: 'submitting', requestId: undefined }, ...prev]);

    try {
      const { requestId, model } = await loraService.submitTraining(imageUrls, charName, triggerWord);
      setLoraJobs(prev => prev.map((j, i) => i === 0 ? { ...j, status: 'training', requestId, model } : j));
      pollTraining(0, requestId, model);
    } catch (e: any) {
      setLoraJobs(prev => prev.map((j, i) => i === 0 ? { ...j, status: 'failed' } : j));
    }
  };

  const pollTraining = useCallback((jobIdx: number, requestId: string, model: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await loraService.checkStatus(requestId, model);
        if (res.status === 'ready') {
          setLoraJobs(prev => prev.map((j, i) => i === jobIdx ? { ...j, status: 'ready', loraUrl: res.loraUrl } : j));
          clearInterval(interval);
        } else if (res.status === 'failed') {
          setLoraJobs(prev => prev.map((j, i) => i === jobIdx ? { ...j, status: 'failed' } : j));
          clearInterval(interval);
        }
      } catch { clearInterval(interval); }
    }, 15000);
  }, []);

  const approvedCount = (charName: string) => clips.filter(c => c.characterName === charName && c.status === 'approved').length;
  const masterShotsDone = Object.keys(masterShotAssignments).length;

  return (
    <div className="h-full flex flex-col bg-[#080808] text-white overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-[#1a1a1a] bg-gradient-to-r from-[#0d0d0d] to-[#0a0a14] px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-lg">🎓</div>
              <div>
                <h1 className="text-2xl font-bold text-white">Trainer Studio</h1>
                <p className="text-xs text-gray-400 mt-0.5">Internal tool · Accessible to <span className="text-violet-400 font-semibold">Admin</span> and <span className="text-cyan-400 font-semibold">Trainer</span> roles only</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/trainer-studio/model-library')}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] rounded-lg text-sm text-cyan-400 font-bold tracking-wide transition-colors flex items-center gap-2"
            >
              <span>❖</span>
              Model Library · {masterShotsDone}/20 →
            </button>
          </div>

          {/* Quality reminder banner */}
          <div className="mt-5 flex items-start gap-3 bg-violet-950/30 border border-violet-500/20 rounded-xl p-4">
            <span className="text-xl shrink-0">⚡</span>
            <div className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-violet-300">Pro Overrides Active:</strong> All clips use <code className="bg-black/40 px-1 rounded text-cyan-300">LTX-2 19B / lora</code> endpoint · <code className="bg-black/40 px-1 rounded text-cyan-300">steps: 50</code> · <code className="bg-black/40 px-1 rounded text-cyan-300">guidance: 5.0</code> · <code className="bg-black/40 px-1 rounded text-cyan-300">89 frames</code>. Never train on rejected clips.
            </div>
          </div>
        </div>
      </div>

      {/* ── Studio Tabs + Content (scrollable area) ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-4">
          {/* ── Studio Tabs ── */}
          <div className="flex gap-2 mb-8">
            {([['generate', '🎬 Generate Clips'], ['asset-gen', '🎨 Asset Generator'], ['asset-vault', '🗄️ Asset Vault']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all border ${activeTab === tab ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-[#111] border-[#222] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ════════ TAB: GENERATE CLIPS ════════ */}
          {activeTab === 'generate' && (
            <div className="space-y-8">

              {/* SECTION 1: Generator */}
              <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-6">
                <SectionHeader
                  step="1"
                  title="Generate Training Clip"
                  subtitle="Select a Master Shot task, pick your anchor image, and generate an LTX-2 Pro clip."
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-5">

                    {/* Master Shot Selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Phase 1 Master Shot Task <span className="text-cyan-500">({masterShotsDone}/20 done)</span>
                      </label>
                      <select
                        value={selectedMasterShot?.id || ''}
                        onChange={(e) => {
                          const shot = MASTER_SHOTS.find(s => s.id === e.target.value);
                          if (shot) handleSelectMasterShot(shot);
                        }}
                        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                      >
                        <option value="">— Select a task (or write custom prompt) —</option>
                        {MASTER_SHOTS.map(shot => (
                          <option key={shot.id} value={shot.id} disabled={!!masterShotAssignments[shot.id]}>
                            {masterShotAssignments[shot.id] ? '✓ ' : ''}{shot.pillar}: {shot.title}
                          </option>
                        ))}
                      </select>
                      {selectedMasterShot && (
                        <div className="mt-2 text-[10px] text-cyan-500 font-mono">{selectedMasterShot.id} · Camera: {selectedMasterShot.camera}</div>
                      )}
                    </div>

                    {/* Character Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Character / Subject Name</label>
                      <input
                        type="text"
                        value={characterName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setCharacterName(newName);
                          if (selectedMasterShot) {
                            setPrompt(selectedMasterShot.promptTemplate.replace(/\[Character\]/g, newName || '[Character]'));
                          }
                        }}
                        placeholder="e.g. Bear, Rabbit, Finn the Astronaut…"
                        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Image Picker */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Source Image</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowImagePicker(true)}
                          className="flex-1 px-4 py-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-cyan-500/50 rounded-lg text-sm text-gray-300 transition-all text-left"
                        >
                          {imageUrl ? (
                            <span className="text-cyan-300 font-semibold">✓ {imageName || 'Image selected'}</span>
                          ) : (
                            <span className="text-gray-500">🖼️ Pick from library or drop URL…</span>
                          )}
                        </button>
                        {imageUrl && (
                          <button onClick={() => { setImageUrl(''); setImageName(''); }} className="px-3 py-3 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-500 hover:text-red-400 transition-colors text-sm">✕</button>
                        )}
                      </div>
                      {imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-[#222] aspect-video bg-black">
                          <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Camera Move */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Camera Movement</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CAMERA_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setCameraLora(opt.value)}
                            className={`p-2 rounded-lg text-xs border transition-all text-center ${cameraLora === opt.value ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-300' : 'bg-[#141414] border-[#222] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}
                          >
                            <div className="font-semibold">{opt.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right column: Prompt */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Motion Description Prompt
                        {selectedMasterShot && <span className="ml-2 text-cyan-500 font-normal">(pre-filled from task)</span>}
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={10}
                        placeholder="Describe the motion precisely. Use present-tense verbs. Always start with the trigger word CSTUDIO_V1…"
                        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none leading-relaxed h-full min-h-[200px]"
                      />
                      <div className="mt-1 text-[10px] text-gray-600 font-mono">{prompt.length} chars</div>
                    </div>

                    <button
                      onClick={handleGenerateClip}
                      disabled={isGenerating || !imageUrl.trim() || !prompt.trim() || !characterName.trim()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-violet-900/20 text-sm"
                    >
                      {isGenerating ? 'Submitting to LTX-2 19B Pro…' : '🚀 Generate Training Clip'}
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Dataset & QA */}
              <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-6">
                <SectionHeader
                  step="2"
                  title="Training Dataset & QA"
                  subtitle="Clips enter 'Pending QA' first. Score 10/10 to approve. Collect 5+ Approved clips per character before submitting."
                />

                {Object.keys(clipsByChar).length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <div className="text-4xl mb-3">🎞️</div>
                    <p className="text-sm">No clips yet. Select a Master Shot task and generate your first clip above.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(clipsByChar).map(([charName, charClips]) => {
                      const approved = approvedCount(charName);
                      const readyToTrain = approved >= 5;
                      const existingJob = loraJobs.find(j => j.characterName === charName);

                      return (
                        <div key={charName}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold">
                                {charName.charAt(0).toUpperCase()}
                              </div>
                              <h3 className="font-bold text-white">{charName}</h3>
                              <span className="text-xs text-gray-500">{approved} / {charClips.length} approved</span>
                              {readyToTrain && !existingJob && (
                                <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-semibold">Ready to train ✓</span>
                              )}
                            </div>
                            {readyToTrain && !existingJob && (
                              <button
                                onClick={() => handleSubmitTraining(charName)}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all"
                              >
                                🚀 Submit Training Job
                              </button>
                            )}
                            {existingJob && <StatusPill status={existingJob.status} />}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            <AnimatePresence>
                              {charClips.map(clip => (
                                <motion.div
                                  key={clip.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`relative group rounded-xl overflow-hidden border aspect-video ${clip.status === 'approved' ? 'border-green-500/40' :
                                    clip.status === 'killed' ? 'border-red-500/20 opacity-50' :
                                      clip.status === 'pending_qa' ? 'border-yellow-500/40' :
                                        'border-[#222]'
                                    } bg-[#0a0a0a]`}
                                >
                                  {clip.videoUrl ? (
                                    <video src={clip.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                  ) : (
                                    <img src={clip.imageUrl} alt="" className="w-full h-full object-cover opacity-40" />
                                  )}
                                  {/* Status overlay */}
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                                    <StatusPill status={clip.status} />
                                  </div>
                                  {/* Master Shot badge */}
                                  {clip.masterShotId && (
                                    <div className="absolute top-1.5 left-1.5 bg-violet-600/80 rounded px-1.5 py-0.5 text-[8px] font-bold text-white">
                                      {clip.masterShotId}
                                    </div>
                                  )}
                                  {/* QA hover button */}
                                  {clip.status === 'pending_qa' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleOpenQA(clip)}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg shadow-lg"
                                      >
                                        Review QA
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* SECTION 3: Training Jobs */}
              {loraJobs.length > 0 && (
                <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-6">
                  <SectionHeader
                    step="3"
                    title="LoRA Training Jobs"
                    subtitle="Jobs are processed by Fal's GPU cluster. Training takes 5–15 minutes. Poll updates every 15s."
                  />
                  <div className="space-y-3">
                    {loraJobs.map((job, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-xl border px-5 py-4 ${job.status === 'ready' ? 'border-green-500/30 bg-green-950/10' : job.status === 'failed' ? 'border-red-500/30 bg-red-950/10' : 'border-[#2a2a2a] bg-[#141414]'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold">
                            {job.characterName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{job.characterName}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Trigger: <span className="text-cyan-400 font-mono">{job.triggerWord}</span> · {job.clipsUsed} clips
                              {job.loraUrl && <> · <a href={job.loraUrl} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">Download LoRA</a></>}
                            </div>
                          </div>
                        </div>
                        <StatusPill status={job.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ════════ TAB: ASSET GENERATOR ════════ */}
          {activeTab === 'asset-gen' && (
            <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-6">
              <SectionHeader
                step="A"
                title="Character & Subject Builder"
                subtitle="Select attributes from the menus below. The system auto-builds the SD 3.5 prompt for you. Images are saved to the Trainer Assets library."
              />

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Builder Form */}
                <div className="lg:col-span-3">
                  <CharacterBuilderForm
                    onChange={(config, prompt) => {
                      setCharConfig(config);
                      setAssetPrompt(prompt);
                      setAssetCharName(config.characterName);
                    }}
                  />
                </div>

                {/* Right: Generate + Result */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Asset Name <span className="text-gray-600 font-normal">(for the library)</span></label>
                    <input
                      type="text"
                      value={assetCharName}
                      onChange={(e) => setAssetCharName(e.target.value)}
                      placeholder="Auto-filled from character name…"
                      className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerateAsset}
                    disabled={assetGenerating || !assetPrompt || !charConfig?.characterType}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all"
                  >
                    {assetGenerating ? 'Generating in SD 3.5 Large…' : '✨ Generate Character Image'}
                  </button>

                  {assetError && (
                    <div className="text-red-400 text-sm bg-red-950/20 border border-red-500/20 rounded-lg p-3">{assetError}</div>
                  )}

                  {assetResult && (
                    <div className="space-y-3">
                      {/* Preview with eye icon hover */}
                      <div className="relative group/preview rounded-xl overflow-hidden border border-cyan-500/30 aspect-[4/3] cursor-pointer" onClick={() => setAssetPreviewOpen(true)}>
                        <img src={assetResult.url} alt={assetCharName} className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-105" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                            <span className="text-xl">👁</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {assetResult.saved ? '✓ Saved to Trainer Assets library' : '⚠ Generated but not saved to DB (check logs)'}
                      </div>
                      <button
                        onClick={() => {
                          setImageUrl(assetResult.url);
                          setImageName(assetCharName || 'Generated Character');
                          if (!characterName) setCharacterName(assetCharName || 'Generated Character');
                          setActiveTab('generate');
                        }}
                        className="w-full py-2.5 rounded-xl border border-cyan-500/40 text-cyan-300 font-bold text-sm hover:bg-cyan-500/10 transition-colors"
                      >
                        → Use this image in Clip Generator
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ════════ TAB: ASSET VAULT ════════ */}
          {activeTab === 'asset-vault' && (
            <section className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-6">
              <SectionHeader
                step="A"
                title="Trainer Asset Vault"
                subtitle="Browse and manage high-quality character anchors generated by the studio."
              />

              {isLoadingVault ? (
                <div className="flex items-center justify-center p-12 text-gray-500">
                  <Icon icon={ICONS.spinner} className="animate-spin text-cyan-500 mb-2" size={32} />
                </div>
              ) : vaultAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-[#262626] rounded-xl bg-[#0a0a0a]">
                  <Icon icon={ICONS.image} size={48} className="mb-4 opacity-50" />
                  <p>No trainer assets found.</p>
                  <p className="text-xs mt-2">Generate your first character in the Asset Generator tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {vaultAssets.map(asset => (
                    <div key={asset.id} className="group relative bg-[#141414] border border-[#262626] rounded-xl overflow-hidden hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-900/20 transition-all flex flex-col">
                      <div className="aspect-[4/3] bg-[#0a0a0a] relative overflow-hidden" onClick={() => { setAssetResult({ url: asset.url, saved: true }); setAssetCharName(asset.characterName); setAssetPreviewOpen(true); }}>
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" />

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setAssetResult({ url: asset.url, saved: true }); setAssetCharName(asset.characterName); setAssetPreviewOpen(true); }}
                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                            title="Preview Full Image"
                          >
                            <Icon icon={ICONS.eye} size={20} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteVaultAsset(asset.id, e)}
                            className="p-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-all hover:scale-110"
                            title="Delete Asset"
                          >
                            <Icon icon={ICONS.delete} size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-[#1a1a1a] flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm truncate" title={asset.name}>{asset.name || 'Untitled Asset'}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-2" title={asset.prompt}>{asset.prompt}</p>
                        </div>
                        <button
                          onClick={() => {
                            setImageUrl(asset.url);
                            setImageName(asset.name);
                            setCharacterName(asset.characterName || asset.name);
                            setActiveTab('generate');
                          }}
                          className="mt-3 w-full py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/10 transition-colors"
                        >
                          → Use in Clip Generator
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ════════ ASSET FULL-VIEW LIGHTBOX ════════ */}
        <AnimatePresence>
          {assetPreviewOpen && assetResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setAssetPreviewOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.92 }}
                className="relative max-w-4xl w-full max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                <img src={assetResult.url} alt={assetCharName} className="w-full h-full object-contain rounded-2xl shadow-2xl" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => setAssetPreviewOpen(false)}
                    className="px-4 py-2 bg-black/70 hover:bg-black text-white text-xs font-bold rounded-xl border border-white/10 backdrop-blur-sm transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-white font-bold text-sm">{assetCharName || 'Generated Asset'}</div>
                  <div className="text-gray-400 text-[10px] mt-0.5">{assetResult.saved ? '✓ Saved to Trainer Assets' : '⚠ Not saved to DB yet'}</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════ IMAGE PICKER MODAL ════════ */}
        {showImagePicker && (
          <ImagePickerModal
            onSelect={handleImagePicked}
            onClose={() => setShowImagePicker(false)}
          />
        )}

        {/* ════════════════════════════════════════
          QA INSPECTION MODAL
      ════════════════════════════════════════ */}
        <AnimatePresence>
          {inspectingClip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Left: Video & Caption */}
                <div className="flex-1 border-r border-[#1a1a1a] flex flex-col">
                  <div className="bg-black aspect-video shrink-0 relative">
                    {inspectingClip.videoUrl && (
                      <video src={inspectingClip.videoUrl} className="w-full h-full object-contain" autoPlay loop controls />
                    )}
                    <div className="absolute top-3 right-3 bg-black/70 rounded px-2 py-1 text-[10px] text-gray-300 font-mono backdrop-blur-md">
                      {inspectingClip.cameraLora}
                    </div>
                    {inspectingClip.masterShotId && (
                      <div className="absolute top-3 left-3 bg-violet-600/90 rounded px-2 py-1 text-[10px] font-bold text-white">
                        {inspectingClip.masterShotId}
                      </div>
                    )}
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 bg-[#0a0a0a]">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold">Caption Refinement</h3>
                      <p className="text-xs text-gray-500">Update the prompt to exactly match the video output before approving. The model will learn this exact correlation.</p>
                    </div>
                    <textarea
                      value={refinedPrompt}
                      onChange={(e) => setRefinedPrompt(e.target.value)}
                      rows={6}
                      className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-cyan-500 focus:outline-none transition-colors resize-none leading-relaxed"
                    />
                    <div className="mt-2 text-[10px] font-mono text-cyan-500">
                      Dataset caption file: [char_name]_[id].txt
                    </div>
                  </div>
                </div>

                {/* Right: 10-Point Checklist */}
                <div className="w-full md:w-[380px] bg-[#0d0d0d] flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-[#1a1a1a]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-yellow-500">⚡</span> 10-Point QA
                    </h2>
                  </div>

                  <div className="p-5 overflow-y-auto flex-1 space-y-6">
                    {/* Visual Fidelity */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">1. Visual Fidelity</h4>
                      <div className="space-y-2">
                        {[
                          { i: 0, label: 'Resolution & Clarity (No blur)' },
                          { i: 1, label: 'Texture Preservation (Match SD 3.5)' },
                          { i: 2, label: 'Lighting Consistency (No flicker)' },
                        ].map(item => (
                          <label key={item.i} className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={qaChecks[item.i]} onChange={() => setQaChecks(prev => { const n = [...prev]; n[item.i] = !n[item.i]; return n; })} className="mt-1 accent-cyan-500" />
                            <span className={`text-sm select-none transition-colors ${qaChecks[item.i] ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Motion & Physics */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">2. Motion & Physics</h4>
                      <div className="space-y-2">
                        {[
                          { i: 3, label: 'Anti-Sliding (Feet/hands locked)' },
                          { i: 4, label: 'Temporal Logic (No morphing limbs)' },
                          { i: 5, label: 'Camera Integrity (Accurate 3D shift)' },
                        ].map(item => (
                          <label key={item.i} className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={qaChecks[item.i]} onChange={() => setQaChecks(prev => { const n = [...prev]; n[item.i] = !n[item.i]; return n; })} className="mt-1 accent-cyan-500" />
                            <span className={`text-sm select-none transition-colors ${qaChecks[item.i] ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Metadata & Purity */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">3. Metadata & Purity</h4>
                      <div className="space-y-2">
                        {[
                          { i: 6, label: 'Clip Length (8n+1 frames)' },
                          { i: 7, label: 'Caption is exact match' },
                          { i: 8, label: 'Trigger Word included (CSTUDIO_V1)' },
                          { i: 9, label: 'Clean (No UI or watermarks)' },
                        ].map(item => (
                          <label key={item.i} className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={qaChecks[item.i]} onChange={() => setQaChecks(prev => { const n = [...prev]; n[item.i] = !n[item.i]; return n; })} className="mt-1 accent-cyan-500" />
                            <span className={`text-sm select-none transition-colors ${qaChecks[item.i] ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Controls */}
                  <div className="p-5 border-t border-[#1a1a1a] bg-[#0a0a0a]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">QA Score</span>
                      <span className={`font-bold font-mono text-lg ${qaChecks.filter(Boolean).length === 10 ? 'text-green-400' : 'text-yellow-500'}`}>
                        {qaChecks.filter(Boolean).length} / 10
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={handleKillClip} className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm bg-red-950/20 hover:bg-red-500/20 transition-colors">
                        Kill Clip
                      </button>
                      <button
                        onClick={handleApproveClip}
                        disabled={qaChecks.filter(Boolean).length < 10}
                        className="flex-[2] py-2.5 rounded-xl font-bold text-sm transition-all bg-green-500 text-black hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Approve & Save
                      </button>
                    </div>
                    <button onClick={handleQAClose} className="w-full mt-3 py-2 text-xs text-gray-500 hover:text-white transition-colors">
                      Cancel Review
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
