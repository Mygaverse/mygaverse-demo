'use client';

import { DashboardShell } from "@/components/bqool/layout/DashboardShell";
import { BudgetManagerContent } from "@/components/bqool/budget-manager/BudgetManagerContent";

export default function V2BudgetManagerPage() {
    return (
        <DashboardShell>
            <BudgetManagerContent />
        </DashboardShell>
    );
}
