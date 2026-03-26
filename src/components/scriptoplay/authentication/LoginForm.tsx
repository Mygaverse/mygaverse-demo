'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 1. New Icon Logic Imports
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';

interface LoginFormProps {
  //onSwitchToWaitlist: () => void;
  onSwitchToSignup: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function LoginForm({ onSwitchToSignup, isLoading, setLoading }: LoginFormProps) {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // State for handling error messages in the UI
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/scriptoplay/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await signInWithEmail(formData.email, formData.password);
      // Do NOT manually push to /dashboard here.
      // onAuthStateChange in AuthContext will fire → fetchProfile → setUser
      // The useEffect above will then redirect once user is set.
    } catch (error: any) {
      let msg = "Login failed. Please try again.";

      // Map Error codes
      if (error.message === 'Invalid login credentials') {
        msg = "Incorrect email or password.";
      } else if (error.message) {
        msg = error.message;
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-8 duration-500 w-full">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2 text-white">Sign in</h1>
        <p className="text-zinc-400 text-lg">Welcome back to Scriptoplay!</p>
      </div>

      {/* Social Login Section */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 py-3 rounded-lg transition-all text-sm font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.98h5.24c-.22 1.18-.88 2.18-1.87 2.85v2.36h3.03c1.77-1.63 2.8-4.02 2.8-6.73 0-.67-.06-1.33-.16-1.97z" /><path fill="currentColor" d="M12.18 21c2.56 0 4.71-.85 6.29-2.31l-3.03-2.36c-.85.57-1.94.91-3.26.91-2.48 0-4.58-1.68-5.33-3.93h-3.13v2.43c1.55 3.08 4.73 5.19 8.27 5.19z" /><path fill="currentColor" d="M6.85 13.31c-.19-.57-.3-1.18-.3-1.81s.11-1.24.3-1.81V7.26H3.72C3.08 8.54 2.72 9.98 2.72 11.5s.36 2.96 1 4.24l3.13-2.43z" /><path fill="currentColor" d="M12.18 5.48c1.39 0 2.64.48 3.63 1.42l2.72-2.72C16.89 2.61 14.74 1.73 12.18 1.73 8.64 1.73 5.46 3.84 3.91 6.92l3.13 2.43c.75-2.25 2.85-3.93 5.33-3.93z" /></svg>
          <span className="hidden sm:inline">Login with </span> Google
        </button>
        <button type="button" className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 py-3 rounded-lg transition-all text-sm font-medium opacity-50 cursor-not-allowed" disabled>
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.048 0-2.606.492-2.606 1.691v2.28h3.907l-.543 3.667h-3.364v7.98h-5.208Z" /></svg>
          <span className="hidden sm:inline">Login with </span> Facebook
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
        <div className="relative flex justify-center text-sm"><span className="px-4 bg-black text-zinc-500">or</span></div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="text-zinc-400 text-sm block">Email Address</label>
          <input
            type="email"
            required
            className="w-full bg-zinc-900/50 border border-zinc-700 focus:border-fuchsia-600 focus:ring-1 focus:ring-fuchsia-600 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-all"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              setErrorMessage(null); // Clear error when user types
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-zinc-400 text-sm block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full bg-zinc-900/50 border border-zinc-700 focus:border-fuchsia-600 focus:ring-1 focus:ring-fuchsia-600 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-all pr-10"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setErrorMessage(null); // Clear error when user types
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <Icon icon={ICONS.eye} size={18} /> : <Icon icon={ICONS.eyeOff} size={18} />}
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {errorMessage && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-in slide-in-from-top-2">
            <Icon icon={ICONS.info} size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
            <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-fuchsia-600 focus:ring-offset-black focus:ring-fuchsia-600 accent-fuchsia-600" />
            Remember me
          </label>
          <Link href="#" className="text-fuchsia-300 hover:text-fuchsia-400 transition-colors">Forgot Password?</Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer disabled:cursor-not-allowed w-full bg-gradient-to-r from-fuchsia-500 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-semibold py-3.5 rounded-full transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? <Icon icon={ICONS.spinner} className="animate-spin w-5 h-5" /> : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-sm">
        Don't have account yet?{' '}
        <button onClick={onSwitchToSignup} className="cursor-pointer text-fuchsia-300 hover:text-fuchsia-400 font-medium underline-offset-4 hover:underline transition-colors">
          Sign up
        </button>
      </p>
    </div>
  );
}