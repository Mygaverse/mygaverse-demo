'use client';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function UserGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 1. If not logged in at all -> Kick out
      if (!user) {
        window.location.href = "/"; // Go to Login
        return;
      }

      // 2. CHECK PERMISSIONS
      const isAdmin = user.role === 'admin';
      const isApproved = user.status === 'approved';

      // 3. LOGIC: Allow if (Admin) OR (Approved User)
      if (isAdmin || isApproved) {
         // ACCESS GRANTED
         return; 
      } else {
         // ACCESS DENIED (Pending or Rejected users)
         alert("Your account is pending approval.");
         window.location.href = "/";
      }
    }
  }, [user, loading, router]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}