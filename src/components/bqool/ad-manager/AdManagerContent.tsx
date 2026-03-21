"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, CameraVideo, ChevronRight } from "react-bootstrap-icons";
import { doc, getDoc } from "firebase/firestore"; // <--- Import Firestore methods
import { db } from "@/lib/bqool/firebase"; // <--- Import DB
import { useAuth } from "@/app/bqool/context/AuthContext"; // <--- Import Auth

// Import UI Components
import { Button } from "../ui/Button";
import { StoreSelector } from "../ui/StoreSelector";
import { SingleSelect } from "../ui/SingleSelect";
import { ScrollableTabs } from "../ui/ScrollableTabs";

// Import the specific tab components
import { UnifiedCampaignsTab } from "./tabs/UnifiedCampaignsTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { UnifiedAdGroupsTab } from "./tabs/UnifiedAdGroupsTab";
import { UnifiedProductAdsTab } from "./tabs/UnifiedProductAdsTab";
import { UnifiedTargetingTab } from "./tabs/UnifiedTargetingTab";
import { UnifiedSearchTermsTab } from "./tabs/UnifiedSearchTermsTab";

// --- Main Orchestrator Component ---
export function AdManagerContent() {
  const { user } = useAuth();

  // Default to empty or specific IDs. Ideally, StoreSelector initializes this.
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Campaigns"); 
  const [adType, setAdType] = useState("Sponsored Products");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [loadingConfig, setLoadingConfig] = useState(true);

  // --- 1. INITIALIZE WITH DEFAULT STORE ---
  useEffect(() => {
    const initDefaultStore = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.defaultStoreId) {
            // Set the default store immediately so tables aren't empty
            setSelectedStoreIds([data.defaultStoreId]);
          }
        }
      } catch (error) {
        console.error("Failed to load default store:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    initDefaultStore();
  }, [user]);
  
  // 2. Define Tab Configurations for each Ad Type
  const TABS_CONFIG = useMemo(() => ({
    "Sponsored Products": [
        { id: "Goals", label: "Goals" },
        { id: "Campaigns", label: "Campaigns" },
        { id: "Ad Groups", label: "Ad Groups" },
        { id: "Product Ads", label: "Product Ads" },
        { id: "Targeting", label: "Targeting" },
        { id: "Search Terms", label: "Search Terms" },
    ],
    "Sponsored Brands": [
        { id: "Campaigns", label: "Campaigns" },
        { id: "Ad Groups", label: "Ad Groups" }, 
        { id: "Product Ads", label: "Product Ads" },
        { id: "Targeting", label: "Targeting" }, 
        { id: "Search Terms", label: "Search Terms" },
    ],
    "Sponsored Display": [
        { id: "Campaigns", label: "Campaigns" },
        { id: "Ad Groups", label: "Ad Groups" },
        { id: "Product Ads", label: "Product Ads" }, 
        { id: "Targeting", label: "Targeting" }, 
    ]
  }), []);

  // 2. Get current tabs based on selection
  const currentTabs = TABS_CONFIG[adType as keyof typeof TABS_CONFIG] || TABS_CONFIG["Sponsored Products"];

  // 3. Reset Active Tab when Ad Type changes
  useEffect(() => {
      const tabExists = currentTabs.find(t => t.id === activeTab);
      if (!tabExists) setActiveTab("Campaigns");
  }, [adType, currentTabs, activeTab]);

  // 4. Render Content Helper - PASSING PROPS DOWN
  const commonProps = {
      adType,
      storeIds: selectedStoreIds,
      dateRange
  };

  const renderContent = () => {
    // If config is loading, show nothing or spinner to prevent "No Data" flash
    if (loadingConfig) return <div className="p-10 text-center text-gray-400">Loading Configuration...</div>;

    // If no store selected (and not loading), show empty state
    if (selectedStoreIds.length === 0) {
        return <div className="p-10 text-center text-gray-500 bg-white border border-gray-200 rounded-lg m-6">Please select a store to view data.</div>;
    }

    // --- SP CONTENT ---
    if (adType === "Sponsored Products") {
        switch (activeTab) {
            case "Goals": return <GoalsTab {...commonProps} />;
            case "Campaigns": return <UnifiedCampaignsTab {...commonProps} />;
            case "Ad Groups": return <UnifiedAdGroupsTab {...commonProps} />;
            case "Product Ads": return <UnifiedProductAdsTab {...commonProps} />;
            case "Targeting": return <UnifiedTargetingTab {...commonProps} />;
            case "Search Terms": return <UnifiedSearchTermsTab {...commonProps} />;
            default: return <UnifiedCampaignsTab {...commonProps} />;
        }
    }
    
    // --- SB CONTENT ---
    if (adType === "Sponsored Brands") {
        switch (activeTab) {
            case "Campaigns": return <UnifiedCampaignsTab {...commonProps} />;
            case "Ad Groups": return <UnifiedAdGroupsTab {...commonProps} />;
            case "Product Ads": return <UnifiedProductAdsTab {...commonProps} />;
            case "Targeting": return <UnifiedTargetingTab {...commonProps} />;
            case "Search Terms": return <UnifiedSearchTermsTab {...commonProps} />;
            default: return null;
        }
    }

    // --- SD CONTENT ---
    if (adType === "Sponsored Display") {
        switch (activeTab) {
            case "Campaigns": return <UnifiedCampaignsTab {...commonProps} />;
            case "Ad Groups": return <UnifiedAdGroupsTab {...commonProps} />;
            case "Product Ads": return <UnifiedProductAdsTab {...commonProps} />;
            case "Targeting": return <UnifiedTargetingTab {...commonProps} />;
            default: return null;
        }
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto pb-[60px]">

      {/* Top Section */}
      <div className="p-6 pb-4 flex flex-col gap-4 bg-[#f8f9fa]">
      
        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <Breadcrumb adType={adType} activeTab={activeTab} />
          <Button variant="branding" size="sm" icon={<CameraVideo size={16} />}>Learn</Button>
        </div>

        {/* 2. Global Controls */}
        <div className="flex items-center h-[48px] gap-4 z-60 relative">
          <div className="flex items-center rounded-md shadow-sm border-0 border-[#e2e2e2] bg-white h-full shrink-0 z-60 relative">
            <div className="h-full border-0 border-[#e2e2e2]">
              <StoreSelector 
                  mode="multiple" 
                  selectedStoreIds={selectedStoreIds} 
                  onSelect={setSelectedStoreIds} 
              />
            </div>
            <SingleSelect 
                label="Ad Type" 
                value={adType} 
                onChange={setAdType} 
                options={['Sponsored Products', 'Sponsored Brands', 'Sponsored Display']} 
                width="w-[180px]" 
              />
            <SingleSelect 
                label="Date" 
                value={dateRange} 
                onChange={setDateRange} 
                options={['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 60 days']} 
                width="w-[160px]" 
                className="border-r-0" 
            />
            <button className="h-full w-[48px] bg-[#4aaada] flex rounded-r-lg items-center justify-center hover:bg-[#3a9aca] transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Scrollable Tabs */}
          <ScrollableTabs 
              tabs={currentTabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
          />
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-6 pt-4">
          {renderContent()}
      </div>
    </div>
  );
}

function Breadcrumb({ adType, activeTab }: { adType: string, activeTab: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <span className="text-gray-900 font-medium text-lg">Advertising</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="font-medium">Ad Manager</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="text-[#0066b7] font-medium">{adType}</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="text-gray-500 truncate max-w-[300px]">
        {activeTab}
      </span>
    </div>
  );
}