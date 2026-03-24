'use client';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function IMAccessGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // 1. Not logged in -> Kick to Login
            if (!user) {
                window.location.href = "/";
                return;
            }

            // 2. Check Permissions
            // Allow access if:
            // - Role is Admin OR
            // - Category is Employee
            const isAdmin = user.role === 'admin';
            const isEmployee = user.category === 'Employee';

            if (!isAdmin && !isEmployee) {
                alert("Access Denied: Employees Only");
                router.push('/bqool/demo'); // Kick out non-employees
                return;
            }
        }
    }, [user, loading, router]);

    if (loading) return <div className="h-screen flex items-center justify-center">Checking Access Privileges...</div>;

    // Render nothing while redirecting
    if (!user || (user.role !== 'admin' && user.category !== 'Employee')) return null;

    return <>{children}</>;
}
