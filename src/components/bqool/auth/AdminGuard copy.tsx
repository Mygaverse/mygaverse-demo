'use client';

/* TEMPORARY BYPASS VERSION
export function AdminGuard({ children }: { children: React.ReactNode }) {
  // We simply return the children immediately, allowing access to everyone.
  // Later, we will uncomment the logic to restore security.
  return <>{children}</>;
}
  */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase'; // Ensure this points to your firebase config

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Debug Logs
    console.log("🛡️ AdminGuard: State Change", { authLoading, user });

    // If AuthContext is still loading, DO NOTHING (Wait)
    if (authLoading) return;

    // If Auth finished but no user -> Redirect
    if (!user) {
        router.push('/im/login');
        return;
    }

    // User exists -> Check DB
    const checkRole = async () => {
      console.log("🛡️ AdminGuard: Checking Firestore for role...");
      try {
        const docRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(docRef);

        console.log("🛡️ AdminGuard: Firestore Result", userDoc.exists(), userDoc.data());

        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          console.log("🛡️ AdminGuard: Success! User is admin.");
          setIsAdmin(true);
        } else {
          console.warn("🛡️ AdminGuard: Access Denied. Not an admin.");
          alert("Access Denied: Admins Only");
          router.push('/');
        }
      } catch (err: any) {
        console.error("🔥 AdminGuard Error:", err.code, err.message);
        // If permission denied, it usually means the Rule rejected the read
        if (err.code === 'permission-denied') {
            alert("Database Permission Denied. Check your Firestore Rules or User Role.");
        }
    } finally {
        setCheckingRole(false);
      }
    };

    checkRole();
  }, [user, authLoading, router]);

  if (authLoading || checkingRole) 
    return (
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900">
            </div>
          </div>
      );

  return isAdmin ? <>{children}</> : null;
}

