'use client';

import React from 'react';
import { AdminNavbar } from '@/components/bqool/im/AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans flex flex-col">
      {/* New Component replaces the huge code block */}
      <AdminNavbar />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}