import DashboardShell from '@/components/scriptoplay/dashboard/layout/DashboardShell';
import RouteGuard from '@/components/scriptoplay/auth/RouteGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We pass children through the client shell
    <RouteGuard>
      <DashboardShell>
        {children}
      </DashboardShell>
    </RouteGuard>
  );
}