'use client';

import React, { useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion } from 'framer-motion';
import { imageService } from '@/services/scriptoplay/imageService';
import { aiService } from '@/services/scriptoplay/aiService';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { storageService } from '@/services/scriptoplay/storageService';
import { assetService } from '@/services/scriptoplay/assetService';
import { VISUAL_STYLES, getStyleConfig } from '@/config/scriptoplay/styles';
import ShotPreviewModal from '@/components/scriptoplay/shared/ShotPreviewModal';

// --- Types ---
type VisualAsset = {
  id: string;
  name: string;
  type: 'Character' | 'Environment';
  desc: string;
  prompt: string;              // Primary portrait prompt → used as char_ref in scene generation
  prompt_lora_sheet?: string;  // Secondary multi-pose sheet prompt → used for LoRA training only
  image?: string;              // Generated portrait image URL (char_ref)
  lora_sheet_image?: string;   // Generated multi-pose sheet URL (LoRA training only)
  tags: string[];
  role?: string;
  consistencyLock?: string;
  consistencyRef?: string;
};

type VisualGalleryProps = {
  logline: string;
  beats: any[]; // BeatCard[]
  data: any; // Project Data (for style/audience context)
  onBack: () => void;
  onNext: (assets: VisualAsset[]) => void;
  versions?: any[];
  onSaveVersion?: () => void;
  isHobbyist?: boolean;
};

// --- Initial Mock Data ---
const INITIAL_ASSETS: VisualAsset[] = [
  { id: '1', name: 'Protagonist', type: 'Character', desc: 'The main hero', prompt: '', tags: ['Hero'], consistencyLock: '' },
  { id: '2', name: 'Antagonist', type: 'Character', desc: 'The villain', prompt: '', tags: ['Villain'], consistencyLock: '' },
  { id: '3', name: 'Main Location', type: 'Environment', desc: 'Where it happens', prompt: '', tags: ['Set'], consistencyLock: '' },
];

export default function VisualGallery({ logline, beats, data, onBack, onNext, versions = [], onSaveVersion, isHobbyist }: VisualGalleryProps) {

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Characters' | 'Environments'>('Characters');

  // Initialize with passed data if available, or defaults
  const [assets, setAssets] = useState<VisualAsset[]>(() => {
    if (data?.modules?.assets && data.modules.assets.length > 0) {
      return data.modules.assets;
    }
    return INITIAL_ASSETS;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAssetId, setGeneratingAssetId] = useState<string | null>(null);
  const [generatingLoraId, setGeneratingLoraId] = useState<string | null>(null); // Tracks LoRA sheet generation
  const [isAutoGeneratingAll, setIsAutoGeneratingAll] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate PROMPT
  const handleGeneratePrompt = async (assetId: string) => {
    // ... existing prompt logic but using isGenerating check properly
    // For now we keep this function content as is, just wrapped or below
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    setIsGenerating(true);

    try {
      // Context from project
      // Pull comprehensive context from data.modules or data root
      const styleId = data?.modules?.style || data?.style || 'pixar_3d';
      const styleConfig = getStyleConfig(styleId);
      const styleContext = styleConfig.prompt;

      const audienceContext = data?.modules?.audience || data?.audience || "General Audience";
      const genreContext = data?.modules?.genre || data?.genre || "General";
      const vibeContext = data?.modules?.vibe || data?.vibe || "Fun";
      const themeContext = data?.modules?.theme || data?.theme || "Adventure";

      const promptRequest = `
            Act as a Lead Concept Artist.
            Project Logline: "${logline}"
            Target Audience: ${audienceContext}
            GENRE: ${genreContext}
            VIBE: ${vibeContext}
            THEME: ${themeContext}
            
            STRICT DIRECTIVE:
            You MUST design the asset to reflect the Vibe ("${vibeContext}") and Theme ("${themeContext}") in its appearance.
            
            Art Style MUST BE: ${styleContext}

            Task: Write a precise Midjourney/Flux image prompt for the ${asset.type}: "${asset.name}".
            Context: ${asset.desc}
            ${asset.consistencyLock ? `CONSISTENCY LOCK (MUST FOLLOW): ${asset.consistencyLock}` : ''}

            Return ONLY the raw prompt text.
          `;

      const result = await aiService.generate(promptRequest);

      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, prompt: result } : a));

    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate IMAGE
  const handleGenerateImage = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || !asset.prompt) {
      alert("Please generate a text prompt first!");
      return;
    }

    setGeneratingAssetId(assetId);
    setIsGenerating(true);

    try {
      // 1. Generate Temporary Image
      const tempImageUrl = await imageService.generate(asset.prompt);
      let finalImageUrl = tempImageUrl;

      // 2. Persist to Storage & Assets Collection (if logged in)
      if (user?.uid) {
        console.log("Starting asset persistence for user:", user.uid);
        try {
          const timestamp = Date.now();
          const storagePath = `users/${user.uid}/assets/${timestamp}_${asset.type}_${assetId}.png`;

          console.log("Uploading to storage path:", storagePath);
          // Upload to Supabase Storage
          finalImageUrl = await storageService.uploadFromUrl(storagePath, tempImageUrl);
          console.log("Upload successful, final URL:", finalImageUrl);

          // Register in Asset Library
          console.log("Saving asset metadata...");
          await assetService.saveAsset(user.uid, {
            type: 'image',
            url: finalImageUrl,
            name: asset.name || 'Unnamed Asset',
            prompt: asset.prompt || '',
            metadata: {
              style: data?.modules?.style || 'default',
              projectId: data?.id || null
            }
          });
          console.log("Asset metadata saved successfully");

        } catch (uploadError: any) {
          console.error("Failed to persist asset detailed error:", uploadError);
          if (uploadError.message) console.error("Error message:", uploadError.message);
          // Fallback to temp URL if upload fails, at least the user sees something
        }
      } else {
        console.warn("User not logged in, skipping asset persistence");
      }

      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, image: finalImageUrl } : a));
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('401')) {
        alert("API Key Missing! Please add OPENAI_API_KEY to your .env.local file.");
      } else {
        alert(`Image generation failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
      setGeneratingAssetId(null);
    }
  };

  // Generate LoRA Sheet (multi-pose) — used for future LoRA fine-tuning only
  const handleGenerateLoraSheet = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || !asset.prompt_lora_sheet) {
      alert('No LoRA sheet prompt available. Re-generate the asset prompts first.');
      return;
    }

    setGeneratingLoraId(assetId);
    try {
      const tempImageUrl = await imageService.generate(asset.prompt_lora_sheet);
      let finalImageUrl = tempImageUrl;

      if (user?.uid) {
        try {
          const storagePath = `users/${user.uid}/assets/${Date.now()}_LoRA_${assetId}.png`;
          finalImageUrl = await storageService.uploadFromUrl(storagePath, tempImageUrl);
          await assetService.saveAsset(user.uid, {
            type: 'image',
            url: finalImageUrl,
            name: `[LoRA Sheet] ${asset.name}`,
            prompt: asset.prompt_lora_sheet || '',
            metadata: { style: data?.modules?.style || 'default', projectId: data?.id || null, purpose: 'lora_training' }
          });
        } catch (e) { console.error('LoRA sheet upload failed', e); }
      }

      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, lora_sheet_image: finalImageUrl } : a));
    } catch (error: any) {
      console.error(error);
      alert(`LoRA sheet generation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingLoraId(null);
    }
  };

  // Generate All Missing for Current Tab
  const handleAutoGenerateTab = async () => {
    setIsAutoGeneratingAll(true);
    setIsGenerating(true);

    const targetType = activeTab === 'Characters' ? 'Character' : 'Environment';
    const missingAssets = assets.filter(a => a.type === targetType && !a.image);

    let currentAssets = [...assets];

    for (const asset of missingAssets) {
      setGeneratingAssetId(asset.id);
      let finalPrompt = asset.prompt;

      if (!finalPrompt) {
        try {
          const styleId = data?.modules?.style || data?.style || 'pixar_3d';
          const styleConfig = getStyleConfig(styleId);

          const promptRequest = `
                      Act as a Lead Concept Artist.
                      Project Logline: "${logline}"
                      Target Audience: ${data?.modules?.audience || data?.audience || "General Audience"}
                      GENRE: ${data?.modules?.genre || data?.genre || "General"}
                      VIBE: ${data?.modules?.vibe || data?.vibe || "Fun"}
                      THEME: ${data?.modules?.theme || data?.theme || "Adventure"}
                      
                      STRICT DIRECTIVE:
                      You MUST design the asset to reflect the Vibe and Theme in its appearance.
                      Art Style MUST BE: ${styleConfig.prompt}
                      
                      Task: Write a precise Midjourney/Flux image prompt for the ${asset.type}: "${asset.name}".
                      Context: ${asset.desc}
                      ${asset.consistencyLock ? `CONSISTENCY LOCK (MUST FOLLOW): ${asset.consistencyLock}` : ''}
                      
                      Return ONLY the raw prompt text.
                  `;
          finalPrompt = await aiService.generate(promptRequest);
          currentAssets = currentAssets.map(a => a.id === asset.id ? { ...a, prompt: finalPrompt } : a);
          setAssets(currentAssets);
        } catch (e) {
          console.error("Failed to generate prompt for", asset.name, e);
          continue;
        }
      }

      try {
        const tempImageUrl = await imageService.generate(finalPrompt as string);
        let finalImageUrl = tempImageUrl;

        if (user?.uid) {
          try {
            const storagePath = `users/${user.uid}/assets/${Date.now()}_${asset.type}_${asset.id}.png`;
            finalImageUrl = await storageService.uploadFromUrl(storagePath, tempImageUrl);
            await assetService.saveAsset(user.uid, {
              type: 'image',
              url: finalImageUrl,
              name: asset.name || 'Unnamed Asset',
              prompt: finalPrompt as string,
              metadata: { projectId: data?.id || null }
            });
          } catch (e) {
            console.error("Upload failed", e);
          }
        }
        currentAssets = currentAssets.map(a => a.id === asset.id ? { ...a, image: finalImageUrl } : a);
        setAssets(currentAssets);
      } catch (e) {
        console.error("Failed to generate image for", asset.name, e);
      }
    }

    setGeneratingAssetId(null);
    setIsGenerating(false);
    setIsAutoGeneratingAll(false);
  };

  const filteredAssets = assets.filter(a =>
    activeTab === 'Characters' ? a.type === 'Character' : a.type === 'Environment'
  );

  const handleRemoveAsset = (id: string) => {
    if (confirm('Are you sure you want to remove this asset?')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show toast here
  };

  const hasGeneratedEnvironment = assets.some(a => a.type === 'Environment' && !!a.image);
  const isNextDisabled = !hasGeneratedEnvironment && !isHobbyist; // Only strictly enforce for non-hobbyist or maybe for all? User requested it broadly. Let's strictly enforce for all. Wait, but hobbyists might not want to? Actually let's enforce for all.
  const enforceEnvCheck = !hasGeneratedEnvironment;

  return (
    <div className="flex flex-col w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Visual Vault</h2>
          <p className="text-gray-400">Design the cast and world before filming starts.</p>
        </div>

        {/* TABS & AUTOGENERATE BUTTON */}
        <div className="flex gap-4 items-center">
          {/* Autogenerate Missing */}
          {filteredAssets.some(a => !a.image) && (
            <button
              onClick={handleAutoGenerateTab}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600/20 text-pink-400 border border-pink-500/50 rounded-xl hover:bg-pink-600 hover:text-white transition-all disabled:opacity-50 text-sm font-bold"
            >
              {isAutoGeneratingAll ? (
                <><Icon icon={ICONS.spinner} className="animate-spin" size={16} /> Generating...</>
              ) : (
                <><Icon icon={ICONS.sparkles} size={16} /> Auto-Generate {activeTab}</>
              )}
            </button>
          )}

          <div className="bg-[#141414] p-1 rounded-xl flex gap-1 border border-[#262626]">
            {['Characters', 'Environments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20">
        {filteredAssets.map((asset) => (
          <motion.div
            key={asset.id}
            layoutId={asset.id}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col gap-4 group hover:border-purple-500/50 transition-all relative"
          >
            {/* Delete Button */}
            {!isHobbyist && (
              <button
                onClick={() => handleRemoveAsset(asset.id)}
                className="absolute top-2 right-2 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Remove Asset"
              >
                <Icon icon={ICONS.delete} size={16} />
              </button>
            )}

            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-[#262626] flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-purple-500 transition-colors">
                <Icon icon={asset.type === 'Character' ? ICONS.user : ICONS.map} size={24} />
              </div>
              <div className="flex gap-2 items-center">
                {asset.type === 'Character' && (
                  <select
                    value={asset.role || 'Supporting'}
                    onChange={(e) => setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, role: e.target.value } : a))}
                    className={`
                      text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded cursor-pointer border-none focus:ring-0 disabled:opacity-50
                      ${asset.role === 'Protagonist' ? 'bg-yellow-500/20 text-yellow-500' : ''}
                      ${asset.role === 'Antagonist' ? 'bg-red-500/20 text-red-500' : ''}
                      ${!['Protagonist', 'Antagonist'].includes(asset.role || '') ? 'bg-blue-500/20 text-blue-500' : ''}
                    `}
                    disabled={isHobbyist}
                  >
                    <option value="Protagonist" className="bg-[#1a1a1a] text-gray-300">Protagonist</option>
                    <option value="Antagonist" className="bg-[#1a1a1a] text-gray-300">Antagonist</option>
                    <option value="Supporting" className="bg-[#1a1a1a] text-gray-300">Supporting</option>
                    <option value="Minor" className="bg-[#1a1a1a] text-gray-300">Minor</option>
                  </select>
                )}
                {(asset.tags || []).map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <input
                value={asset.name}
                onChange={(e) => setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, name: e.target.value } : a))}
                className="bg-transparent text-xl font-bold text-white mb-1 w-full focus:outline-none placeholder:text-gray-700 disabled:opacity-50"
                placeholder="Asset Name"
                disabled={isHobbyist}
              />
              <textarea
                value={asset.desc}
                onChange={(e) => setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, desc: e.target.value } : a))}
                className="bg-transparent text-sm text-gray-500 w-full resize-none focus:outline-none focus:text-gray-300 h-12 mb-2 disabled:opacity-50"
                placeholder="Describe this asset..."
                disabled={isHobbyist}
              />

              {/* CONSISTENCY LOCK */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-2 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    Consistency Lock <span className="opacity-50">(Visual Manifesto)</span>
                  </label>
                </div>
                <textarea
                  value={asset.consistencyLock || ''}
                  onChange={(e) => setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, consistencyLock: e.target.value } : a))}
                  className="bg-transparent text-xs text-purple-200 w-full resize-none focus:outline-none h-10 placeholder:text-purple-500/50 disabled:opacity-50"
                  placeholder="e.g. Orange fur #FF8C00, blue backpack..."
                  disabled={isHobbyist}
                />
              </div>

              {/* CONSISTENCY REF URL */}
              <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-2 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    Reference Image URL <span className="opacity-50">(--cref)</span>
                  </label>
                </div>
                <input
                  value={asset.consistencyRef || ''}
                  onChange={(e) => setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, consistencyRef: e.target.value } : a))}
                  className="bg-transparent text-xs text-purple-200 w-full focus:outline-none h-6 placeholder:text-purple-500/30 disabled:opacity-50"
                  placeholder="https://... (Paste an image URL here)"
                  disabled={isHobbyist}
                />
              </div>
            </div>

            {/* PROMPT BOX */}
            <div className="bg-black/40 rounded-xl p-3 border border-white/5 relative group/prompt">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Image Prompt</span>
                <div className="flex gap-2 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                  {!isHobbyist && (
                    <button
                      onClick={() => handleGeneratePrompt(asset.id)}
                      className="p-1 hover:text-purple-400 text-gray-500"
                      title="Generate with AI"
                    >
                      <Icon icon={ICONS.sparkles} size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(asset.prompt)}
                    className="p-1 hover:text-white text-gray-500"
                    title="Copy"
                  >
                    <Icon icon={ICONS.copy} size={14} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono leading-relaxed h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                {asset.prompt || <span className="text-gray-700 italic">No prompt generated yet... press sparkles.</span>}
              </div>
            </div>

            {/* IMAGE AREA — Portrait (char_ref) */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Portrait <span className="text-green-500/80">(char_ref)</span></span>
            </div>
            {asset.image ? (
              <div className="relative group/image mt-auto">
                <img src={asset.image} alt={asset.name} className="w-full h-48 object-cover rounded-xl border border-[#333]" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity rounded-xl gap-2">
                  <button onClick={() => setPreviewUrl(asset.image!)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                    <Icon icon={ICONS.eye} size={20} />
                  </button>
                  <button onClick={() => handleGenerateImage(asset.id)} className="p-2 bg-purple-600 rounded-full hover:bg-purple-700 text-white">
                    <Icon icon={ICONS.refresh} size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleGenerateImage(asset.id)}
                disabled={!asset.prompt || generatingAssetId === asset.id}
                className={`
                        w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 mt-auto transition-all
                        ${generatingAssetId === asset.id
                    ? 'border-purple-500 bg-purple-900/10'
                    : 'border-[#262626] bg-[#0a0a0a] text-gray-600 hover:text-gray-400 hover:border-gray-500'
                  }
                        ${!asset.prompt ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
              >
                {generatingAssetId === asset.id ? (
                  <>
                    <Icon icon={ICONS.spinner} className="animate-spin text-purple-500" size={24} />
                    <span className="text-xs font-bold text-purple-400 animate-pulse">Rendering Portrait...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={ICONS.image} size={24} />
                    <span className="text-xs font-bold uppercase">Generate Portrait</span>
                    <span className="text-[10px] text-gray-600">Used as char_ref in scene shots</span>
                  </>
                )}
              </button>
            )}

            {/* LoRA TRAINING SHEET — Characters Only, Director Tier */}
            {asset.type === 'Character' && !isHobbyist && (
              <div className="mt-3 border border-amber-500/20 bg-amber-900/10 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">LoRA Training Sheet</span>
                    <p className="text-[10px] text-gray-600 mt-0.5">Multi-pose reference for future fine-tuning</p>
                  </div>
                  <button
                    onClick={() => handleGenerateLoraSheet(asset.id)}
                    disabled={!asset.prompt_lora_sheet || generatingLoraId === asset.id}
                    title={!asset.prompt_lora_sheet ? 'Re-generate prompts from beat sheet first' : 'Generate multi-pose character sheet'}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${generatingLoraId === asset.id
                        ? 'border-amber-500/40 text-amber-400 bg-amber-900/20 cursor-wait'
                        : !asset.prompt_lora_sheet
                          ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                          : 'border-amber-500/40 text-amber-400 bg-amber-900/20 hover:bg-amber-600 hover:text-white hover:border-amber-400'
                      }`}
                  >
                    {generatingLoraId === asset.id
                      ? <><Icon icon={ICONS.spinner} className="animate-spin" size={12} /> Generating...</>
                      : <><Icon icon={ICONS.sparkles} size={12} /> {asset.lora_sheet_image ? 'Regenerate' : 'Generate Sheet'}</>
                    }
                  </button>
                </div>
                {asset.lora_sheet_image ? (
                  <div className="relative group/lora">
                    <img src={asset.lora_sheet_image} alt={`${asset.name} LoRA Sheet`} className="w-full h-32 object-cover rounded-lg border border-amber-500/20" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/lora:opacity-100 flex items-center justify-center transition-opacity rounded-lg gap-2">
                      <button onClick={() => setPreviewUrl(asset.lora_sheet_image!)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                        <Icon icon={ICONS.eye} size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-[10px] text-gray-600">
                    {asset.prompt_lora_sheet ? 'Click Generate Sheet to create the LoRA training asset' : 'Regenerate asset prompts to unlock this'}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        ))}

        {/* ADD CARD */}
        {!isHobbyist && (
          <button
            onClick={() => {
              setAssets(prev => [...prev, {
                id: Math.random().toString(),
                name: `New ${activeTab === 'Characters' ? 'Character' : 'Location'}`,
                type: activeTab === 'Characters' ? 'Character' : 'Environment',
                desc: '',
                prompt: '',
                tags: ['New'],
                role: activeTab === 'Characters' ? 'Supporting' : undefined
              }]);
            }}
            className="border-2 border-dashed border-[#262626] rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-600 hover:text-white hover:border-gray-500 hover:bg-[#1a1a1a] transition-all min-h-[300px]"
          >
            <Icon icon={ICONS.plus} size={40} />
            <span className="font-bold">Add {activeTab.slice(0, -1)}</span>
          </button>
        )}
      </div>

      {/* Shot Preview Modal */}
      {previewUrl && <ShotPreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />}

      {/* FOOTER NAV */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#262626]">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl hover:bg-[#262626] text-gray-400 hover:text-white transition-colors"
        >
          Back to Beats
        </button>
        <button
          onClick={() => onNext(assets)}
          disabled={enforceEnvCheck}
          className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${enforceEnvCheck
            ? 'bg-[#262626] text-gray-500 cursor-not-allowed border border-[#333]'
            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/30'
            }`}
        >
          {enforceEnvCheck ? (
            <><Icon icon={ICONS.warning} size={18} /> Generate an Environment First</>
          ) : (
            <>Finalize & Cast Voices &rarr;</>
          )}
        </button>
      </div>
    </div>
  );
}
