import type { SceneData } from '@/types/dev-console';

export const scriptoplayDashboardScene: SceneData = {
  id: 'scriptoplay-dashboard',
  title: 'Scriptoplay',
  subtitle: 'Creator Dashboard',
  product: 'scriptoplay',

  design: {
    figmaFrame: {
      embedUrl: '',
      title: 'Dashboard — Scriptoplay Design System',
    },
    uxAuditPoints: [
      {
        id: 'sp-d-1',
        title: 'Hero CTA above the fold',
        description:
          '"Create Your First Project" sits in the hero zone with a supporting visual (characters image). First-time users see a clear action without scrolling.',
        category: 'interaction',
        impact: 'high',
      },
      {
        id: 'sp-d-2',
        title: 'Progressive project listing',
        description:
          'Project cards show the most recent first with status badges (Draft / In Progress / Complete). Users re-orient instantly after returning to the dashboard.',
        category: 'layout',
        impact: 'medium',
      },
      {
        id: 'sp-d-3',
        title: 'Sidebar as wayfinding, not nav',
        description:
          'The sidebar remains collapsed to icons at mobile widths and expands on hover at desktop. Labels appear on hover to keep the focus on the canvas, not chrome.',
        category: 'visual',
        impact: 'medium',
      },
      {
        id: 'sp-d-4',
        title: 'Access-status gating',
        description:
          'Waitlisted users land on a separate pending screen — they never see a broken dashboard. Approved users land directly on the project list.',
        category: 'interaction',
        impact: 'high',
      },
    ],
    designDecisions: [
      {
        title: 'Dark theme for creative tools',
        rationale:
          'Dark backgrounds reduce eye strain during long creative sessions and make image/video previews pop — a convention established by Premiere Pro, DaVinci Resolve, and Figma.',
      },
      {
        title: 'Card-based project grid',
        rationale:
          'Thumbnail cards give creators a visual reference without opening each project. The grid respects different aspect ratios by using object-cover cropping.',
      },
    ],
  },

  engineering: {
    techStack: [
      { name: 'Next.js App Router', category: 'framework' },
      { name: 'Supabase', category: 'database' },
      { name: 'Tailwind CSS 4', category: 'ui' },
      { name: 'Framer Motion', category: 'ui' },
      { name: 'Lucide React', category: 'ui' },
    ],
    snippets: [
      {
        label: 'RouteGuard — Client Auth Protection',
        language: 'typescript',
        layer: 'frontend',
        githubUrl:
          'https://github.com/mygaverse/mygaverse-demo/blob/main/src/components/scriptoplay/auth/RouteGuard.tsx',
        code: `// Wraps all /scriptoplay/dashboard/* pages
export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, loading, accessStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/scriptoplay/login');
      return;
    }
    if (accessStatus === 'waitlist') {
      router.replace('/scriptoplay/waitlist-pending');
    }
  }, [user, loading, accessStatus, router]);

  if (loading || !user) return <LoadingScreen />;
  return <>{children}</>;
}`,
      },
      {
        label: 'Supabase Auth Context',
        language: 'typescript',
        layer: 'frontend',
        code: `// Provides user, accessStatus, signIn, signOut app-wide
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null);
        if (session?.user) await fetchUserData(session.user.id);
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  // accessStatus drives RouteGuard behavior
  const accessStatus = userData?.access_status ?? (authUser ? 'approved' : 'waitlist');
  return (
    <AuthContext.Provider value={{ user: authUser, userData, accessStatus, ... }}>
      {children}
    </AuthContext.Provider>
  );
}`,
      },
    ],
  },

  intelligence: {
    note: 'The dashboard itself is data-driven, not AI-generated. AI activates inside the Workspace and Cartoon Blender tools.',
    systemPrompts: [],
    chainOfThought: [
      {
        id: 'sp-dash-c-1',
        title: 'User authenticates',
        description: 'Supabase cookie-based session validated by proxy.ts on every request',
        type: 'input',
      },
      {
        id: 'sp-dash-c-2',
        title: 'Profile fetched',
        description: 'access_status read from profiles table — drives RouteGuard decision',
        type: 'api',
      },
      {
        id: 'sp-dash-c-3',
        title: 'Dashboard rendered',
        description: 'Project list loaded from Supabase with RLS ensuring users only see their own data',
        type: 'output',
      },
    ],
  },
};
