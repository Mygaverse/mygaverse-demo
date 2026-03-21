import { Topbar } from "@/components/bqool/layout/Topbar";
import { Sidebar } from "@/components/bqool/layout/Sidebar";
import { AdManagerContent } from "@/components/bqool/ad-manager/AdManagerContent";

export default function AdManagerPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Topbar />

      <Sidebar />

      {/* 3. Main Content Wrapper 
          - pt-[60px]: Pushes content down below the Topbar
          - pl-[56px]: Pushes content right of the Sidebar
          - h-screen: Ensures full height
          - overflow-auto: Lets the main content scroll independently of the sidebar/header
      */}
      <main className="pt-[60px] pl-[56px] h-screen overflow-auto">
         <AdManagerContent />
      </main>
    </div>
  );
}