import type { SceneData } from '@/types/dev-console';

export const globalScene: SceneData = {
  id: 'global',
  title: 'Mygaverse Demo',
  subtitle: 'Architecture Overview',
  product: 'global',

  design: {
    uxAuditPoints: [
      {
        id: 'g-ux-1',
        title: 'Split-Product Navigation',
        description:
          'BQool and Scriptoplay share a root domain but operate as isolated namespaces (/bqool/* and /scriptoplay/*), preventing auth and state conflicts between two completely different tech stacks.',
        category: 'layout',
        impact: 'high',
      },
      {
        id: 'g-ux-2',
        title: 'Dev Console Overlay Pattern',
        description:
          'The console sits as a fixed overlay rather than shifting page content, ensuring the demo apps render at their intended viewport widths.',
        category: 'interaction',
        impact: 'medium',
      },
    ],
    designDecisions: [
      {
        title: 'Monorepo-style demo host',
        rationale:
          'One Next.js app hosts both BQool and Scriptoplay. This lets recruiters switch products without a page reload or domain change, and lets the Dev Console persist its state across both.',
      },
      {
        title: 'Route-aware scene mapping',
        rationale:
          'Instead of instrumenting every component, the console reads the pathname and swaps in pre-authored commentary. Low implementation overhead, high perceived intelligence.',
      },
    ],
  },

  engineering: {
    architectureNote:
      'Two independent SaaS apps coexist in one Next.js 16 App Router project via directory-based namespacing.',
    techStack: [
      { name: 'Next.js 16', category: 'framework' },
      { name: 'React 19', category: 'framework' },
      { name: 'Tailwind CSS 4', category: 'ui' },
      { name: 'Framer Motion', category: 'ui' },
      { name: 'Zustand 5', category: 'framework' },
      { name: 'Firebase 12', category: 'database' },
      { name: 'Supabase SSR', category: 'database' },
      { name: 'Mantine 8', category: 'ui' },
      { name: 'Vercel', category: 'infra' },
      { name: 'fal.ai', category: 'ai' },
      { name: 'Google Gemini', category: 'ai' },
      { name: 'Replicate', category: 'ai' },
    ],
    snippets: [
      {
        label: 'Route Namespace Isolation',
        language: 'typescript',
        layer: 'backend',
        code: `// src/proxy.ts — Next.js 16 auth middleware
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Scriptoplay: Supabase SSR auth
  if (path.startsWith('/scriptoplay')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: supabaseCookieAdapter(request) }
    );
    const { data } = await supabase.auth.getUser();
    if (path.startsWith('/scriptoplay/dashboard') && !data.user) {
      return NextResponse.redirect('/scriptoplay/login');
    }
  }

  // BQool: Firebase client-side auth (no server check needed)
  return NextResponse.next();
}`,
      },
    ],
  },

  intelligence: {
    note: 'Navigate into a product to see live AI prompts and chain-of-thought for that feature.',
    systemPrompts: [],
    chainOfThought: [
      {
        id: 'g-c-1',
        title: 'User lands on demo',
        description: 'Route detected → Dev Console loads matching scene data',
        type: 'input',
      },
      {
        id: 'g-c-2',
        title: 'Scene registry lookup',
        description: 'Pathname matched against registry; nearest parent matched if exact not found',
        type: 'transform',
      },
      {
        id: 'g-c-3',
        title: 'Console renders commentary',
        description: 'Design, Engineering, and Intelligence panels populate with scene-specific content',
        type: 'output',
      },
    ],
  },
};
