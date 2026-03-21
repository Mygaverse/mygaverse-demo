"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, CameraVideo, ChevronRight } from "react-bootstrap-icons";
import { Button } from "../ui/Button";
import { StoreSelector } from "../ui/StoreSelector";
import { SingleSelect } from "../ui/SingleSelect";
import { ScrollableTabs } from "../ui/ScrollableTabs";



// Import the specific tab component
import { UnifiedCampaignsTab } from "./tabs/UnifiedCampaignsTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { UnifiedAdGroupsTab } from "./tabs/UnifiedAdGroupsTab";
import { UnifiedProductAdsTab } from "./tabs/UnifiedProductAdsTab";
import { UnifiedTargetingTab } from "./tabs/UnifiedTargetingTab";
import { UnifiedSearchTermsTab } from "./tabs/UnifiedSearchTermsTab";



// --- Main Orchestrator Component ---
export function AdManagerContent() {
  const [selectedStoreIds, setSelectedStoreIds] = useState(['1', '2']);
  const [activeTab, setActiveTab] = useState("Campaigns"); // Default start tab
  const [adType, setAdType] = useState("Sponsored Products");
  const [dateRange, setDateRange] = useState("Last 30 days");
  
  // 1. Define Tab Configurations for each Ad Type
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
      // If the currently active tab doesn't exist in the new Ad Type (e.g., switching SP -> SB while on "Goals"), reset to Campaigns
      const tabExists = currentTabs.find(t => t.id === activeTab);
      if (!tabExists) {
          setActiveTab("Campaigns");
      }
  }, [adType, currentTabs, activeTab]);

  // 4. Render Content Helper
  const renderContent = () => {
    // --- SP CONTENT ---
    if (adType === "Sponsored Products") {
        switch (activeTab) {
            case "Goals": return <GoalsTab />;
            case "Campaigns": return <UnifiedCampaignsTab adType={adType}/>;
            case "Ad Groups": return <UnifiedAdGroupsTab adType={adType}/>;
            case "Product Ads": return <UnifiedProductAdsTab adType={adType} />;
            case "Targeting": return <UnifiedTargetingTab adType={adType} />;
            case "Search Terms": return <UnifiedSearchTermsTab adType={adType} />;
            default: return <UnifiedCampaignsTab adType={adType}/>;
        }
    }
    
    // --- SB CONTENT ---
    if (adType === "Sponsored Brands") {
        switch (activeTab) {
            case "Campaigns": return <UnifiedCampaignsTab adType={adType}/>;
            case "Ad Groups": return <UnifiedAdGroupsTab adType={adType}/>;
            case "Product Ads": return <UnifiedProductAdsTab adType={adType} />;
            case "Targeting": return <UnifiedTargetingTab adType={adType} />;
            case "Search Terms": return <UnifiedSearchTermsTab adType={adType} />;
            default: return null;
        }
    }

    // --- SD CONTENT ---
    if (adType === "Sponsored Display") {
        switch (activeTab) {
            case "Campaigns": return <UnifiedCampaignsTab adType={adType}/>;
            case "Ad Groups": return <UnifiedAdGroupsTab adType={adType}/>;
            case "Product Ads": return <UnifiedProductAdsTab adType={adType} />;
            case "Targeting": return <UnifiedTargetingTab adType={adType} />;
            default: return null;
        }
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto pb-[60px]">

      {/* Top Section */}
      <div className="p-6 pb-4 flex flex-col gap-4 bg-[#f8f9fa]">
      
        {/* 1. Header (Breadcrumbs + Learn) */}
        <div className="flex items-center justify-between">
          <Breadcrumb adType={adType} activeTab={activeTab} />
          <Button variant="branding" size="sm" icon={<CameraVideo size={16} />}>Learn</Button>
        </div>

        {/* 2. Global Controls (Store, Ad Type, Tabs) */}
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
            <SingleSelect label="Date" value={dateRange} onChange={setDateRange} options={['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 60 days', 'Last 90 days', 'Date Range']} width="w-[160px]" className="border-r-0" />
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