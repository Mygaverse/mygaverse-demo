'use client';

import React, { useState, useRef } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { aiService } from '@/services/scriptoplay/aiService';
import { imageService } from '@/services/scriptoplay/imageService';
import { audioService } from '@/services/scriptoplay/audioService';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { assetService } from '@/services/scriptoplay/assetService';
import { storageService } from '@/services/scriptoplay/storageService';
import { VISUAL_STYLES, getStyleConfig } from '@/config/scriptoplay/styles';
import ShotPreviewModal from '@/components/scriptoplay/shared/ShotPreviewModal';

// --- Types ---
type ScriptScene = {
  id: string;
  header: string; // e.g. INT. KITCHEN - DAY
  action: string;
  dialogue: Array<{ character: string; line: string; parenthetical?: string; audio_url?: string }>;
  sfx: string; // "LOUD BOING"
  camera: string; // "ZOOM IN"
  visual_context: string; // "See Asset: Protagonist"
  visual_prompt?: string; // Static keyframe prompt
  visual_prompt_motion?: string; // Legacy motion prompt (kept for backward compat)
  production_image?: string; // The generated image URL
  characters_in_scene?: string[]; // All character names present in this scene (for consistency)
  // NEW: Structured cinematographer brief (replaces visual_prompt_motion for Hobbyist)
  video_brief?: {
    action_dir: string;      // e.g. "Cami sprints, hooves blurring"
    camera_dir: string;      // e.g. "Lateral tracking shot, low angle"
    environment_dir: string; // e.g. "Sun-drenched desert, golden dunes"
    lighting_dir: string;    // e.g. "High-key lighting, golden hour"
  };
  // HYBRID ENGINE DECISIONS
  action_intensity?: number;
  primary_focus?: 'Dialogue' | 'Action' | 'Ambient' | 'Establishing';

  // HOBBYIST 15s SCRIPTING EXTENSIONS
  motion_score?: number;     // 1-10 intensity
  start_state?: string;      // Character/scene physical state at 0.0s
  the_delta?: string;        // The physical movement during the 3 seconds
  end_state?: string;        // Physical state precisely at 3.0s
  i2v_prompt?: string;       // I2V motion prompt: "[delta]. Ends: [end_state]. [camera]." — name is legacy, content is model-agnostic
  global_dna?: string;       // Phase 1: Identity Anchor text lock
};

type CartoonScriptAssemblyProps = {
  logline: string;
  beats: any[];
  assets: any[]; // VisualAsset[]
  config: any;   // Project Config (Genre, Audience, etc)
  onNext: (script: ScriptScene[]) => void;
  onBack: () => void;
  versions?: any[];
  onSaveVersion?: () => void;
  onSave?: (script: ScriptScene[]) => void;
  isHobbyist?: boolean;
};

export default function CartoonScriptAssembly({ logline, beats, assets, config, onNext, onBack, versions = [], onSaveVersion, onSave, isHobbyist }: CartoonScriptAssemblyProps) {

  const { user } = useAuth();
  const [script, setScript] = useState<ScriptScene[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);

  // Guard: only auto-generate once per component mount, never on re-renders
  const hasInitialized = useRef(false);

  // 1a. Mount-only effect: auto-generate ONCE if script is empty on first load
  React.useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (config?.modules?.script && config.modules.script.length > 0) {
      // Restore saved script — no generation needed
      setScript(config.modules.script);
    } else {
      // Truly empty: auto-generate once
      handleGenerateScript();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally mount-only

  // 1b. Sync effect: restore saved data when config updates (e.g. version restore)
  // NOTE: No else branch — this effect NEVER triggers generation
  React.useEffect(() => {
    if (!hasInitialized.current) return; // Skip on first mount (handled above)
    if (config?.modules?.script && config.modules.script.length > 0) {
      setScript(config.modules.script);
    }
  }, [config?.modules?.script]); // Only re-runs when actual script data changes

  const [isGeneratingAllShots, setIsGeneratingAllShots] = useState(false);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const stopShotsRef = React.useRef(false);

  // 2. Auto-Save Helper
  const autoSave = (newScript: ScriptScene[]) => {
    if (onSave) {
      onSave(newScript);
    }
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      // Prepare context
      // Prepare context
      const beatContext = beats.map((b, i) =>
        `Beat ${i + 1} (${b.type}): ${b.visual}
         [Camera: ${b.camera?.move || ''} ${b.camera?.angle || ''}]
         [Lighting: ${b.lighting || ''}]
         [Sound: ${b.audio}]
         [Animation Principle: ${b.animationNote || ''}]
         [Tags: ${(b.tags || []).join(', ')}]
         [HYBRID ROUTING: Focus=${b.primaryFocus || 'Action'}, Intensity=${b.actionIntensity || 5}]`
      ).join('\n---\n');

      const assetContext = assets.map(a =>
        `${a.name} (${a.type}): ${a.desc} ${a.consistencyLock ? `[VISUAL LOCK: ${a.consistencyLock}]` : ''}`
      ).join('\n');

      // LOOKUP STYLE
      const styleConfig = getStyleConfig(config?.modules?.style || config?.style);
      const styleInfo = `VISUAL STYLE: ${styleConfig.label} (${styleConfig.prompt})`;

      // --- LOGLINE-TO-STITCH ARCHITECT (WIZARD MAPPING) ---
      const audienceConstraint = config?.audience === 'preschool' || config?.audience === 'kids'
        ? 'SAFETY & PACING CONSTRAINT: Target audience is young (2-9). Enforce safe content, simple cartoon physics, bright colors, no scary shadows. The main character must occupy 60% of the frame for visual clarity.'
        : 'PACING CONSTRAINT: Target audience is older. Allow dynamic camera movement, complex action, and stylized contrast.';

      const audioConstraint = config?.audioConfig?.dialogue === 'Narrated' || config?.audioConfig?.dialogue === 'Witty'
        ? 'AUDIO CONSTRAINT: High Dialogue Density. Limit dialogue to absolute maximum of 10 words total across the entire 15s to fit perfectly within a 3s window without overlapping cuts.'
        : 'AUDIO CONSTRAINT: Low Dialogue. Generate ONLY Action Cues (e.g. "[Giggles]", "[Boing]", "[Gasp]") instead of spoken lines.';

      const isMicroShort = isHobbyist && (config?.length === '15s' || config?.length === 'Micro-Short (15-30s)');

      // --- DYNAMIC MODEL MAPPER ---
      // 'veo' is NOT a valid FAL model — it maps to Wan in videoService.
      // Default to 'wan' (Wan 2.1) so the personaConstraint matches the actual model used.
      // Kling is used for high-kinetic genres (action, slapstick, fight).
      let modelTarget = 'wan'; // Default: Wan 2.1 (Camera Operator persona)
      const genre = (config?.genre || '').toLowerCase();
      const theme = (config?.theme || '').toLowerCase();
      const vibe = (config?.vibe || '').toLowerCase();

      if (genre.includes('action') || genre.includes('slapstick') || theme.includes('fight')) {
        modelTarget = 'kling';
      }
      // 'wan' is already default — no need for a second branch

      let personaConstraint = '';
      if (modelTarget === 'kling') {
        personaConstraint = `MODEL OPTIMIZATION (KLING - PHYSICS ENGINE):
        You are a Biomechanics Expert. Kling thrives on embodied physics, mass, and kinetic resistance.
        Instead of generic commands like "The character jumps", you MUST describe the exertion: "The character crouches low, muscles tensing against gravity, then exerts explosive upward force, pulling their weight over the edge."`;
      } else {
        // Wan 2.1: Director of Photography persona — thrives on spatial volume and virtual optics.
        personaConstraint = `MODEL OPTIMIZATION (WAN 2.1 - CAMERA OPERATOR):
        You are a Director of Photography. Wan thrives on virtual optics and spatial volume.
        You MUST define the start state as [F0] and the end state as [F90]. Explicitly state lens behavior.
        Example: "Begin with a Close-Up at [F0] on her neutral face. Execute a slow dolly-out on a 50mm lens while she smiles. End at a Medium Shot at [F90] taking in the background."`;
      }

      let prompt = ``;
      let globalDna = ``;

      if (isMicroShort) { // 2-pass Timing Matrix + Chunker pipeline: 15s Hobbyist only
        // --- STAGE 1: EXTRACT GLOBAL IDENTITY DNA ---
        const dnaPrompt = `
          You are the Scriptoplay Asset Architect.
          Based on user inputs:
          Style: ${styleConfig.label} (${styleConfig.prompt})
          Audience: ${config?.audience || 'Kids'}
          Logline: "${logline}"
          Assets Provided:
          ${assetContext}

          Extract a rigid Character DNA and World DNA.
          Rules: 
          1. Use only physical, constant descriptors (e.g., 'spherical blue torso', 'matte plastic texture'). 
          2. CRITICAL: You MUST include the Visual Style Marker (e.g., '2D hand-drawn line art' or '3D high-fidelity CGI') within this DNA string.
          3. Avoid emotional descriptors.
          Output: A 50-word 'Global Identity Prefix' that MUST be prepended to every subsequent video prompt in this session.
          Return ONLY this 50-word string verbatim, with no markdown formatting.
        `;
        globalDna = (await aiService.generate(dnaPrompt)).trim();
      }

      if (isMicroShort) {
        // --- PASS 1: STAGE 2 - HIERARCHICAL SYNC MATRIX (The Brain) ---
        // Uses the 5-beat micro-story arc: ESTABLISH → PROVOKE → REACT → ESCALATE → LAND
        // These names drive the AI's understanding of each beat's narrative purpose and energy.
        const matrixPrompt = `
          You are the Scriptoplay Master Timing Architect.
          Your goal is to map a 15-second cinematic script into a 5-Beat Timing Matrix.

          Project: ${logline}
          Genre: ${config?.genre || 'Comedy'}
          Vibe: ${config?.vibe || 'Fun'}
          Beat Context from Beat Sheet:
          ${beatContext}

          CRITICAL RULES:
          1. Generate EXACTLY 5 Beats in this NAMED ARC order (each = 3 seconds):
             - Beat 1 "ESTABLISH" (0-3s):   Who, where, what mood. Static start. Score 2-3.
             - Beat 2 "PROVOKE"   (3-6s):   The disruption arrives. Score 3-4.
             - Beat 3 "REACT"     (6-9s):   Immediate physical response. Score 4-5.
             - Beat 4 "ESCALATE"  (9-12s):  Peak energy. Goes wrong or intensifies. Score 5-6.
             - Beat 5 "LAND"      (12-15s): Resolution or punchline. Soft landing. Score 2-3.

          2. Assign motion_score (1-7) strictly per the arc above. Do NOT exceed the range shown.

          3. SPATIAL CONSTRAINT: All 5 beats must occur in the SAME physical location.
             Only one environment transition is allowed, and only between beats 2 and 3.

          Format: JSON Array of exactly 5 objects:
          - beat_name: (MUST be one of: "ESTABLISH", "PROVOKE", "REACT", "ESCALATE", "LAND")
          - timestamp: (e.g. "00s - 03s")
          - narrative_beat: (The story step — one sentence)
          - visual_action: (The specific physical movement during 3s)
          - audio_trigger: (Dialogue or SFX cue)
          - motion_score: (Integer 1-7)
        `;
        const timingMatrixResult = await aiService.generateStructured(matrixPrompt);
        const timingMatrixStr = JSON.stringify(timingMatrixResult, null, 2);

        // --- PASS 2: STAGE 3 - THE SCRIPTOPLAY 3s-CHUNKER & LOGLINE-TO-STITCH SYSTEM PROMPT ---
        prompt = `
          You are the Scriptoplay Temporal Director and Lead Producer for a 15-second animation pipeline.
          Your goal is to decompose the following Timing Matrix into EXACTLY FIVE (5) distinct 3-second Atomic Modules.
          You ensure visual continuity, prevent motion "chaos", and eliminate "stasis" by managing kinetic flow across a "First Frame + Last Frame" generation logic.

          Project: ${logline}
          Genre: ${config?.genre || 'Comedy'}
          Vibe: ${config?.vibe || 'Fun and adventurous'}
          Theme: ${config?.theme || 'Friendship'}
          ${styleInfo}
          
          ${audienceConstraint}
          ${audioConstraint}

          CORE OBJECTIVES:
          1. The 3s Rule: Each segment must contain EXACTLY ONE primary movement. Avoid compound actions.
          2. Kinetic Continuity: The "end_state" of Chunk N MUST logically mirror the "start_state" of Chunk N+1.
          3. Motion Vector Management: Enforce the "Sweet Spot" motion curve and the 10% Motion Budget. Follow the Timing Matrix motion_score.
          4. Visual Anchoring: Consistently describe the key subject and lighting in every chunk to prevent drift.

          SPATIAL LOCK (MANDATORY):
          All 5 chunks must occur in ONE primary physical location.
          ONE environment transition is permitted only between chunks 2 and 3.
          Characters CANNOT teleport. If chunk 2 ends in a kitchen, chunk 3 begins in the kitchen
          (or makes a single deliberate move to one other room — never a completely new setting).

          PHYSICAL LOGIC (MANDATORY):
          The end_state of chunk N is the LITERAL physical starting condition of chunk N+1.
          These are frames of the same continuous film — not separate scenes.
          The character's body must occupy the same spatial position it ended at.
          A character who ends chunk 3 mid-air MUST begin chunk 4 still in the air (or just landing).
          Gravity, momentum, and body position carry across cuts.

          DIALOGUE PLACEMENT:
          If dialogue exists, it MUST be placed entirely within a SINGLE chunk (e.g., Chunk 2 or 3) to prevent audio cropping across the hard 3-second boundaries!

          ASSETS (Consistency Anchors):
          ${assetContext}

          TIMING MATRIX (Strictly map your 5 chunks to this):
          ${timingMatrixStr}

          Task: Generate EXACTLY 5 JSON objects representing the 5 sequential 3-second Atomic Modules. Do not generate more or fewer.

          Format: JSON Array of 5 Scenes. Each scene MUST contain these EXACT fields:
          - header: (Slugline using the Timing Matrix beat_name, e.g. "CHUNK 1 - ESTABLISH", "CHUNK 2 - PROVOKE")
          - action: (Narrative text description of the 3s chunk — for script display only)
          - characters_in_scene: (Array of character names from Assets list)
          - sfx: (Sound effects/Action Cues in ALL CAPS)
          - camera: (One camera move. e.g. "Slow dolly-in, medium shot")
          - dialogue: (Array of character, line, parenthetical. IF High Density: Keep to 10 words total in ONE chunk. IF Low Density: Action Cues Only)
          - motion_score: Integer 1-7 (Copy strictly from the Timing Matrix).
          - start_state: Description of character pose and camera angle at 0.0s. (Chunk 1 starts from static). Used for chaining context only.
          - the_delta: The SINGLE specific physical movement in these 3 seconds. Name BODY PARTS + DIRECTION. Max 12 words.
            Examples: "Arms pull upward, elbows bend, fingers grip hilt."  "Head snaps left, torso twists 45 degrees."
            *CRITICAL: ONE movement only. No compound actions. No character names. No emotions.*
          - end_state: Exact body position at 3.0s — a physical pose description, NOT a narrative outcome. Max 12 words.
            Examples: "Right knee on ground, both arms raised, sword horizontal." NOT "She succeeds" or "Triumphant pose".
          - action_dir: Short cinematographer note. Active verb + adverb. Max 10 words. e.g. "Sprints full speed, arms pumping wildly."
          - i2v_prompt: I2V MOTION PROMPT — this goes directly to the video AI model as the TEXT prompt.
            ⚠️ CRITICAL RULES — violating these causes character drift and style corruption:
            1. BODY PARTS, NOT NAMES: Use "arms", "legs", "torso", "head" — NOT character names. The model doesn't know "Skye", it only sees pixels.
            2. NO APPEARANCE: Do not describe colour, costume, style, environment, or starting pose — the model sees all of that in the frame.
            3. NO EMOTIONS: "determined expression" is NOT a body position. Use physical coordinates only.
            4. DIRECTION OF MOVEMENT: Always state axis/direction: "upward", "forward", "to the left", "inward".
            5. END STATE = BODY POSITION: The Ends: clause must be a physical pose, not a narrative outcome.
            CONSTRUCTION: "[body-part verb direction]. Ends: [body position]. [camera]."
            MAX 25 WORDS. Pure motion language only.
            GOOD: "Arms heave upward, elbows lock overhead. Ends: both hands raised, sword horizontal at chest. Tilt up."
            BAD: "Skye triumphantly raises the frost sword with all her might in the glowing altar."
          - visual_prompt: STATIC IMAGE PROMPT for the keyframe photo (Flux image model — NOT the video model).
            Start with Global Identity DNA. Add: environment, lighting, character pose at this beat's start.
            Full description IS correct here — Flux needs to know everything to generate the image.
          - target_model: (String: MUST be EXACTLY "${modelTarget}")
          
          GLOBAL IDENTITY DNA (The Anchor):
          "${globalDna}"
          
          ${personaConstraint}
        `;
      } else {
        // --- STANDARD DIRECTORIAL PROMPT ---
        prompt = `
            Act as a Lead TV Animation Writer & Director.
            Project: ${logline}
            Genre: ${config?.genre || 'Comedy'}
            Audience: ${config?.audience || 'General'}
            Vibe: ${config?.vibe || 'Fun and adventurous'}
            Theme: ${config?.theme || 'Friendship'}
            Pacing/Format Length: ${config?.length || '3 Minutes'}
            Dialogue Style: ${config?.audioConfig?.dialogue || 'Standard'}
            ${styleInfo}
            
            STRICT DIRECTIVES:
            - You MUST adhere to the Vibe ("${config?.vibe || 'Fun'}") and Theme ("${config?.theme || 'None'}") in every scene's tone.
            - The script pacing MUST match a ${config?.length || '3m'} runtime format.
            - Dialogue MUST strictly follow the ${config?.audioConfig?.dialogue || 'Standard'} style.

            MASTER PROMPT FORMULA for visual_prompt (STATIC KEYFRAME):
            1. Subject & Action (Kinetic Core)
            2. Environment (The Set)
            3. Visual Style (The Anchor) - ${styleConfig.label}
            4. Lighting (The Vibe) - Use the Beat's Lighting
            5. Camera (Directorial Command) - Use the Beat's Camera 
            6. Technical Tags (The Lock) - Will be appended by system.

            CINEMATOGRAPHER VIDEO BRIEF (video_brief) - STRICT JSON OUTPUT:
            For each scene you MUST output a "video_brief" object with EXACTLY these four fields.
            Think like a Film Director giving orders to a camera operator, NOT a writer telling a story.
            Use active physical verbs and technical cinematography terms ONLY.

            APPROVED CAMERA TERMS (pick one per scene):
            Tracking Shot, Dolly In, Dolly Out, Whip Pan, Dutch Angle, Crane Shot,
            Bird's Eye View, Low Angle, Medium Shot, Close-Up, Establishing Shot, Slow Zoom.

            APPROVED LIGHTING TERMS (pick one per scene):
            High-Key Lighting, Low-Key Lighting, Volumetric Light, Golden Hour, Hard Sunlight,
            Soft Box Light, Neon Glow, Candle Light, Overcast Diffuse, Rim Light.

            video_brief fields:
            - action_dir: (Physical action ONLY. Use adverbs. Max 10 words. e.g. "Cami sprints at full speed, arms pumping wildly")
            - camera_dir: (One camera move + angle. e.g. "Lateral tracking shot, low angle, motion blur")
            - environment_dir: (Background context. e.g. "Sun-drenched desert canyon, towering red rock formations")
            - lighting_dir: (One lighting style. e.g. "High-key lighting, warm golden hour haze")

            MODEL-SPECIFIC OPTIMIZATION (Smart Routing):
            - IF Tag is 'Character' OR 'Dialogue': action_dir must include "expressive facial performance, mid-shot"
            - IF Tag is 'Action' OR 'Physics': camera_dir must include "dynamic camera, action blur, cinematic physics"
            - IF Tag is 'Environment': camera_dir must use "Establishing Shot, high detail environment"

            ASSETS (Consistency Anchors):
            ${assetContext}

            STORY BEATS (Directorial Map):
            ${beatContext}

            Task: Write the full script scene-by-scene.
            CRITICAL CHARACTER CONSISTENCY RULE:
            - Each scene's "visual_prompt" MUST explicitly name every character that appears in that scene.
            - For each character, copy their EXACT visual description from the ASSETS list above.
            - Example: "[Yellow rubber duck with orange beak, round body] and [Blue rubber duck with white beak] standing side-by-side" — NOT just "two ducks".
            - The number of characters described in visual_prompt MUST match the number of characters in the scene exactly.
            - NEVER merge or genericize different characters. Each must be individually described.
            
            GLOBAL IDENTITY DNA (The Anchor):
            "${globalDna}"
            
            Format: JSON Array of Scenes with these fields:
            - header (Standard slugline)
            - action (Vivid description of visual action)
            - characters_in_scene (Array of character names that appear in this scene — used for consistency)
            - sfx (Sound effects in ALL CAPS)
            - camera (Camera directions like PAN, ZOOM, TRUCK)
            - dialogue (Array: character, line, parenthetical)
            - visual_prompt (STATIC KEYFRAME: Start EXACTLY with the Global Identity DNA provided above. Then add environment, lighting, and style. Be EXPLICIT about count, color, and distinguishing features.)
            - visual_prompt_motion (LEGACY MOTION PROMPT: kept for backward compat, same as video_brief.action_dir + video_brief.camera_dir)
            - video_brief (OBJECT with action_dir, camera_dir, environment_dir, lighting_dir — see CINEMATOGRAPHER VIDEO BRIEF above)
            - action_intensity (Integer 1-10. RE-EVALUATE based on the actual 'action' text for THIS scene using this rubric:
                1-2: STATIC — sitting, standing still, no movement
                3-4: LOW — conversation, slow walk, subtle gesture
                5-6: MODERATE — light running, mild conflict, playful interaction
                7-8: HIGH — chasing, jumping, fighting, throwing objects
                9-10: PEAK — explosions, super-speed, climax chaos
                Do NOT blindly copy from the beat sheet. Score based on what you actually wrote in 'action'.)
            - primary_focus (String: MUST be one of: "Dialogue", "Action", "Ambient", "Establishing".)
        `;
      }

      const result = await aiService.generateStructured(prompt);
      if (Array.isArray(result)) {
        const newScript = result.map((s: any) => ({
          ...s,
          id: Math.random().toString(),
          global_dna: globalDna
        }));
        setScript(newScript);
        autoSave(newScript); // Immediate Save
      }

    } catch (e) {
      console.error(e);
      alert("Script generation failed. Please try again.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Find ALL characters + environment for a scene
  const findSceneCharacters = (scene: any): { refs: string[]; descriptions: string; envDesc: string; envRef: string | null } => {
    if (!assets || assets.length === 0) return { refs: [], descriptions: '', envDesc: '', envRef: null };

    const charAssets = assets.filter((a: any) => a.type === 'Character');
    const envAssets = assets.filter((a: any) => a.type === 'Environment');
    const matched: any[] = [];

    // 1. Match characters explicitly listed in characters_in_scene (new field)
    if (scene.characters_in_scene && Array.isArray(scene.characters_in_scene)) {
      for (const name of scene.characters_in_scene) {
        const asset = charAssets.find((a: any) => a.name.toLowerCase() === name.toLowerCase());
        if (asset && !matched.find(m => m.id === asset.id)) matched.push(asset);
      }
    }

    // 2. Match by dialogue speakers
    if (scene.dialogue && scene.dialogue.length > 0) {
      for (const d of scene.dialogue) {
        const asset = charAssets.find((a: any) => a.name.toLowerCase() === d.character?.toLowerCase());
        if (asset && !matched.find(m => m.id === asset.id)) matched.push(asset);
      }
    }

    // 3. Match by character name mention in action/header text
    for (const asset of charAssets) {
      const inAction = scene.action?.toLowerCase().includes(asset.name.toLowerCase());
      const inHeader = scene.header?.toLowerCase().includes(asset.name.toLowerCase());
      if ((inAction || inHeader) && !matched.find(m => m.id === asset.id)) {
        matched.push(asset);
      }
    }

    // 4. Find environment asset — match by name in header/action, else use first environment
    let envAsset: any = null;
    for (const env of envAssets) {
      const inAction = scene.action?.toLowerCase().includes(env.name.toLowerCase());
      const inHeader = scene.header?.toLowerCase().includes(env.name.toLowerCase());
      if (inAction || inHeader) { envAsset = env; break; }
    }
    if (!envAsset && envAssets.length > 0) envAsset = envAssets[0]; // fallback to first

    // Build outputs
    const refs = matched
      .map((a: any) => a.consistencyLock || a.image)
      .filter(Boolean);

    const descriptions = matched
      .map((a: any) => `[${a.name}: ${a.desc || a.name}]`)
      .join(' and ');

    const envDesc = envAsset ? (envAsset.desc || envAsset.name) : '';
    const envRef = envAsset?.image || null;

    return { refs, descriptions, envDesc, envRef };
  };

  // Legacy single-ref helper kept for backward compat
  const findConsistencyRef = (scene: any) => {
    return findSceneCharacters(scene).refs[0];
  };

  const handleGenerateShot = async (sceneId: string) => {
    const scene = script.find(s => s.id === sceneId);
    if (!scene || (!scene.visual_prompt && !scene.i2v_prompt)) return;

    setGeneratingSceneId(sceneId);
    try {
      const { refs, descriptions, envDesc, envRef } = findSceneCharacters(scene);
      const charCount = scene.characters_in_scene?.length || refs.length || 1;
      console.log(`Generating shot for scene ${sceneId}. Characters (${charCount}):`, refs, 'Env:', envDesc);

      const styleConfig = getStyleConfig(config?.modules?.style || config?.style);

      // Phase 2: LoRA injection — silently applied when character LoRAs are trained
      const projectLoras = config?.modules?.loras || {};
      const matchedChars = scene.characters_in_scene || [];
      const loraTokens = matchedChars
        .map((name: string) => {
          const asset = assets.find((a: any) => a.name?.toLowerCase() === name.toLowerCase());
          return asset ? projectLoras[asset.id]?.lora_trigger : null;
        })
        .filter(Boolean)
        .join(', ');
      const loraUrls = matchedChars
        .map((name: string) => {
          const asset = assets.find((a: any) => a.name?.toLowerCase() === name.toLowerCase());
          return asset ? projectLoras[asset.id]?.lora_url : null;
        })
        .filter(Boolean);
      if (loraUrls.length > 0) console.log(`[Phase 2] Injecting ${loraUrls.length} LoRA(s) for scene ${sceneId}:`, loraTokens);

      // Style-specific negative prompt passed as API parameter (NOT in text)
      const negative_prompt = styleConfig.id === 'bluey_vector' || styleConfig.id === 'adventure_time'
        ? '3D render, photorealistic, realistic textures, depth of field, shadows, CGI, complex background'
        : styleConfig.id === 'pixar_3d'
          ? 'flat vector, 2D, sketch, watercolor, low detail'
          : 'watermark, text, blurry, low quality';

      // Clean natural language prompt — STYLE FIRST, then LoRA triggers, then environment, then characters, then scene
      const envBlock = envDesc ? `${envDesc}. ` : '';
      const charBlock = descriptions ? `${descriptions}. ` : '';
      const loraBlock = loraTokens ? `${loraTokens}. ` : '';
      const finalPrompt =
        `${styleConfig.prompt}. ` +
        loraBlock +
        envBlock +
        charBlock +
        (scene.visual_prompt || scene.i2v_prompt || scene.action);

      const imageUrl = await imageService.generate(finalPrompt, '16:9', {
        char_ref: refs[0],
        negative_prompt,
        ...(loraUrls.length > 0 && { loras: loraUrls }),
      });

      let generatedScript: ScriptScene[] = [];
      setScript(prev => {
        generatedScript = prev.map(s => s.id === sceneId ? { ...s, production_image: imageUrl } : s);
        return generatedScript;
      });
      setTimeout(() => autoSave(generatedScript), 0);
    } catch (e) {
      console.error(e);
      alert('Shot generation failed');
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateAllShots = async (optimize: boolean = false) => {
    if (script.length === 0) return;
    setIsGeneratingAllShots(true);
    setShowRenderModal(false);
    stopShotsRef.current = false;

    for (let i = 0; i < script.length; i++) {
      const scene = script[i];
      if (stopShotsRef.current) break;
      if (scene.production_image) continue; // Skip existing
      if (!scene.visual_prompt && !scene.i2v_prompt) continue;

      // Skip generating intermediate temporal bridge shots (Chunks 2,3,4) if prioritizing costs
      if (optimize && i > 0 && i < script.length - 1) {
        continue;
      }

      setGeneratingSceneId(scene.id);
      try {
        const { refs, descriptions, envDesc, envRef } = findSceneCharacters(scene);
        const charCount = scene.characters_in_scene?.length || refs.length || 1;
        console.log(`Auto-generating shot for scene ${scene.id}. Characters (${charCount}):`, refs, 'Env:', envDesc);

        const styleConfig = getStyleConfig(config?.modules?.style || config?.style);

        // Phase 2: LoRA injection
        const projectLoras = config?.modules?.loras || {};
        const matchedChars = scene.characters_in_scene || [];
        const loraTokens = matchedChars
          .map((name: string) => {
            const asset = assets.find((a: any) => a.name?.toLowerCase() === name.toLowerCase());
            return asset ? projectLoras[asset.id]?.lora_trigger : null;
          })
          .filter(Boolean)
          .join(', ');
        const loraUrls = matchedChars
          .map((name: string) => {
            const asset = assets.find((a: any) => a.name?.toLowerCase() === name.toLowerCase());
            return asset ? projectLoras[asset.id]?.lora_url : null;
          })
          .filter(Boolean);

        const negative_prompt = styleConfig.id === 'bluey_vector' || styleConfig.id === 'adventure_time'
          ? '3D render, photorealistic, realistic textures, depth of field, shadows, CGI, complex background'
          : styleConfig.id === 'pixar_3d'
            ? 'flat vector, 2D, sketch, watercolor, low detail'
            : 'watermark, text, blurry, low quality';

        const envBlock = envDesc ? `${envDesc}. ` : '';
        const charBlock = descriptions ? `${descriptions}. ` : '';
        const loraBlock = loraTokens ? `${loraTokens}. ` : '';
        const finalPrompt =
          `${styleConfig.prompt}. ` +
          loraBlock +
          envBlock +
          charBlock +
          (scene.visual_prompt || scene.i2v_prompt || scene.action);

        const imageUrl = await imageService.generate(finalPrompt, '16:9', {
          char_ref: refs[0],
          negative_prompt,
          ...(loraUrls.length > 0 && { loras: loraUrls }),
        });

        let generatedScript: ScriptScene[] = [];
        setScript(prev => {
          generatedScript = prev.map(s => s.id === scene.id ? { ...s, production_image: imageUrl } : s);
          return generatedScript;
        });
        setTimeout(() => autoSave(generatedScript), 0);

      } catch (e) {
        console.error(`Failed to generate shot for scene ${scene.id}`, e);
      }
    }
    setGeneratingSceneId(null);
    setIsGeneratingAllShots(false);
  };


  const stopGeneration = () => {
    stopShotsRef.current = true;
    setIsGeneratingAllShots(false); // UI update immediately
  };

  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null); // dialogue index

  // Helper to generate audio for a specific dialogue line
  const handleGenerateDialogueAudio = async (sceneIndex: number, dialogueIndex: number, text: string, characterName: string) => {
    const key = `${sceneIndex}-${dialogueIndex}`;
    setGeneratingAudio(key);

    try {
      // Find Voice ID from config
      // casting = { "Char ID": "voice_id" }
      // We need to map Character Name -> Character ID -> Voice ID
      // This is tricky if we don't have the char ID here. 
      // Ideally ScriptScene.dialogue should store CharID, but it likely only has Name.
      // Let's try to find character by name in assets.
      const character = assets.find(a => a.name === characterName);

      // Handle both old (string) and new (object) casting formats
      const castingEntry = character ? config?.modules?.audio?.casting?.[character.id] : null;

      let voiceId = "alloy";
      let options = { speed: 1.0, stability: 0.5 };

      if (castingEntry) {
        if (typeof castingEntry === 'string') {
          voiceId = castingEntry;
        } else if (typeof castingEntry === 'object') {
          voiceId = castingEntry.voiceId || "alloy";
          options.speed = castingEntry.speed || 1.0;
          options.stability = castingEntry.stability || 0.5;
        }
      }

      const tempUrl = await audioService.generateSpeech(text, voiceId, options);

      if (tempUrl) {
        let finalAudioUrl = tempUrl;

        // Persist to Storage & Assets
        if (user?.uid) {
          try {
            console.log("Uploading dialogue audio to storage...");
            const blobRes = await fetch(tempUrl);
            const blob = await blobRes.blob();

            const timestamp = Date.now();
            const storagePath = `users/${user.uid}/assets/${timestamp}_dialogue_${sceneIndex}_${dialogueIndex}.mp3`;
            finalAudioUrl = await storageService.uploadFile(storagePath, blob);
            console.log("Dialogue audio uploaded:", finalAudioUrl);

            await assetService.saveAsset(user.uid, {
              type: 'audio',
              url: finalAudioUrl,
              name: `Voice: ${characterName} - Scene ${sceneIndex + 1}`,
              prompt: `Voice: ${voiceId} | Text: "${text.slice(0, 30)}..."`,
              metadata: {
                character: characterName,
                voiceId: voiceId,
                projectId: config?.id || null
              }
            });
            console.log("Dialogue asset saved to library");
          } catch (err) {
            console.error("Failed to persist dialogue asset", err);
            // Fallback to tempUrl if upload fails
          }
        }

        let generatedScript: ScriptScene[] = [];
        setScript(prev => {
          generatedScript = [...prev];
          const scene = { ...generatedScript[sceneIndex] };
          const dialogue = [...scene.dialogue];
          dialogue[dialogueIndex] = { ...dialogue[dialogueIndex], audio_url: finalAudioUrl };
          scene.dialogue = dialogue;
          generatedScript[sceneIndex] = scene;

          return generatedScript;
        });

        // Save audio to project Data outside of the setScript pure function
        setTimeout(() => autoSave(generatedScript), 0);
      }

    } catch (e) {
      console.error(e);
      // Check if there's no cast configured — this is the most common cause
      const hasCast = config?.modules?.audio?.casting;
      if (!hasCast || Object.keys(hasCast).length === 0) {
        alert("No voice has been cast for this character. Go to Audio Studio and run Auto-Cast first.");
      } else {
        alert("Failed to generate audio. Check that your OpenAI API key is configured.");
      }
    } finally {
      setGeneratingAudio(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f13] text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 p-6 pb-0">
        <div>
          <h2 className="text-3xl font-black mb-2 text-white">Production Script</h2>
          <p className="text-gray-400">Review the screenplay and generate production shots.</p>
        </div>

        <div className="flex gap-2">
          {script.length === 0 ? (
            <button
              onClick={handleGenerateScript}
              disabled={isGeneratingScript}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
            >
              {isGeneratingScript ? <Icon icon={ICONS.spinner} className="animate-spin" size={20} /> : <Icon icon={ICONS.bot} size={20} />}
              <span>{isGeneratingScript ? 'Auto-Generating Script...' : 'Generate Full Script'}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              {/* Re-Generate (Secondary) */}
              <button
                onClick={() => { if (confirm("Regenerate script? Current progress will be lost.")) handleGenerateScript(); }}
                disabled={isGeneratingScript || isGeneratingAllShots}
                className="p-3 rounded-xl bg-[#262626] text-gray-400 hover:text-white transition-all"
                title="Regenerate Script"
              >
                <Icon icon={ICONS.refresh} size={20} />
              </button>

              {/* Auto-Render (Primary) */}
              {!isGeneratingAllShots ? (
                <div className="relative">
                  <button
                    onClick={() => setShowRenderModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all hover:scale-105"
                  >
                    <Icon icon={ICONS.image} size={20} />
                    <span>Auto-Render Options... ({script.filter(s => !s.production_image).length})</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={stopGeneration}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Icon icon={ICONS.close} size={20} />
                  <span>Stop Rendering</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VERSION ACTIONS */}
      {onSaveVersion && (
        <div className="flex justify-end px-6 mb-2">
          <button
            onClick={onSaveVersion}
            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon={ICONS.save} size={12} /> Save Script Version
          </button>
        </div>
      )}

      {/* VERSION HISTORY */}
      {versions.filter((v: any) => v.phase === 'script').length > 0 && (
        <div className="px-6 mb-6">
          <div className="p-4 bg-[#1e1e1e] border border-[#333] rounded-xl">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon icon={ICONS.clock} size={12} /> Script History
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
              {versions.filter((v: any) => v.phase === 'script').map((v: any) => (
                <div key={v.id} className="flex justify-between items-center text-sm p-2 hover:bg-[#262626] rounded-lg group">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-mono">{v.timestamp?.toDate().toLocaleString()}</span>
                    <span className="text-gray-400 text-xs">
                      {(v.snapshotData.modules?.script || []).length} Scenes
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Restore this script version?")) {
                        if (v.snapshotData.modules?.script) {
                          setScript(v.snapshotData.modules.script);
                        }
                      }
                    }}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT STREAM */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-12">
        {isGeneratingScript ? (
          // Inline loader — consistent with Visual and Audio phases
          <div className="h-96 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-purple-500/30 rounded-3xl bg-purple-900/5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon icon={ICONS.bot} size={24} className="text-purple-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">Writing your screenplay...</p>
              <p className="text-sm text-gray-500 mt-1">AI is scripting all {beats?.length || 0} scenes from your beat sheet</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : script.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-[#262626] rounded-3xl gap-4">
            <Icon icon={ICONS.fileText} size={64} className="opacity-20" />
            <p>Ready to write? Click Generate above.</p>
          </div>
        ) : (
          script.map((scene, i) => (
            <div key={scene.id} className="grid grid-cols-1 lg:grid-cols-5 gap-8 border-b border-[#262626] pb-12 last:border-0">

              {/* LEFT: SCRIPT VERTICAL (3 Cols) - DARK MODE */}
              <div className="lg:col-span-3 bg-[#1e1e1e] text-gray-300 p-8 rounded-xl shadow-xl font-mono text-sm leading-relaxed relative border border-[#333]">
                {/* Slugline */}
                <div className="font-bold underline uppercase mb-6 text-white bg-[#333] inline-block px-2 py-1 rounded">{scene.header}</div>

                {/* Action */}
                <div className="mb-6 text-gray-300">
                  <p>{scene.action}</p>
                </div>

                {/* Dialogue */}
                <div className="space-y-4 mb-6 px-8">
                  {scene.dialogue.map((d, idx) => (
                    <div key={idx} className="text-center group relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="font-bold uppercase text-white">{d.character}</div>
                      {d.parenthetical && <div className="text-xs italic text-gray-500">({d.parenthetical})</div>}
                      <div className="text-white mb-2">{d.line}</div>

                      {/* Audio Controls */}
                      <div className="flex justify-center gap-2 opacity-100 transition-opacity">
                        {d.audio_url ? (
                          <button
                            onClick={() => new Audio(d.audio_url!).play()}
                            className="text-xs flex items-center gap-1 text-green-400 bg-green-900/20 px-2 py-1 rounded hover:bg-green-900/40"
                          >
                            <Icon icon={ICONS.volume} size={12} /> Play
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateDialogueAudio(i, idx, d.line, d.character)}
                            disabled={generatingAudio === `${i}-${idx}`}
                            className="text-xs flex items-center gap-1 text-purple-400 bg-purple-900/20 px-2 py-1 rounded hover:bg-purple-900/40 disabled:opacity-50"
                          >
                            {generatingAudio === `${i}-${idx}` ? <Icon icon={ICONS.spinner} className="animate-spin" size={12} /> : <Icon icon={ICONS.mic} size={12} />}
                            Generate Audio
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tech Notes & Motion Vectors */}
                <div className="mt-8 pt-4 border-t border-[#333] flex flex-col gap-3">
                  <div className="flex gap-4 text-xs font-bold uppercase tracking-wider items-center">
                    <span className="text-red-400 flex items-center gap-1">
                      <Icon icon={ICONS.music || ICONS.volume} size={12} />
                      {scene.sfx || 'NO SFX'}
                    </span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <Icon icon={ICONS.video} size={12} />
                      {scene.camera || 'STATIC'}
                    </span>

                    {/* Hybrid Engine Tag */}
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`px-2 py-1 rounded bg-black/30 flex items-center gap-1 ${scene.primary_focus === 'Dialogue' ? 'text-blue-300' : scene.primary_focus === 'Action' ? 'text-orange-300' : 'text-gray-300'}`}>
                        {scene.primary_focus === 'Dialogue' ? '🗣️' : scene.primary_focus === 'Action' ? '🎬' : '🎥'} {scene.primary_focus || 'Action'}
                      </span>
                      {scene.action_intensity && (
                        <span className={`px-2 py-1 rounded bg-black/30 flex items-center gap-1 ${scene.action_intensity > 7 ? 'text-red-300' : 'text-gray-300'}`}>
                          ⚡ Intensity: {scene.action_intensity}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 15s Hobbyist specific UI: Cinematic Vectors */}
                  {scene.motion_score !== undefined && (
                    <div className="bg-[#141414] border border-[#262626] rounded-lg p-3 mt-2 grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center border-b border-[#262626] pb-2 text-xs">
                        <span className="text-gray-500 font-bold uppercase">Motion Vector</span>
                        <span className="text-purple-400 font-bold">Score: {scene.motion_score}/7</span>
                      </div>
                      <div className="text-xs space-y-2 mt-1">
                        <div><span className="text-gray-500 mr-2">F0:</span> <span className="text-gray-300">{scene.start_state}</span></div>
                        <div><span className="text-emerald-500 mr-2">Δ:</span> <span className="text-gray-300">{scene.the_delta}</span></div>
                        <div><span className="text-gray-500 mr-2">F90:</span> <span className="text-gray-300">{scene.end_state}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fold Effect (Dark) */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#333] to-[#1e1e1e] drop-shadow-md"></div>
              </div>

              {/* RIGHT: PRODUCTION PANEL (2 Cols) */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Prompt Card */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase">
                      <Icon icon={ICONS.sparkles} size={12} />
                      <span>Visual Prompt</span>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(scene.visual_prompt || '')}
                      className="text-gray-500 hover:text-white"
                    >
                      <Icon icon={ICONS.copy} size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                    {scene.visual_prompt || scene.i2v_prompt || "No prompt generated."}
                  </p>
                </div>

                {/* Preview / Action */}
                <div className="flex-1 min-h-[200px] bg-black rounded-xl overflow-hidden relative border border-[#262626] group">
                  {scene.production_image ? (
                    <>
                      <img src={scene.production_image} alt="Shot" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setPreviewUrl(scene.production_image!)} className="p-3 bg-white/10 rounded-full hover:bg-white text-white hover:text-black transition-all">
                          <Icon icon={ICONS.eye} size={20} />
                        </button>
                        <button
                          onClick={() => handleGenerateShot(scene.id)}
                          className="p-3 bg-purple-600 rounded-full text-white hover:bg-purple-500 transition-all"
                        >
                          <Icon icon={ICONS.refresh} size={20} />
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white uppercase">
                        Final Render
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-600 p-6 text-center">
                      <Icon icon={ICONS.image} size={32} className="opacity-50" />
                      <p className="text-xs">No shot generated for this scene yet.</p>
                      <button
                        onClick={() => handleGenerateShot(scene.id)}
                        disabled={generatingSceneId === scene.id || (!scene.visual_prompt && !scene.i2v_prompt)}
                        className="px-6 py-2 bg-[#262626] hover:bg-purple-600 hover:text-white transition-all rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingSceneId === scene.id ? (
                          <Icon icon={ICONS.spinner} className="animate-spin" size={16} />
                        ) : (
                          <Icon icon={ICONS.video} size={16} />
                        )}
                        <span>{generatingSceneId === scene.id ? 'Rendering...' : 'Generate Shot'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Shot Preview Modal */}
      {previewUrl && <ShotPreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />}

      {/* Auto-Render Options Modal */}
      {showRenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl w-full max-w-lg p-6 flex flex-col gap-6 shadow-2xl relative">
            <button onClick={() => setShowRenderModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <Icon icon={ICONS.close} size={24} />
            </button>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-emerald-400">
                <Icon icon={ICONS.sparkles} size={28} />
                <h3 className="text-2xl font-black text-white">Auto-Render</h3>
              </div>
              <p className="text-gray-400 text-sm">Choose how you want to generate your visual storyboard shots. Only the first and last shots are strictly required for the Hobbyist AI Video pipeline.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Option A: All Shots */}
              <button
                onClick={() => handleGenerateAllShots(false)}
                className="w-full text-left p-4 rounded-xl border border-[#333] bg-[#141414] hover:bg-[#262626] hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white group-hover:text-emerald-400">Render All Shots <span className="text-gray-500 text-xs font-normal">(Storyboard Mode)</span></h4>
                  <span className="text-xs font-bold bg-purple-900/30 text-purple-400 px-2 py-1 rounded">Cost: {script.filter(s => !s.production_image).length} Credits</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Generates a visual image for every single chunk in your script. Best for getting a full visual comic-strip storyboard before producing the final video.</p>
              </button>

              {/* Option B: Optimized */}
              <button
                onClick={() => handleGenerateAllShots(true)}
                className="w-full text-left p-4 rounded-xl border border-emerald-500/30 bg-emerald-900/10 hover:bg-emerald-900/20 hover:border-emerald-500 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">RECOMMENDED</div>
                <div className="flex justify-between items-start mb-2 pr-24">
                  <h4 className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-2">Render Optimized <span className="text-emerald-200/50 text-xs font-normal">(MVP Mode)</span></h4>
                  <span className="text-xs font-bold bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">Cost: {script.filter((s, i) => !s.production_image && (i === 0 || i === script.length - 1)).length} Credits</span>
                </div>
                <p className="text-sm text-emerald-100/70 leading-relaxed">Generates only the strictly required anchor images (First and Last chunk). Saves credits by skipping the middle temporal bridges, which the AI video generator ignores anyway.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#262626]">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl hover:bg-[#262626] text-gray-400 hover:text-white transition-colors"
        >
          Back to Audio
        </button>
        <button
          disabled={script.length === 0}
          onClick={() => onNext(script)}
          className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finish & Production &rarr;
        </button>
      </div>
    </div>
  );
}
