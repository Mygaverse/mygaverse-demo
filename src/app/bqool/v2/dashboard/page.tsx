'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { V2DashboardContent } from '@/components/bqool/dashboard/V2DashboardContent';
import { UserGuard } from '@/components/bqool/auth/UserGuard';

export default function V2DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<'checking' | 'authorized'>('checking');

    useEffect(() => {
        if (status === 'authorized') return;
        if (authLoading) return;
        if (!user) return;

        // Simplified check for V2 demo purposes since it's a copy
        // We can assume valid user for now or reuse same logic
        const verifyOnboarding = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().onboarded) {
                    setStatus('authorized');
                } else {
                    // If not onboarded, V2 might redirect back to generic onboarding or have its own
                    // For now, redirect to main getting-started
                    router.replace('/bqool/getting-started');
                }
            } catch (error) {
                console.error("Error verifying user:", error);
                setStatus('authorized');
            }
        };

        verifyOnboarding();
    }, [user, authLoading, status, router]);

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500">Loading Demo V2...</p>
                </div>
            </div>
        );
    }

    return (
        <UserGuard>
            <DashboardShell>
                {/* V2 Specific Content Wrapper could go here */}
                <div className="relative">
                    {/* Optional V2 Badge or Overlay to distinguish */}
                    <V2DashboardContent />
                </div>
            </DashboardShell>
        </UserGuard>
    );
}
