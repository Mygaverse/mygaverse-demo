'use client';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 1. Not logged in -> Kick to Login
      if (!user) {
        // Since IM is inside Demo, we can send them to the main login
        window.location.href = "/bqool/login"; 
        return;
      }

      // 2. Logged in but NOT Admin -> Kick to User Dashboard
      if (user.role !== 'admin') {
        alert("Access Denied: Admins Only");
        router.push('/bqool'); // Send them back to safety
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) return <div className="h-screen flex items-center justify-center">Checking Admin Privileges...</div>;
  
  // If not admin, return null while the useEffect redirects them
  if (!user || user.role !== 'admin') return null;

  return <>{children}</>;
}