'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/bqool/firebase';

export default function BQoolLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in and approved, go straight to dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.status === 'approved' || data.role === 'admin') {
              router.replace('/bqool');
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.status === 'approved' || data.role === 'admin') {
          router.replace('/bqool');
        } else {
          setError('Access denied. Your account is not approved.');
          await auth.signOut();
        }
      } else {
        setError('No account record found. Please contact support.');
        await auth.signOut();
      }
    } catch (err: any) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f6fc] flex items-center justify-center p-4">
      <div className="container max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* Left: Branding */}
          <div className="flex-1 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#4aaada] flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">BQool</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
              Amazon Advertising<br />Dashboard
            </h1>
            <p className="text-gray-500 text-lg mb-8">
              AI-driven campaign management, repricing intelligence, and real-time performance analytics.
            </p>
            <div className="flex gap-4 text-xs font-bold tracking-widest text-[#4aaada] uppercase">
              <span>Advertising</span>
              <span>·</span>
              <span>Repricing</span>
              <span>·</span>
              <span>Analytics</span>
            </div>
          </div>

          {/* Right: Login card */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white p-10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-sm text-gray-500 mb-8">Sign in to access the demo dashboard</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Demo credentials hint */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <span className="font-semibold">Demo credentials:</span><br />
                Email: <span className="font-mono">demo@bqool.com</span><br />
                Password: your configured demo password
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4aaada] focus:border-transparent transition-all"
                    placeholder="demo@bqool.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4aaada] focus:border-transparent transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#4aaada] hover:bg-[#3a9ac9] text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
