import type { SceneData } from '@/types/dev-console';
import { globalScene } from './scenes/global';
import { scriptoplayDashboardScene } from './scenes/scriptoplay-dashboard';
import { scriptoplayWorkspaceScene } from './scenes/scriptoplay-workspace';
import { scriptoplayCartoonBlenderScene } from './scenes/scriptoplay-cartoon-blender';
import { bqoolDashboardScene } from './scenes/bqool-dashboard';

// Ordered most-specific → least-specific
// First match wins
const REGISTRY: { pattern: RegExp; scene: SceneData }[] = [
  // ── Scriptoplay ──────────────────────────────────────────────────────────
  {
    pattern: /^\/scriptoplay\/dashboard\/cartoon-blender/,
    scene: scriptoplayCartoonBlenderScene,
  },
  {
    pattern: /^\/scriptoplay\/dashboard\/workspace/,
    scene: scriptoplayWorkspaceScene,
  },
  {
    pattern: /^\/scriptoplay\/dashboard/,
    scene: scriptoplayDashboardScene,
  },
  {
    pattern: /^\/scriptoplay/,
    scene: scriptoplayDashboardScene,
  },

  // ── BQool ────────────────────────────────────────────────────────────────
  {
    pattern: /^\/bqool/,
    scene: bqoolDashboardScene,
  },
];

/**
 * Returns the best matching SceneData for a given pathname.
 * Falls back to the global scene if no pattern matches.
 */
export function getSceneForPath(pathname: string): SceneData {
  for (const { pattern, scene } of REGISTRY) {
    if (pattern.test(pathname)) return scene;
  }
  return globalScene;
}
