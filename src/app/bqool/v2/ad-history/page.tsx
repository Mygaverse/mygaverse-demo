'use client';

import { DashboardShell } from "@/components/bqool/layout/DashboardShell";
import { AdHistoryContent } from "@/components/bqool/ad-history/AdHistoryContent";

export default function V2AdHistoryPage() {
    return (
        <DashboardShell>
            <AdHistoryContent />
        </DashboardShell>
    );
}
