import type { SceneData } from '@/types/dev-console';

export const scriptoplayWorkspaceScene: SceneData = {
  id: 'scriptoplay-workspace',
  title: 'Scriptoplay',
  subtitle: 'Project Workspace',
  product: 'scriptoplay',

  design: {
    figmaFrame: {
      embedUrl: '',
      title: 'Workspace Editor — Script + Visual Split',
    },
    uxAuditPoints: [
      {
        id: 'sp-w-1',
        title: 'Script-left, Visual-right mirrors filmmakers\' mental model',
        description:
          'Writers think left-to-right: words → images. Placing the script panel on the left and the visual gallery on the right mirrors how production documents (scripts, storyboards) are read and reviewed in sequence.',
        category: 'layout',
        impact: 'high',
      },
      {
        id: 'sp-w-2',
        title: 'One-click scene addition preserves creative flow',
        description:
          'Adding a scene requires a single action. Every extra click or modal in a creative tool is a context-switch that breaks flow state. The "+" button is always visible and never triggers a multi-step form.',
        category: 'interaction',
        impact: 'high',
      },
      {
        id: 'sp-w-3',
        title: 'Magic Mode as progressive disclosure',
        description:
          'Advanced generation controls are hidden behind a "Magic Mode" toggle. This keeps the default experience clean for new users while giving power users full access without a separate page.',
        category: 'visual',
        impact: 'medium',
      },
      {
        id: 'sp-w-4',
        title: 'Asset gallery uses optimistic UI',
        description:
          'When a user triggers image generation, a skeleton card appears immediately. The actual image replaces it when the API resolves — perceived latency drops dramatically.',
        category: 'performance',
        impact: 'high',
      },
    ],
    designDecisions: [
      {
        title: 'Modular shot cards',
        rationale:
          'Each scene is a self-contained card with script text, visual prompt, and generated image. Drag-to-reorder and individual regeneration make the workflow non-destructive.',
      },
      {
        title: 'Inline prompt editing',
        rationale:
          'Visual prompts are editable in-place on the card. No separate dialog means users stay in context and can iterate faster.',
      },
    ],
  },

  engineering: {
    techStack: [
      { name: 'fal.ai flux-pro', category: 'ai' },
      { name: 'fal.ai ltx-video', category: 'ai' },
      { name: 'FFmpeg', category: 'infra' },
      { name: 'Supabase Storage', category: 'database' },
      { name: 'React 19', category: 'framework' },
    ],
    architectureNote:
      'Image generation → Supabase Storage → LTX-Video animation → FFmpeg scene assembly. The orchestrator API route manages fal.ai queue polling.',
    snippets: [
      {
        label: 'Orchestrator — fal.ai Queue Polling',
        language: 'typescript',
        layer: 'backend',
        githubUrl:
          'https://github.com/mygaverse/mygaverse-demo/blob/main/src/app/api/scriptoplay/orchestrator/route.ts',
        code: `// POST /api/scriptoplay/orchestrator
export async function POST(request: Request) {
  const { model, input, action, requestId } = await request.json();

  // Initial submission
  if (action === 'submit') {
    const result = await fal.queue.submit(model, { input });
    return Response.json({ request_id: result.request_id });
  }

  // Status polling (called client-side on interval)
  if (action === 'status') {
    const status = await fal.queue.status(model, {
      requestId,
      logs: true,
    });
    return Response.json(status);
  }

  // Result retrieval
  if (action === 'result') {
    const result = await fal.queue.result(model, { requestId });
    return Response.json(result);
  }
}`,
      },
      {
        label: 'CartoonEditor — Workspace Shell',
        language: 'typescript',
        layer: 'frontend',
        code: `// Composes the three-pane workspace
export function CartoonEditor({ project, magicMode, setMagicMode }) {
  const {
    shots, isLoading,
    addShot, updateShot, deleteShot,
    generateVideo, isRendering,
  } = useCartoonEditor(project.id);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Script assembly */}
      <CartoonScriptAssembly
        shots={shots}
        onUpdate={updateShot}
        onDelete={deleteShot}
      />
      {/* Center: Visual gallery with image generation */}
      <VisualGallery
        shots={shots}
        onAdd={addShot}
        magicMode={magicMode}
      />
      {/* Right: Preview + render controls */}
      <PreviewControls
        project={project}
        isRendering={isRendering}
        onRender={generateVideo}
      />
    </div>
  );
}`,
      },
      {
        label: 'storageService — Upload Generated Image',
        language: 'typescript',
        layer: 'backend',
        code: `// Proxies external image URL through the app to Supabase Storage
// (avoids CORS issues with direct fal.ai CDN uploads)
async uploadFromUrl(imageUrl: string, path: string): Promise<string> {
  // Step 1: Fetch image through our proxy endpoint
  const proxyRes = await fetch(
    \`/api/scriptoplay/proxy-fetch?url=\${encodeURIComponent(imageUrl)}\`
  );
  const blob = await proxyRes.blob();

  // Step 2: Upload blob to Supabase Storage
  const { error } = await supabase.storage
    .from('assets')
    .upload(path, blob, { contentType: blob.type, upsert: true });

  if (error) throw error;

  // Step 3: Return public URL
  const { data } = supabase.storage.from('assets').getPublicUrl(path);
  return data.publicUrl;
}`,
      },
    ],
  },

  intelligence: {
    systemPrompts: [
      {
        label: 'Scene Assembly — Script Parser',
        model: 'gemini-2.0-flash',
        content: `You are an expert screenplay analyst for animated content.

Given a raw script or scene description, extract and structure it into discrete shots.
Each shot must contain:
- A concise scene title (max 6 words)
- Character list (who appears)
- Action description (what happens visually)
- Dialogue lines with speaker attribution
- Suggested visual style prompt for image generation
- Estimated duration in seconds (2–8 sec per shot)

Return ONLY valid JSON. No markdown. No explanation.
Schema: ScriptScene[]`,
      },
      {
        label: 'Visual Prompt Generator',
        model: 'gemini-2.0-flash',
        content: `You are a visual prompt engineer specializing in animated cartoon imagery.

Given a scene action description and character list, generate an optimized text-to-image prompt that:
1. Specifies the art style (e.g., "2D cartoon, vibrant colors, clean lines")
2. Describes character poses and expressions
3. Describes the background environment
4. Includes lighting direction and mood
5. Stays under 120 tokens for best model performance

Do NOT include character names in the prompt — describe appearance instead.
Return ONLY the prompt string. No JSON. No explanation.`,
      },
    ],
    chainOfThought: [
      {
        id: 'sp-w-c-1',
        title: 'User adds scene + writes action',
        description: 'Shot card created locally with optimistic state — no API call yet',
        type: 'input',
      },
      {
        id: 'sp-w-c-2',
        title: 'Gemini generates visual prompt',
        description: 'Action text → Gemini → structured visual prompt string for image gen',
        type: 'llm',
      },
      {
        id: 'sp-w-c-3',
        title: 'fal.ai flux-pro generates image',
        description: 'Visual prompt submitted to fal.ai queue → request_id returned',
        type: 'api',
      },
      {
        id: 'sp-w-c-4',
        title: 'Orchestrator polls for result',
        description: 'Client polls /api/scriptoplay/orchestrator?action=status every 2s',
        type: 'transform',
      },
      {
        id: 'sp-w-c-5',
        title: 'Image stored in Supabase',
        description: 'Result URL proxied through app → uploaded to Supabase Storage with RLS',
        type: 'api',
      },
      {
        id: 'sp-w-c-6',
        title: 'Asset record saved to DB',
        description: 'Asset row created in assets table linking shot → storage path → public URL',
        type: 'output',
      },
    ],
  },
};
