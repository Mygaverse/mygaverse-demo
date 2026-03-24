"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/bqool/context/AuthContext';

export function VersionTopBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [isV2, setIsV2] = useState(false);

    // Sync state with URL on mount and path change
    useEffect(() => {
        setIsV2(pathname?.startsWith('/bqool/v2') ?? false);
    }, [pathname]);

    // Access control: Admin, Manager, or User with Employee category
    const canAccessV2 =
        user?.role === 'admin' ||
        user?.role === 'manager' ||
        (user?.role === 'user' && user?.category === 'Employee');

    const handleToggle = (checked: boolean) => {
        if (!canAccessV2) return;
        setIsV2(checked);

        if (checked) {
            // Switch to V2
            // Special case: Home -> V2 Dashboard
            if (pathname === '/bqool') {
                router.push('/bqool/v2/dashboard');
            } else {
                // Replace /bqool prefix with /bqool/v2
                router.push(pathname?.replace('/bqool', '/bqool/v2') || '/bqool/v2/dashboard');
            }
        } else {
            // Switch to V1
            // Special case: V2 Dashboard -> Home
            if (pathname === '/bqool/v2/dashboard') {
                router.push('/bqool');
            } else {
                router.push(pathname?.replace('/bqool/v2', '/bqool') || '/bqool');
            }
        }
    };

    const disabledTooltip = 'Demo v2.0 is not available to access at the moment.';

    return (
        <div className="bg-[#34495e] h-[40px] px-5 flex items-center justify-between text-white text-xs fixed top-0 left-0 right-0 z-[1001]">
            <Link href="/bqool/getting-started" className="hover:underline text-white underline-offset-4">
                Getting Started with BQool University
            </Link>

            <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">Demo v2.0</span>

                {/* Toggle Switch */}
                <div
                    title={!canAccessV2 ? disabledTooltip : undefined}
                    className={!canAccessV2 ? 'opacity-40 cursor-not-allowed' : undefined}
                >
                    <label className={`relative inline-flex items-center ${canAccessV2 ? 'cursor-pointer' : 'cursor-not-allowed pointer-events-none'}`}>
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isV2}
                            onChange={(e) => handleToggle(e.target.checked)}
                            disabled={!canAccessV2}
                        />
                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4aaada]"></div>
                    </label>
                </div>
            </div>
        </div>
    );
}
