'use client';

import { DashboardShell } from "@/components/bqool/layout/DashboardShell";
import { AdManagerContent } from "@/components/bqool/ad-manager/AdManagerContent";

export default function V2AdManagerPage() {
    return (
        <DashboardShell>
            <AdManagerContent />
        </DashboardShell>
    );
}
