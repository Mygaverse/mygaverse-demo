import type { SceneData } from '@/types/dev-console';

export const bqoolDashboardScene: SceneData = {
  id: 'bqool-dashboard',
  title: 'BQool',
  subtitle: 'Seller Dashboard',
  product: 'bqool',

  design: {
    figmaFrame: {
      embedUrl: '',
      title: 'BQool Dashboard — Data Density Design',
    },
    uxAuditPoints: [
      {
        id: 'bq-d-1',
        title: '4-column data grid optimizes density',
        description:
          'Amazon sellers manage hundreds of SKUs simultaneously. A 4-column layout at 1440px matches the information density of the native Seller Central interface, reducing re-learning cost.',
        category: 'layout',
        impact: 'high',
      },
      {
        id: 'bq-d-2',
        title: 'KPI cards above the table',
        description:
          'Revenue, ACoS, and Total Orders surface as large cards before the detail table. Sellers can assess health at a glance and drill into the table only when needed.',
        category: 'layout',
        impact: 'high',
      },
      {
        id: 'bq-d-3',
        title: 'Inline table editing reduces round-trips',
        description:
          'Bid changes are editable directly in the table row. Clicking away auto-saves. This matches the spreadsheet mental model Amazon sellers already use daily.',
        category: 'interaction',
        impact: 'high',
      },
      {
        id: 'bq-d-4',
        title: 'Color-coded ACoS thresholds',
        description:
          'ACoS values are colored green (<20%), yellow (20–35%), red (>35%). Sellers trained on margin targets identify problem campaigns without reading numbers.',
        category: 'visual',
        impact: 'medium',
      },
    ],
    designDecisions: [
      {
        title: 'Mantine UI for data-heavy components',
        rationale:
          'Mantine ships production-quality DataTable, DatePicker, and Select components. Building custom equivalents for a data-dense B2B app would take weeks — Mantine gets us to 90% quality in days.',
      },
      {
        title: 'Light background vs. Scriptoplay\'s dark theme',
        rationale:
          'B2B analytics tools (Tableau, Power BI, Google Analytics) use light themes. BQool users switch between our app and Seller Central — a light theme reduces context shock.',
      },
    ],
  },

  engineering: {
    techStack: [
      { name: 'Mantine 8', category: 'ui' },
      { name: 'Firebase Firestore', category: 'database' },
      { name: 'Firebase Auth', category: 'database' },
      { name: 'React 19', category: 'framework' },
      { name: 'Next.js App Router', category: 'framework' },
    ],
    architectureNote:
      'BQool uses Firebase for auth and Firestore for real-time campaign data. Completely isolated from Scriptoplay\'s Supabase stack — no shared auth context.',
    snippets: [
      {
        label: 'Firebase Auth Context (BQool)',
        language: 'typescript',
        layer: 'frontend',
        code: `// Separate AuthContext from Scriptoplay — Firebase instead of Supabase
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}`,
      },
      {
        label: 'Campaign Data Hook',
        language: 'typescript',
        layer: 'frontend',
        code: `// Real-time Firestore listener for campaign metrics
function useCampaigns(accountId: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!accountId) return;
    const q = query(
      collection(db, 'campaigns'),
      where('accountId', '==', accountId),
      orderBy('spend', 'desc'),
      limit(100),
    );
    return onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [accountId]);

  return campaigns;
}`,
      },
    ],
  },

  intelligence: {
    note: 'BQool\'s AI layer handles bid optimization and anomaly detection. Navigate to the Bid Manager or AI Pilot to see the Intelligence panel activate.',
    systemPrompts: [],
    chainOfThought: [
      {
        id: 'bq-d-c-1',
        title: 'Seller logs in via Firebase',
        description: 'Google OAuth or email/password — Firebase handles token refresh automatically',
        type: 'input',
      },
      {
        id: 'bq-d-c-2',
        title: 'Firestore real-time listener activated',
        description: 'onSnapshot query streams campaign data — dashboard updates without polling',
        type: 'api',
      },
      {
        id: 'bq-d-c-3',
        title: 'Mantine DataTable renders metrics',
        description: 'ACoS, spend, and bid data formatted and color-coded client-side',
        type: 'output',
      },
    ],
  },
};
