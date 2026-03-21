'use client';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';

export default function UsersManagementPage() {
  return (
    <DashboardShell>
      <div className="p-8 flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-300 mb-2">User Management</h1>
            <p>This module is currently under development.</p>
        </div>
      </div>
    </DashboardShell>
  );
}