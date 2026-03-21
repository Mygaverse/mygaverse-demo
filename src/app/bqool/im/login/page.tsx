'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/bqool/firebase'; // Adjust path to your firebase config
import { Button } from '@/components/bqool/ui/Button';



export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ADD THIS DEV BYPASS ---
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log("⚡ Dev Mode: Attempting Auto-Login...");
      
      // Use the credentials of a user that EXISTS in your Emulator
      const DEV_EMAIL = "admin@bqool.com";
      const DEV_PASS = "password"; // Use whatever password you set in emulator

      signInWithEmailAndPassword(auth, DEV_EMAIL, DEV_PASS)
        .then(() => {
          console.log("⚡ Auto-Login Success");
          router.push('/bqool/im');
        })
        .catch((err) => {
          console.warn("⚡ Auto-Login Failed (User might not exist in Emulator):", err.message);
        });
    }
  }, [router]);

  // 1. Redirect if already logged in as Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            router.push('/bqool/im'); // Redirect to Admin Dashboard
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // A. Sign In
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // B. Check Admin Role
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        router.push('/bqool/im'); // Success
      } else {
        setError("Access Denied: You are not an administrator.");
        await auth.signOut(); // Kick them out immediately
      }
    } catch (err: any) {
      console.error(err);
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f6fc] flex items-center justify-center p-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-10">
          
          {/* LEFT PANEL: Branding */}
          <div className="flex-1 p-8">
            <h1 className="text-5xl font-bold text-[#1a1a1a] mb-2">IM for Demo</h1>
            <p className="text-xl text-gray-500 font-bold mb-8">
              Intelligent AI driving faster growth and lasting success.
            </p>
            <div className="flex gap-4 text-[#4facfe] font-bold tracking-wide">
              <span>ADVERTISING</span>
              <span>REPRICING</span>
              <span>BIGCENTRAL</span>
            </div>
          </div>

          {/* RIGHT PANEL: Login Card */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white p-10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h3 className="text-center text-2xl font-semibold mb-6 text-gray-800">Welcome back!</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4facfe] focus:border-transparent transition-all"
                    placeholder="admin@bqool.com"
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4facfe] focus:border-transparent transition-all"
                    placeholder="Enter password"
                    required 
                  />
                </div>

                <div className="flex items-center mb-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 text-[#4facfe] border-gray-300 rounded focus:ring-[#4facfe]" />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me</label>
                </div>

                <Button 
                    type="submit"
                    variant='primary' 
                    className="w-full py-2.5 text-base font-semibold bg-[#4facfe] hover:bg-[#00f2fe] border-0 text-white shadow-md transition-colors"
                    disabled={loading}
                >
                  {loading ? 'Signing In...' : 'LOGIN'}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}