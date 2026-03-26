// src/lib/productionOrchestrator.ts

export type ScriptScene = {
  id: string;
  header: string;
  action: string;
  visual_prompt?: string;
  visual_prompt_motion?: string;
  production_image?: string;
  image_end_url?: string;
  production_video?: string;
  video_reference_url?: string;
  camera?: any;
  lighting?: string;
  dialogue?: Array<{ character: string; line: string; parenthetical?: string; audio_url?: string }>;
  tags?: string[];
  action_intensity?: number;
  primary_focus?: string;
  video_brief?: {
    action_dir?: string;
    camera_dir?: string;
    environment_dir?: string;
    lighting_dir?: string;
  };
  production_mode?: ProductionMode;
  routing_rationale?: string;

  // 15s Hobbyist Micro-Short properties
  target_model?: string;
  start_state?: string;
  end_state?: string;
  the_delta?: string;
  motion_score?: number;
  i2v_prompt?: string;       // I2V motion prompt (legacy name — model-agnostic, works with Wan/Kling/LTX)
  global_dna?: string;
};

export type ProductionMode = 'KEN_BURNS' | 'GENERATIVE_VIDEO' | 'AMBIGUOUS';

export type RoutedScene = ScriptScene & {
  production_mode: ProductionMode;
  routing_rationale: string;
};

/**
 * Evaluates the structural tags of a scene (from the AI Beat Sheet + Script)
 * and determines the optimal, most cost-effective rendering strategy.
 *
 * ROUTING POLICY (The 20/80 Rule):
 *   ~20% of scenes: Generative AI Video (true high-action sequences only, intensity 7+)
 *   ~80% of scenes: Ken Burns (dialogue, establishing, ambient, and moderate action ≤6)
 *
 * Intensity Scale (matches BeatSheet and Script prompts):
 *   1-2: Static   → KEN_BURNS
 *   3-4: Low      → KEN_BURNS
 *   5-6: Moderate → KEN_BURNS  (threshold raised from ≤4 → ≤6)
 *   7-8: High     → GENERATIVE_VIDEO
 *   9-10: Peak    → GENERATIVE_VIDEO
 */
export function routeSceneForProduction(scene: ScriptScene, tier: string = 'Hobbyist'): RoutedScene {
  // Manual Override: Director tier only — honour user's explicit choice
  if (tier === 'Director' && scene.production_mode && scene.routing_rationale === 'Manual Override') {
    return scene as RoutedScene;
  }

  // Safe default: Ken Burns (cheap) not AI Video (expensive).
  // Scenes with missing/incomplete data never accidentally get expensive routing.
  let mode: ProductionMode = 'KEN_BURNS';
  let rationale = 'Default: Ken Burns (safe fallback when scene data is incomplete)';

  if (scene.routing_rationale !== 'Manual Override') {
    const intensity = scene.action_intensity ?? 3; // Default 3 (Low) when missing

    // FIX 1: isHighAction now requires intensity >= 7.
    // Previously ANY scene with primary_focus='Action' triggered AI Video regardless of intensity,
    // causing all 'Action' beats (including low-motion dialogue) to get expensive rendering.
    const isHighAction = intensity >= 7;

    const isDialogueHeavy =
      scene.primary_focus === 'Dialogue' ||
      (scene.dialogue && scene.dialogue.length > 3);

    const isEstablishing =
      scene.primary_focus === 'Establishing' ||
      scene.primary_focus === 'Ambient';

    if (isHighAction) {
      mode = 'GENERATIVE_VIDEO';
      rationale = `High action intensity (${intensity}/10 ≥ 7) requires AI Video for motion.`;
    } else if (isDialogueHeavy) {
      mode = 'KEN_BURNS';
      rationale = `Dialogue-heavy scene → Ken Burns 2.5D preserves character consistency and saves cost.`;
    } else if (isEstablishing) {
      mode = 'KEN_BURNS';
      rationale = `${scene.primary_focus || 'Establishing'} scene → Ken Burns pan/zoom for cinematic atmosphere.`;
    } else {
      // Middle ground: intensity range 1-6 → Ken Burns, 7+ → AI Video
      // FIX 2: Raised threshold from ≤4 to ≤6.
      // Scores 5-6 (Moderate) are now correctly routed to Ken Burns.
      // Previously intensity=5 (the old default) was sent to expensive AI Video.
      if (intensity <= 6) {
        mode = 'KEN_BURNS';
        rationale = `Moderate intensity (${intensity}/10, ≤ 6) → Ken Burns. Reserve AI Video for intensity 7+ scenes.`;
      } else {
        mode = 'GENERATIVE_VIDEO';
        rationale = `Intensity (${intensity}/10 > 6) → AI Video for dynamic motion.`;
      }
    }
  }

  return {
    ...scene,
    production_mode: mode,
    routing_rationale: rationale,
  };
}

/**
 * Processes an entire script to attach routing metadata before production begins.
 */
export function orchestrateScriptProduction(script: ScriptScene[], tier: string = 'Hobbyist'): RoutedScene[] {
  return script.map(scene => routeSceneForProduction(scene, tier));
}
