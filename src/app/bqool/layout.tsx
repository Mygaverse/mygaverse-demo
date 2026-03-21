'use client';

import './globals.css';
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './context/AuthContext';
import { DebugToolbar } from '@/components/bqool/debug/DebugToolbar';

export default function BQoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider>
      <AuthProvider>
        <div className="font-sans bg-[#eff1f5] text-gray-900 overflow-x-hidden min-h-screen">
          {children}
          <DebugToolbar />
        </div>
      </AuthProvider>
    </MantineProvider>
  );
}
