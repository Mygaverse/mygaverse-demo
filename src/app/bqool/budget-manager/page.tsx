import { DashboardShell } from "@/components/bqool/layout/DashboardShell";
import { BudgetManagerContent } from "@/components/bqool/budget-manager/BudgetManagerContent";

export default function BudgetManagerPage() {
  return (
    <DashboardShell>
      <BudgetManagerContent />
    </DashboardShell>
  );
}