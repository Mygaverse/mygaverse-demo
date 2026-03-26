import type { SceneData } from '@/types/dev-console';

export const scriptoplayCartoonBlenderScene: SceneData = {
  id: 'scriptoplay-cartoon-blender',
  title: 'Scriptoplay',
  subtitle: 'Cartoon Blender',
  product: 'scriptoplay',

  design: {
    figmaFrame: {
      embedUrl: '',
      title: 'Cartoon Blender — Blend UI',
    },
    uxAuditPoints: [
      {
        id: 'sp-cb-1',
        title: 'Dual input encourages experimentation',
        description:
          'Two side-by-side input zones (Script A / Script B) make the blending metaphor tangible. Users understand immediately that two things go in and one comes out.',
        category: 'interaction',
        impact: 'high',
      },
      {
        id: 'sp-cb-2',
        title: 'Blend intensity slider for control',
        description:
          'A 0–100% slider lets users weight one script over the other. This gives the illusion of precise control while the LLM interprets it as a soft constraint.',
        category: 'interaction',
        impact: 'medium',
      },
      {
        id: 'sp-cb-3',
        title: 'Result preview before commit',
        description:
          'The blended output appears in a preview pane before the user saves it as a new project. Reduces commitment anxiety for an irreversible-feeling operation.',
        category: 'interaction',
        impact: 'high',
      },
    ],
    designDecisions: [
      {
        title: 'Tool-first layout instead of wizard',
        rationale:
          'A wizard locks users into a linear flow. The blender shows all inputs and output simultaneously, letting power users adjust any variable at any point.',
      },
      {
        title: 'Genre and tone tags as structured input',
        rationale:
          'Free-text prompts produce inconsistent results. Constrained tag inputs (genre, tone, format) give the LLM cleaner signals and let us validate before sending.',
      },
    ],
  },

  engineering: {
    techStack: [
      { name: 'Google Gemini 2.0 Flash', category: 'ai' },
      { name: 'Structured JSON output', category: 'ai' },
      { name: 'Zod validation', category: 'framework' },
      { name: 'React 19', category: 'framework' },
    ],
    architectureNote:
      'The blender calls /api/scriptoplay/gemini with a structured-output schema. Gemini returns JSON matching ScriptBlend; Zod validates before the UI renders.',
    snippets: [
      {
        label: 'ScriptBlender — Blend Handler',
        language: 'typescript',
        layer: 'frontend',
        code: `async function handleBlend() {
  setIsBlending(true);
  try {
    const blendedScript = await aiService.generateStructured({
      prompt: buildBlendPrompt(scriptA, scriptB, intensity, options),
      schema: ScriptBlendSchema,  // Zod schema passed as JSON Schema
      model: 'gemini-2.0-flash',
    });
    setBlendResult(blendedScript);
  } catch (err) {
    toast.error('Blend failed — try adjusting intensity or inputs');
  } finally {
    setIsBlending(false);
  }
}`,
      },
      {
        label: 'Gemini API Route — Structured Output',
        language: 'typescript',
        layer: 'backend',
        code: `// POST /api/scriptoplay/gemini
export async function POST(request: Request) {
  const { prompt, schema } = await request.json();
  const { user } = await requireAuth();

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,   // Enforces JSON output shape
    },
  });

  const result = await model.generateContent(prompt);
  const json = JSON.parse(result.response.text());
  return Response.json({ data: json });
}`,
      },
    ],
  },

  intelligence: {
    systemPrompts: [
      {
        label: 'Script Blend — System Prompt',
        model: 'gemini-2.0-flash',
        content: `You are a creative script development AI specializing in animated content.

You will receive two story concepts or partial scripts (Script A and Script B) and a blend intensity (0–100, where 0 = pure A, 100 = pure B, 50 = equal mix).

Your task is to synthesize a single cohesive narrative that:
1. Preserves the strongest character voices from the dominant script
2. Resolves plot contradictions by choosing the most dramatically compelling path
3. Maintains consistent visual tone throughout (do not mix incompatible art styles)
4. Produces exactly 4–6 scenes with clear action beats and dialogue

Rules:
- Do NOT explain your choices. Output JSON only.
- Character names must be consistent across all scenes
- Each scene must have a duration estimate (seconds)
- Dialogue must feel natural, not like a merge artifact

Return: ScriptBlend JSON object`,
      },
      {
        label: 'Genre/Tone Constraint Injector',
        model: 'gemini-2.0-flash',
        content: `// Injected dynamically based on user tag selection:

"Adhere strictly to the following creative constraints:
- Genre: {{genre}}           (e.g., 'comedy', 'adventure', 'drama')
- Tone: {{tone}}             (e.g., 'lighthearted', 'suspenseful', 'emotional')
- Target audience: {{audience}} (e.g., 'children 5-8', 'young adult', 'all ages')
- Format duration: {{duration}}s total

These constraints override any conflicting elements in either input script."`,
      },
    ],
    chainOfThought: [
      {
        id: 'sp-cb-c-1',
        title: 'User pastes two scripts + sets intensity',
        description: 'Inputs validated client-side: min 100 chars each, intensity 0–100',
        type: 'input',
      },
      {
        id: 'sp-cb-c-2',
        title: 'Blend prompt constructed',
        description: 'System prompt + Script A + Script B + intensity + genre/tone tags assembled',
        type: 'transform',
      },
      {
        id: 'sp-cb-c-3',
        title: 'Gemini generates structured blend',
        description: 'POST /api/scriptoplay/gemini with responseSchema enforcing ScriptBlend shape',
        type: 'llm',
      },
      {
        id: 'sp-cb-c-4',
        title: 'Zod validates response',
        description: 'Server validates JSON against ScriptBlend schema before returning to client',
        type: 'transform',
      },
      {
        id: 'sp-cb-c-5',
        title: 'Preview rendered in output pane',
        description: 'Blended scenes rendered as cards — user can edit individual scenes before saving',
        type: 'output',
      },
      {
        id: 'sp-cb-c-6',
        title: 'Save as new project',
        description: 'On confirm, a new project row is created in Supabase with blended script JSON',
        type: 'api',
      },
    ],
  },
};
