'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { DashboardContent } from '@/components/bqool/dashboard/DashboardContent';
import { UserGuard } from '@/components/bqool/auth/UserGuard';

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Use a strictly defined status to manage the view
  // 'checking': Initial state, shows spinner
  // 'authorized': User is verified, shows dashboard
  const [status, setStatus] = useState<'checking' | 'authorized'>('checking');

  useEffect(() => {
    // 1. If we are already authorized, stop running checks (prevents loops)
    if (status === 'authorized') return;

    // 2. Wait for Auth to initialize
    if (authLoading) return;

    // 3. If no user, the Global Guard should handle redirect, 
    // but we safety return here to avoid errors.
    if (!user) return;

    const verifyOnboarding = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.onboarded) {
            // ✅ Success: User is ready. Lock status to 'authorized'.
            setStatus('authorized');
          } else {
            // ❌ Not onboarded: Redirect to Wizard
            // Use 'replace' to avoid back-button history loops
            router.replace('/getting-started');
          }
        } else {
          // Edge case: No DB record yet -> Redirect to Wizard
          router.replace('/getting-started');
        }
      } catch (error) {
        console.error("Error verifying user:", error);
        // Optional: On error, you might want to show dashboard anyway 
        // to avoid locking them out during outages
        setStatus('authorized'); 
      }
    };

    verifyOnboarding();
  }, [user, authLoading, status, router]);

  // --- RENDER LOGIC ---

  // CRITICAL FIX: Only show loading if we are explicitly 'checking'.
  // Do NOT check 'authLoading' here. If we are 'authorized', we stay authorized
  // even if authLoading flickers in the background.
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    // WRAP EVERYTHING IN THE GUARD
    <UserGuard>
      <DashboardShell>
        <DashboardContent />
      </DashboardShell>
    </UserGuard>
  );
}