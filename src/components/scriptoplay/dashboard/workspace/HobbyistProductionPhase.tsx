'use client';

import React, { useState, useRef } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { videoService } from '@/services/scriptoplay/videoService';
import { imageService } from '@/services/scriptoplay/imageService';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { assetService } from '@/services/scriptoplay/assetService';
import { VISUAL_STYLES, getStyleConfig } from '@/config/scriptoplay/styles';
import { audioService } from '@/services/scriptoplay/audioService';
import { storageService } from '@/services/scriptoplay/storageService';
import { videoAssemblyService } from '@/services/scriptoplay/videoAssemblyService';
import { orchestrateScriptProduction, RoutedScene } from '@/lib/scriptoplay/productionOrchestrator';
import ShotPreviewModal from '@/components/scriptoplay/shared/ShotPreviewModal';

type HobbyistProductionPhaseProps = {
  projectData: any;
  onBack: () => void;
  onSave?: (data: any) => void;
  onNext: () => void;
  projectId?: string;
};

export default function HobbyistProductionPhase({ projectData, onBack, onSave, onNext, projectId }: HobbyistProductionPhaseProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(projectData?.modules?.hobbyistVideo || null);
  const [isDraftMode, setIsDraftMode] = useState(true); // Default to Draft Mode to protect API credits
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- PHASE 3: KEYFRAME APPROVAL GATE ---
  // After clip 1 is generated (cinematic mode only), we extract its last frame
  // and pause so the user can confirm the visual foundation before spending
  // credits on clips 2-5.
  const approvalResolveRef = useRef<((approved: boolean) => void) | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{
    frameUrl: string;
    clipIndex: number;
  } | null>(null);


  const scenes = projectData?.modules?.script || [];
  const styleConfig = getStyleConfig(projectData.modules?.style || projectData.style);

  // --- HYBRID ENGINE ROUTING ---
  const [routedScenes, setRoutedScenes] = useState<RoutedScene[]>([]);
  React.useEffect(() => {
    if (scenes.length > 0) {
      const baseRouted = orchestrateScriptProduction(scenes, 'Hobbyist');

      // OVERRIDE: 15-second and 5-second Hobbyist shorts demand 100% kinetic continuity.
      // We explicitly disable Ken Burns fallbacks and force full Generative Video.
      const projectLengthStr = String(projectData?.length || projectData?.modules?.length).toLowerCase();
      const isMicroShort = projectLengthStr.includes('15') || projectLengthStr.includes('5');

      if (isMicroShort) {
        setRoutedScenes(baseRouted.map(scene => ({
          ...scene,
          production_mode: 'GENERATIVE_VIDEO',
          routing_rationale: 'Forced Generative Video for 15s Micro-Short kinetic continuity.'
        })));
      } else {
        setRoutedScenes(baseRouted);
      }
    }
  }, [projectData?.modules?.script, projectData?.length, projectData?.modules?.length]);


  // --- DURATION FROM PROJECT CONFIG ---
  // Read user-selected length and convert to LTX-2 max-supported seconds (1–11)
  const projectLength = projectData?.length || projectData?.modules?.length || 'short';
  const durationSeconds = (() => {
    if (typeof projectLength === 'number') return Math.min(projectLength, 11);
    const s = String(projectLength).toLowerCase();
    if (s.includes('15')) return 8;    // ~15s project → 8s clip
    if (s.includes('30')) return 10;   // ~30s project → 10s clip
    if (s.includes('60') || s.includes('1 min')) return 11; // 1min → max LTX clip
    return 5; // default / short
  })();

  // --- 6-PART CINEMATOGRAPHER MASTER PROMPT COMPILER ---
  // Find primary character asset for --cref consistency injection
  const assets: any[] = projectData?.modules?.assets || [];
  const primaryCharAsset = assets.find(
    (a: any) => a.type === 'Character' && (a.role === 'Protagonist' || a.role === 'Main') && a.image
  ) || assets.find((a: any) => a.type === 'Character' && a.image);
  const primaryCharUrl = primaryCharAsset?.image || null;

  const startImgUrl = scenes.length > 0 ? scenes[0].production_image : null;
  const endImgUrl = scenes.length > 1 ? scenes[scenes.length - 1].production_image : undefined;
  const isI2VMode = !!startImgUrl; // Image-to-Video: style already baked into keyframe

  // Technical constraint blocks
  // NOTE: --cref is Flux-only syntax. Video models (Kling, Wan, LTX, Luma) do NOT support it.
  // Character consistency for video is handled by I2V frame chaining (Phase 3).
  // TECH_TAGS: "steady cam" removed — it was causing the model to treat the scene as static.
  // "fluid character animation" + "dynamic movement" explicitly force the model to generate motion.
  const TECH_TAGS = '24fps, fluid character animation, dynamic movement, cinematic motion, stable physics, no flicker, masterpiece';
  // NOTE: 'realistic textures' removed — it directly conflicts with Pixar/3D CGI styles and causes 3D→2D drift.
  // NOTE: 'morphing' removed — it blocks story-driven transformations (e.g. Escalate energy surge).
  // Style-specific negatives are handled separately in styleNegative (computed per handleGenerate call, style-aware).
  const NEGATIVE_TAGS = 'static scene, frozen, no movement, extra limbs, deformed geometry, inconsistent colors, text, watermarks, dark shadows';

  // Build per-scene motion prompt using structured video_brief (fallback to visual_prompt_motion)
  const sceneMotionPrompts = scenes.map((s: any) => {
    if (s.video_brief) {
      const { action_dir, camera_dir, environment_dir, lighting_dir } = s.video_brief;
      // In I2V mode: drop style text — model uses startImg as the style anchor
      const stylePart = isI2VMode ? '' : `${styleConfig.prompt}. `;
      return [
        action_dir,
        environment_dir,
        stylePart + lighting_dir,
        camera_dir,
      ].filter(Boolean).join('. ');
    }
    // Fallback: legacy visual_prompt_motion for older projects
    return s.visual_prompt_motion || s.action || '';
  }).filter(Boolean);

  // Assemble master prompt (no --cref: video models ignore it, char consistency is via I2V chaining)
  const masterPrompt =
    sceneMotionPrompts.join('. ') + '. ' +
    TECH_TAGS + '. ' +
    NEGATIVE_TAGS;

  const isReadyToGenerate = scenes.length > 0 && startImgUrl;

  // --- LEGACY SUPPORT: Compute fallback target model if script is old and lacks `target_model` ---
  const fallbackTargetModel = (() => {
    let model = 'wan';
    const fallbackConfig = projectData?.discovery || projectData?.modules?.discovery || projectData?.config || projectData;
    const pGenre = (fallbackConfig?.genre || '').toLowerCase();
    const pTheme = (fallbackConfig?.theme || '').toLowerCase();
    const pVibe = (fallbackConfig?.vibe || '').toLowerCase();
    if (pGenre.includes('action') || pGenre.includes('slapstick') || pTheme.includes('fight')) {
      model = 'kling';
    } else if (pGenre.includes('sci-fi') || pVibe.includes('cinematic') || pTheme.includes('exploration')) {
      model = 'wan';
    }
    return model;
  })();

  const handleGenerate = async (forceCinematic = false) => {
    setIsGenerating(true);

    // Fix stale closure: use forceCinematic as signal for Upgrade button
    const effectiveIsDraftMode = forceCinematic ? false : isDraftMode;

    try {
      if (!isReadyToGenerate) throw new Error("Missing start keyframe. Please render shots in the Script phase.");

      // --- DETERMINE CLIP STRUCTURE BASED ON MODEL ---
      // Kling minimum duration is 5s. Generating 3×5s = 15s instead of 5×3s.
      // LTX and Wan support 3s clips natively. Draft mode always uses LTX (3s).
      const cinematicModel = routedScenes[0]?.target_model || fallbackTargetModel;
      const isKlingMode = !effectiveIsDraftMode && cinematicModel === 'kling';
      const clipDurationSeconds = isKlingMode ? 5 : 3; // Kling=5s, others=3s
      const clipsNeeded = Math.round(15 / clipDurationSeconds); // Kling=3 clips, others=5 clips

      // --- PHASE 1: AUDIO SYNC ---
      // Audio is generated in the Script Assembly Phase. Each scene carries its own dialogue.audio_url.
      // We no longer collapse to a single master dialogue — per-scene timing is handled in assembly.
      // (No extraction needed here — scenes carry their own dialogue arrays)

      // --- PHASE 2: GENERATE VIDEO CLIPS ---
      setStatusText('Animating your cartoon (Processing shots)...');
      let clipUrls: string[] = [];

      const isValidUrl = (str: any) => typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:'));

      // Safely extract bgmUrl (soundtrack can be an array of objects, or bgm might just be a static theme string like 'Playful')
      let rawBgm = projectData?.modules?.audio?.bgm;
      let bgmUrl = isValidUrl(rawBgm) ? rawBgm : undefined;

      if (!bgmUrl && Array.isArray(projectData?.modules?.audio?.soundtrack)) {
        const validTrack = projectData.modules.audio.soundtrack.find((t: any) => isValidUrl(t.url));
        if (validTrack) bgmUrl = validTrack.url;
      } else if (!bgmUrl && isValidUrl(projectData?.modules?.audio?.soundtrack)) {
        bgmUrl = projectData.modules.audio.soundtrack;
      }

      // --- PHASE 1.5: GENERATE HOBBYIST BGM IF MISSING ---
      if (!bgmUrl) {
        setStatusText('Generating AI Soundtrack...');
        try {
          // Attempt to extract the rich prompt planned in the Audio phase
          const plannedTrack = Array.isArray(projectData?.modules?.audio?.soundtrack)
            ? projectData.modules.audio.soundtrack[0]
            : null;

          let prompt = '';
          if (plannedTrack && (plannedTrack.description || plannedTrack.vibe)) {
            const styleLabel = styleConfig?.label || 'cartoon';
            prompt = `${plannedTrack.vibe || ''} ${plannedTrack.description || ''}, ${styleLabel} style`.trim();
            console.log("Using planned Soundtrack Planner prompt:", prompt);
          } else {
            const vibe = projectData?.vibe || projectData?.modules?.vibe || projectData?.modules?.audio?.vibe || 'Playful';
            prompt = `A ${vibe} background music track for a cartoon.`;
            console.log("Using fallback BGM prompt:", prompt);
          }

          const url = await audioService.generateMusic(prompt, 30, 'cassetteai');
          if (url) {
            try {
              if (user?.uid) {
                const blobRes = await fetch(url);
                const blob = await blobRes.blob();
                bgmUrl = await storageService.uploadFile(`users/${user.uid}/assets/temp_bgm_${Date.now()}.mp3`, blob);
              } else {
                bgmUrl = url; // Fallback
              }
            } catch (err) {
              console.error("Failed to upload fallback BGM", err);
              bgmUrl = url;
            }
          }
        } catch (e) {
          console.error('Failed to generate BGM', e);
        }
      }

      // Lock the seed across all clips to prevent background semantic drift between shots.
      const projectSeed = Math.floor(Math.random() * 2147483647);

      // Fallback Identity Anchor for legacy scripts generated before the `global_dna` feature
      const fallbackGlobalDna = assets
        .filter((a: any) => a.type === 'Character')
        .map((a: any) => `[${a.name}: ${a.desc || a.name}]`)
        .join(' and ');

      // Rigid clip count based on model: Kling=3 clips (5s each), others=5 clips (3s each)
      const segmentsToGenerate = routedScenes.slice(0, clipsNeeded);
      const totalScenes = segmentsToGenerate.length;

      // Style-exclusive negative tags prevent style bleed (computed once, used per-clip).
      // 3D/Pixar styles: explicitly block 2D/flat aesthetics — do NOT include 'realistic textures'
      //   because realistic-textured surfaces are CORE to Pixar CGI.
      // 2D/Vector styles: block CGI/photorealistic, include 'morphing' since 2D shouldn't transform.
      // Note: 'morphing' is intentionally absent from 3D negatives — story transformations are valid.
      const styleNegative = (() => {
        const label = (styleConfig.label || '').toLowerCase();
        if (label.includes('2d') || label.includes('vector') || label.includes('preschool') || label.includes('flat')) {
          return '3d, realistic, photographic, realistic textures, depth of field, blur, CGI render, morphing, style inconsistency';
        }
        if (label.includes('3d') || label.includes('pixar') || label.includes('cgi') || label.includes('cartoon')) {
          return 'flat 2d, hand-drawn, sketch, line art, watercolor, low detail, cartoon flat shading, 2d animation, anime';
        }
        return 'style inconsistency, inconsistent art style';
      })();

      // --- PHASE 3: TRUE FRAME CHAINING ---
      // handoffFrameUrl starts as the Flux-generated keyframe (clip 0 anchor).
      // After each clip renders, we extract its last pixel frame and use it as
      // the I2V start image for the NEXT clip. This guarantees visual continuity:
      // each clip begins exactly where the previous one ended — no teleporting,
      // no background drift, no character costume changes between clips.
      let handoffFrameUrl: string | null = startImgUrl;

      // --- I2V ACTION PROMPT BUILDER ---
      // The I2V model SEES character appearance, environment, lighting, and style in the start frame.
      // The text prompt must ONLY describe: WHAT MOVES + WHERE IT ENDS + HOW THE CAMERA MOVES.
      // Adding appearance/style/environment to the prompt conflicts with the frame anchor
      // and causes the model to "re-render" the scene instead of animating it — this is
      // the root cause of character drift and style inconsistency between clips.
      //
      // Source priority for 15s Chunker output:
      //   1. i2v_prompt  — Chunker-assembled I2V prompt: "[delta]. Ends: [end_state]. [camera]." (PRIMARY)
      //   2. the_delta   — fallback if i2v_prompt missing (old scripts)
      //   3. end_state   — appended to delta if no i2v_prompt
      //   4. action_dir  — top-level field from Chunker (or video_brief for standard pipeline)
      //   5. camera      — camera move (always stated — invisible in start frame)
      //   6. scene.action — last-resort narrative text
      const buildChainedPrompt = (scene: any, isFirstClip: boolean): string => {

        // --- PRIMARY: i2v_prompt (Chunker-generated, already I2V-optimised) ---
        // The Chunker now generates i2v_prompt as pure motion language:
        // "[the_delta]. Ends: [end_state]. [camera]." — max 25 words, no appearance description.
        // This is the cleanest signal for the video model. Use it directly when present.
        const veoPrimary = (scene.i2v_prompt || '').trim();

        // --- FALLBACK ASSEMBLY (for scripts generated before this fix) ---
        // Only fires when i2v_prompt is absent or empty.
        const deltaPart   = scene.the_delta || '';
        const endStatePart = scene.end_state ? `Ends: ${scene.end_state}` : '';
        // action_dir is now a top-level Chunker field; video_brief fallback for standard pipeline
        const actionDir   = scene.action_dir || scene.video_brief?.action_dir || '';
        const cameraPart  = scene.video_brief?.camera_dir || scene.camera || '';

        // Motion amplifier — placed first for highest token weight.
        // Prevents the model from treating the start frame as a static hold.
        const motionAmplifier = 'Character moves expressively with clear visible action.';

        let motionCore: string;
        if (veoPrimary) {
          // Use Chunker i2v_prompt directly — it already has delta + end + camera in 25 words
          motionCore = veoPrimary;
        } else if (deltaPart) {
          // Assemble from parts for older scripts
          motionCore = [deltaPart, endStatePart, actionDir, cameraPart].filter(Boolean).join('. ');
        } else {
          // Last resort: trim scene.action to first 20 words (motion language only)
          motionCore = (scene.action || '').split(/\s+/).slice(0, 20).join(' ');
        }

        // Final assembly:
        // [MOTION AMPLIFIER]. [MOTION CORE]. [TECH]. [NEGATIVE]
        // NO style prefix — keyframe encodes style.
        // NO DNA — only on clip 1 and only as a last resort (frame carries identity).
        // NO environment — already visible in the frame.
        // NO start_state — that IS the frame; describing it conflicts with the anchor.
        const parts = [motionAmplifier, motionCore].filter(Boolean);
        return `${parts.join('. ')}. ${TECH_TAGS}. ${NEGATIVE_TAGS} ${styleNegative}`.trim();
      };

      // --- SEQUENTIAL GENERATION + CHAINING LOOP ---
      for (let i = 0; i < totalScenes; i++) {
        const scene = segmentsToGenerate[i];
        const isFirstClip = i === 0;

        setStatusText(`Rendering clip ${i + 1} of ${totalScenes}...`);

        // FRAME CHAIN: every clip uses the previous clip's last extracted frame.
        // Clip 0 uses the Flux keyframe. Clips 1-N use extracted handoff frames.
        // null → undefined: videoService.generateVideo signature uses string | undefined
        const imgTarget = handoffFrameUrl ?? undefined;

        // Build action-only prompt for I2V chaining
        const scenePrompt = buildChainedPrompt(scene, isFirstClip);

        // Debug: show the motion fields being used so we can verify script → prompt translation
        console.log(`[Chain] Clip ${i + 1}/${totalScenes} | I2V frame: ${imgTarget ? '✓' : '✗'}`);
        console.log(`  δ the_delta:  ${scene.the_delta || '(missing)'}`);
        console.log(`  ↓ end_state:  ${scene.end_state || '(missing)'}`);
        console.log(`  🎬 action_dir: ${scene.video_brief?.action_dir || '(missing)'}`);
        console.log(`  📷 camera_dir: ${scene.video_brief?.camera_dir || '(missing)'}`);
        console.log(`  📝 Full prompt: ${scenePrompt}`);

        try {
          let videoUrl: string | undefined;

          if (effectiveIsDraftMode) {
            // Draft Mode: LTX (fast, 3s clips, no approval gate)
            videoUrl = await videoService.generateVideo(
              scenePrompt,
              imgTarget,
              undefined,
              [],
              'tier1',
              undefined,
              String(clipDurationSeconds),
              undefined,
              'ltx',
              projectSeed,
              (status) => setStatusText(`Draft clip ${i + 1}/${totalScenes} — ${status.toUpperCase()}`)
            );
          } else {
            // Cinematic Mode: Wan 2.1 / Kling 1.6 Pro
            videoUrl = await videoService.generateVideo(
              scenePrompt,
              imgTarget,
              undefined,
              [],
              'tier1',
              undefined, // endImgUrl removed — only Luma supports image_end_url; Kling/Wan/LTX silently ignore it and the static Flux keyframe does not represent a motion endpoint
              String(clipDurationSeconds),
              undefined,
              scene.target_model || fallbackTargetModel,
              projectSeed,
              (status) => setStatusText(`Cinematic clip ${i + 1}/${totalScenes} — ${status.toUpperCase()}`)
            );
          }

          if (typeof videoUrl === 'string') {
            clipUrls.push(videoUrl);

            // Save partial progress — no work lost on timeout or crash
            if (onSave) {
              onSave({
                ...projectData,
                modules: { ...projectData.modules, partialClips: [...clipUrls] }
              });
            }

            // --- FRAME EXTRACTION FOR NEXT CLIP ---
            // After every clip except the last, extract the last frame and use it
            // as the I2V start image for the next clip (True Frame Chaining).
            if (i < totalScenes - 1) {
              try {
                setStatusText(`Locking transition frame ${i + 1}→${i + 2}...`);
                const frameRes = await fetch('/api/scriptoplay/extract-frame', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    videoUrl,
                    projectId: projectId || projectData.id || 'temp',
                    sceneIndex: i,
                  }),
                });

                if (frameRes.ok) {
                  const frameData = await frameRes.json();
                  if (frameData.frameUrl) {
                    handoffFrameUrl = frameData.frameUrl;
                    console.log(`[Chain] Clip ${i + 1} handoff frame locked: ${handoffFrameUrl}`);
                  }
                } else {
                  const errData = await frameRes.json().catch(() => ({}));
                  console.warn(`[Chain] Frame extraction failed for clip ${i + 1}: ${errData.error || frameRes.status}. Using previous frame.`);
                  // handoffFrameUrl stays unchanged — previous frame is better than null
                }
              } catch (frameErr: any) {
                console.warn(`[Chain] Frame extraction error for clip ${i + 1}: ${frameErr.message}. Continuing with previous frame.`);
                // Do NOT nullify handoffFrameUrl — keep last known good frame
              }

              // --- KEYFRAME APPROVAL GATE (Cinematic Mode Only) ---
              // After clip 1 renders, pause and show the user the extracted handoff frame.
              // They can confirm the visual foundation is right before we spend credits
              // on clips 2-5. In draft mode this is skipped (cheap, iterate fast).
              if (!effectiveIsDraftMode && isFirstClip && handoffFrameUrl) {
                setStatusText('Review the transition frame before continuing...');
                const approved = await new Promise<boolean>((resolve) => {
                  approvalResolveRef.current = resolve;
                  setPendingApproval({ frameUrl: handoffFrameUrl!, clipIndex: i });
                });

                if (!approved) {
                  // User rejected — abort chain, they'll click Re-Generate manually
                  setStatusText('Regenerate clip 1 to try again.');
                  setIsGenerating(false);
                  return;
                }

                setPendingApproval(null);
                approvalResolveRef.current = null;
              }
            }

          } else {
            console.warn(`Clip ${i + 1}: returned no URL, skipping.`);
          }
        } catch (clipErr: any) {
          // Log the failure and continue — partial renders are better than nothing
          console.error(`Clip ${i + 1} failed:`, clipErr.message);
          setStatusText(`Clip ${i + 1} failed (${clipErr.message?.slice(0, 60)}). Continuing...`);
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      // Validate we have enough clips to assemble a meaningful video
      if (clipUrls.length === 0) {
        throw new Error(`All ${totalScenes} clips failed to generate. Please check your API credits and try again.`);
      }
      if (clipUrls.length < totalScenes) {
        setStatusText(`${clipUrls.length}/${totalScenes} clips generated. Assembling partial video...`);
      }

      // --- PHASE 3: CONCATENATE & MIX AUDIO ---
      let finalMuxedUrl = clipUrls[0]; // Temporary fallback is just the first clip

      // Build assembly scenes: carry each scene's own dialogue (with audio_url) from the script.
      // The assemble-video route will position each dialogue track at its correct timestamp.
      // Previously this collapsed all audio to the first scene only — now all scenes carry audio.
      const assembleScenes = segmentsToGenerate.map((scene, i) => ({
        ...scene,
        production_video: clipUrls[i] || null,
        // Pass through each scene's actual dialogue array (may contain audio_url from Script phase)
        dialogue: scenes[i]?.dialogue || scene.dialogue || []
      }));

      setStatusText('Stitching scenes and mixing audio...');
      try {
        const res = await fetch('/api/scriptoplay/assemble-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenes: assembleScenes,
            bgmUrl,
            projectId: projectId || projectData.id || 'temp',
            clipDuration: clipDurationSeconds  // Tell the assembler the actual clip length
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server Assembly Failed');
        }

        const data = await res.json();
        if (data.url) {
          finalMuxedUrl = data.url;
          setStatusText('Final Master Video ready!');
        }
      } catch (muxErr) {
        console.error("Assembly completely failed, falling back to first un-mixed clip", muxErr);
        finalMuxedUrl = clipUrls[0];
      }

      setFinalVideoUrl(finalMuxedUrl);
      // Save to project
      if (onSave) {
        onSave({
          ...projectData,
          modules: { ...projectData.modules, hobbyistVideo: finalMuxedUrl }
        });
      }

      // Save to assets
      if (user?.uid) {
        await assetService.saveAsset(user.uid, {
          type: 'video',
          url: finalMuxedUrl,
          name: `Hobbyist Cut - ${projectData.logline?.slice(0, 30) || 'Cartoon'}...`,
          prompt: 'Hybrid Engine Render',
          metadata: { projectId: projectData.id, tier: 'Hobbyist' }
        });
      }

    } catch (error: any) {
      console.error(error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between p-8 border-b border-[#262626]">
        <div>
          <h2 className="text-3xl font-black mb-2 text-white flex items-center gap-3">
            <Icon icon={ICONS.video} className="text-purple-500" size={32} />
            Director's Booth
          </h2>
          <p className="text-gray-400">Your AI studio is ready to animate your entire story in one take.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-4 lg:p-8 bg-grid-pattern overflow-y-auto">
        <div className="w-full max-w-4xl mt-8 mb-auto shrink-0 bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-center relative">

          {finalVideoUrl ? (
            <div className="flex flex-col items-center w-full h-full">
              <div className="relative aspect-video bg-black w-full rounded-t-2xl overflow-hidden">
                <video src={finalVideoUrl} controls autoPlay className="w-full h-full object-contain" />
              </div>
              <div className="w-full bg-[#1a1a1a] p-4 flex justify-between items-center rounded-b-2xl border-t border-[#333] shrink-0">
                <div className="text-left">
                  <p className="text-sm text-gray-300 font-bold">Review your cut</p>
                  <p className="text-xs text-gray-500">Not happy with the AI's interpretation?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFinalVideoUrl(null);
                      handleGenerate();
                    }}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-[#262626] hover:bg-purple-900/40 border border-[#444] hover:border-purple-500/50 rounded-lg text-sm text-white font-bold transition-all flex items-center gap-2"
                  >
                    <Icon icon={ICONS.refresh || ICONS.magic} size={16} /> Re-Generate Draft
                  </button>

                  {isDraftMode && (
                    <button
                      onClick={() => {
                        setIsDraftMode(false);
                        setFinalVideoUrl(null);
                        // Using explicit flag to bypass stale closure
                        setTimeout(() => handleGenerate(true), 0);
                      }}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:shadow-lg hover:shadow-orange-500/20 border border-orange-500/50 rounded-lg text-sm text-white font-bold transition-all flex items-center gap-2 animate-pulse"
                    >
                      <Icon icon={ICONS.video} size={16} /> Upgrade to Cinematic
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 px-6 lg:py-12 lg:px-8 flex flex-col items-center w-full min-h-[400px] justify-center relative">

              {isGenerating ? (
                <div className="absolute inset-0 bg-[#141414]/90 flex flex-col items-center justify-center backdrop-blur-md z-10 p-8 rounded-2xl animate-in fade-in transition-all">
                  <Icon icon={ICONS.spinner} size={48} className="text-purple-500 animate-spin mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2 tracking-wide animate-pulse text-center">{statusText}</h3>
                  <p className="text-gray-400 text-sm text-center">Orchestrating AI models... please do not close this page.</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-purple-900/20 rounded-full flex items-center justify-center mb-4 shrink-0">
                    <Icon icon={ICONS.magic} size={32} className="text-purple-500" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Ready to Automate</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6 text-xs lg:text-sm">
                    We will interpolate the keyframes below using the cinematic master prompt.
                  </p>

                  {/* KEYFRAMES PREVIEW */}
                  <div className="flex gap-4 mb-6 w-full justify-center shrink-0">
                    <div className="flex flex-col gap-2 relative">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left">Start Frame</span>
                      <div className="w-32 lg:w-48 aspect-video bg-black rounded-lg border-2 border-[#333] overflow-hidden relative group">
                        {startImgUrl ? (
                          <>
                            <img src={startImgUrl} alt="Start Keyframe" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setPreviewImage(startImgUrl)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                <Icon icon={ICONS.eye} size={20} className="text-white" />
                              </div>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                            <Icon icon={ICONS.image} size={24} />
                            <span className="text-[10px] font-bold">Missing</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {endImgUrl && (
                      <div className="flex flex-col gap-2 relative group-preview">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left">End Frame</span>
                        <div className="w-32 lg:w-48 aspect-video bg-black rounded-lg border-2 border-[#333] overflow-hidden relative group">
                          <img src={endImgUrl} alt="End Keyframe" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPreviewImage(endImgUrl)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                              <Icon icon={ICONS.eye} size={20} className="text-white" />
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HYBRID ENGINE SAVINGS ANALYSIS PANEL */}
                  {routedScenes.length > 0 && (
                    <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-xl p-4 border border-[#333] text-left mb-6 shrink-0 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-purple-900/40 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-purple-900/50 flex items-center gap-1">
                        <Icon icon={ICONS.sparkles} size={10} />
                        Atomic Module Pipeline v1.0
                      </div>
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Icon icon={ICONS.settings} size={12} className="text-purple-500" />
                        Production Scene Execution Plan
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#333]">
                        {routedScenes.map((scene, i) => (
                          <div key={scene.id} className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 rounded-lg border border-[#262626] bg-[#141414] gap-2 sm:gap-4">
                            <div className="flex items-center gap-3 overflow-hidden w-full">
                              <span className="text-gray-500 font-mono text-xs shrink-0">{(i + 1).toString().padStart(2, '0')}</span>
                              <span className="text-gray-300 text-sm font-medium truncate">{scene.action}</span>
                            </div>
                             <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[10px] text-gray-500 hidden md:block w-32 truncate" title={scene.routing_rationale}>{scene.routing_rationale}</span>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${isDraftMode ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                                }`}>
                                {isDraftMode ? '🎥 LTX Draft' : `🎬 AI Video (${scene.target_model || fallbackTargetModel})`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MASTER PROMPT PREVIEW */}
                  <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-xl p-3 border border-[#333] text-left mb-6 shrink-0">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Icon icon={ICONS.pen} size={12} /> Cinematographer Brief
                    </div>
                    {/* Mode badges */}
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {isI2VMode && (
                        <span className="text-[10px] font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ✓ Image-to-Video (Style Locked in Keyframe)
                        </span>
                      )}
                      {primaryCharUrl && (
                        <span className="text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          ✓ Character Reference Ready (I2V Frame Chain)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 font-mono leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                      {masterPrompt}
                    </p>
                  </div>

                  {isReadyToGenerate ? (
                    <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-xl p-4 border border-[#333] text-left mb-6 flex justify-between items-center transition-all">
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDraftMode ? 'text-gray-300' : 'text-orange-400'}`}>
                          <Icon icon={isDraftMode ? ICONS.pen : ICONS.video} size={16} />
                          {isDraftMode ? "Draft Mode (LTX Fast Render)" : "Cinematic Mode (~$2.00 API Cost)"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                          {isDraftMode ? "Provides real AI motion previews at a fraction of the cost." : "Generates full motion premium cinematic video using Wan 2.1 / Kling."}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={!isDraftMode} onChange={(e) => setIsDraftMode(!e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  ) : null}

                  {isReadyToGenerate ? (
                    <button
                      onClick={() => handleGenerate()}
                      disabled={isGenerating}
                      className={`px-8 py-3 lg:py-4 rounded-xl text-white font-bold text-base lg:text-lg transition-all flex items-center gap-3 shrink-0 disabled:opacity-50 disabled:hover:scale-100 ${isDraftMode
                        ? 'bg-[#262626] hover:bg-[#333] border border-[#444] hover:shadow-lg'
                        : 'bg-gradient-to-r from-orange-600 to-pink-600 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105'
                        }`}
                    >
                      <Icon icon={ICONS.magic} size={20} /> {isDraftMode ? 'Generate Draft Cut' : 'Generate Cinematic Cut'}
                    </button>
                  ) : (
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl shrink-0">
                      <p className="text-yellow-500 font-bold mb-2 flex items-center justify-center gap-2">
                        <Icon icon={ICONS.warning} /> Action Required
                      </p>
                      <p className="text-sm text-yellow-500/80">You must render at least one shot in the Script Phase before animating.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="p-6 border-t border-[#262626] flex justify-between items-center bg-[#0a0a0a]">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-[#333] hover:bg-[#1a1a1a] text-gray-300 font-bold transition-all">
          Back to Script
        </button>
        <button
          onClick={onNext}
          disabled={!finalVideoUrl && !isGenerating}
          className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {isGenerating ? 'Please Wait...' : 'Continue to Final Review'} <Icon icon={ICONS.chevronRight} size={16} />
        </button>
      </div>

      {/* KEYFRAME APPROVAL GATE — Cinematic Mode only */}
      {/* Pauses generation after clip 1 so user can confirm the visual foundation */}
      {/* before spending credits on clips 2-5. The frame shown IS the I2V start */}
      {/* image for clip 2 — what the user approves is exactly what the AI will see. */}
      {pendingApproval && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#141414] border border-[#333] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#262626]">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-1.5 bg-orange-500/20 rounded-lg">
                  <Icon icon={ICONS.eye} size={16} className="text-orange-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Transition Frame Review</h3>
              </div>
              <p className="text-gray-400 text-sm">
                This is the last frame of clip 1 — the exact image the AI will use to START clip 2.
                Approve to continue the chain, or regenerate clip 1 if the composition is off.
              </p>
            </div>

            {/* Frame Preview */}
            <div className="p-5">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#333] mb-4">
                <img
                  src={pendingApproval.frameUrl}
                  alt="Transition handoff frame"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] font-bold text-orange-400 px-2 py-1 rounded-full uppercase tracking-wider">
                  Clip 1 → Clip 2 Handoff
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg mb-4">
                <Icon icon={ICONS.info} size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  <strong className="text-amber-400">What you're approving:</strong> The visual style, character pose, and environment
                  shown above will be locked as the starting state for clip 2.
                  The AI will animate FROM this exact frame.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    approvalResolveRef.current?.(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#444] hover:bg-[#1a1a1a] text-gray-300 font-bold text-sm transition-all"
                >
                  <Icon icon={ICONS.refresh} size={14} className="inline mr-1.5" />
                  Regenerate Clip 1
                </button>
                <button
                  onClick={() => {
                    approvalResolveRef.current?.(true);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-pink-600 hover:shadow-lg hover:shadow-orange-500/20 text-white font-bold text-sm transition-all hover:scale-105"
                >
                  <Icon icon={ICONS.sparkles} size={14} className="inline mr-1.5" />
                  Continue Chain →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <ShotPreviewModal
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage}
        />
      )}
    </div>
  );
}
