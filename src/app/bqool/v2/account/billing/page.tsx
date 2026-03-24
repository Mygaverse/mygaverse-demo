'use client';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { BillingContent } from '@/components/bqool/account/BillingContent';

export default function V2BillingPage() {
    return (
        <DashboardShell>
            <div className="p-6 w-full">
                <BillingContent />
            </div>
        </DashboardShell>
    );
}
