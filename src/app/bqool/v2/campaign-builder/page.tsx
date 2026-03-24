'use client';

import { DashboardShell } from "@/components/bqool/layout/DashboardShell";
import { CampaignBuilderContent } from "@/components/bqool/campaign-buidler/CampaignBuilderContent";

export default function V2CampaignBuilderPage() {
    return (
        <DashboardShell>
            <CampaignBuilderContent />
        </DashboardShell>
    );
}
