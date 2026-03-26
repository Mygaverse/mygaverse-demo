'use client';

import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingScreen from '@/components/scriptoplay/ui/LoadingScreen';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname.startsWith('/scriptoplay/dashboard') && !pathname.startsWith('/scriptoplay/dashboard/migration')) {
        router.push('/scriptoplay/login');
      }
      return;
    }

    if (user.accessStatus === 'waitlist') {
      if (pathname.startsWith('/scriptoplay/dashboard') && !pathname.startsWith('/scriptoplay/dashboard/migration')) {
        router.push('/scriptoplay/waitlist-pending');
      }
      return;
    }

    if ((user.accessStatus === 'approved' || user.accessStatus === 'admin') && pathname === '/scriptoplay/waitlist-pending') {
      router.push('/scriptoplay/dashboard');
    }

  }, [user, loading, router, pathname]);

  if (loading) {
    return <LoadingScreen message="Verifying Access..." />;
  }

  if (!user && pathname.startsWith('/scriptoplay/dashboard') && !pathname.startsWith('/scriptoplay/dashboard/migration')) {
    return null;
  }

  if (user?.accessStatus === 'waitlist' && pathname.startsWith('/scriptoplay/dashboard') && !pathname.startsWith('/scriptoplay/dashboard/migration')) {
    return null;
  }

  return <>{children}</>;
}
