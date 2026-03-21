import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { DashboardContent } from '@/components/bqool/dashboard/DashboardContent';
import { UserGuard } from '@/components/bqool/auth/UserGuard';

export default function Page() {
  return (
    // 🔒 WRAP EVERYTHING IN THE GUARD
    //<UserGuard>
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
    //</UserGuard>
  );
}