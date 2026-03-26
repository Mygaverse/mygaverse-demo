'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/scriptoplay/supabase/client';
import { Session } from '@supabase/supabase-js'; // Removed unused User import
import { useRouter } from 'next/navigation';

interface UserProfile {
  uid: string; // Mapped from id for backward compatibility
  id: string; // Supabase native
  email?: string;
  display_name?: string | null;
  displayName?: string | null; // Compatibility
  photo_url?: string | null;
  photoURL?: string | null; // Compatibility
  studio_name?: string | null;
  studioName?: string | null; // Compatibility
  role?: string | null;
  accessStatus?: 'waitlist' | 'approved' | 'trainer' | 'admin'; // Compatibility camelCase
  access_status?: 'waitlist' | 'approved' | 'trainer' | 'admin'; // Supabase snake_case
  demo_used?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, d: { displayName: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
  signInWithGoogle: async () => { },
  signInWithEmail: async () => { },
  signUpWithEmail: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      // Always get auth user first as the baseline
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Try to fetch DB profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', JSON.stringify(error, null, 2));
      }

      const userData = data || {};

      const finalUser: UserProfile = {
        id: userId,
        uid: userId,
        email: authUser?.email,

        // Profile DB takes precedence, fallback to Auth Meta
        display_name: userData.display_name || authUser?.user_metadata?.full_name,
        displayName: userData.display_name || authUser?.user_metadata?.full_name,

        photo_url: userData.photo_url || authUser?.user_metadata?.avatar_url,
        photoURL: userData.photo_url || authUser?.user_metadata?.avatar_url,

        studio_name: userData.studio_name,
        studioName: userData.studio_name,
        role: userData.role,

        // IMPORTANT: if DB fetch fails, fallback to 'approved' so auth users can access the app
        // A missing profile row should not lock a valid auth user out
        access_status: userData.access_status || (authUser ? 'approved' : 'waitlist'),
        accessStatus: (userData.access_status || (authUser ? 'approved' : 'waitlist')) as any,
        demo_used: userData.demo_used ?? false,
      };

      setUser(finalUser);

    } catch (err) {
      console.error('fetchProfile critical error:', err);
      // Even on total failure, try to set a minimal user so auth users aren't locked out
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: userId,
            uid: userId,
            email: authUser.email,
            displayName: authUser.user_metadata?.full_name || null,
            display_name: authUser.user_metadata?.full_name || null,
            photoURL: authUser.user_metadata?.avatar_url || null,
            photo_url: authUser.user_metadata?.avatar_url || null,
            studio_name: null,
            studioName: null,
            role: null,
            access_status: 'approved',
            accessStatus: 'approved'
          });
        }
      } catch (fallbackErr) {
        console.error('Fallback user set failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/scriptoplay/auth/callback`,
      },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    // onAuthStateChange will fire automatically and call fetchProfile
  };

  const signUpWithEmail = async (email: string, password: string, data: { displayName: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: data.displayName
        }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/scriptoplay/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInWithGoogle, signInWithEmail, signUpWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
};
