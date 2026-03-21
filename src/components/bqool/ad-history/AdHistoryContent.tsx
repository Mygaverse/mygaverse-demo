'use client';

import React, { useState, useEffect } from 'react';
import { CameraVideo, ChevronRight, Search } from "react-bootstrap-icons";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

// UI components
import { Button } from "../ui/Button";
import { ScrollableTabs } from "../ui/ScrollableTabs";
import { StoreSelector } from "../ui/StoreSelector";
import { SingleSelect } from "../ui/SingleSelect";

import { BiddingHistoryTab } from "./tabs/BiddingHistoryTab";
import { HarvestingHistoryTab } from "./tabs/HarvestingHistoryTab";
import { BudgetingHistoryTab } from "./tabs/BudgetingHistoryTab";

export function AdHistoryContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Bidding History');

  // State for Filters
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [adType, setAdType] = useState('All');

  // --- Load Default Store on Mount ---
  useEffect(() => {
    const initDefaultStore = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Check if defaultStoreId exists and set it
            if (data.defaultStoreId) {
                setSelectedStoreIds([data.defaultStoreId]);
            }
        }
      } catch (error) { 
          console.error("Error loading default store:", error); 
      }
    };
    
    initDefaultStore();
  }, [user]);
  
  const tabs = [
    { id: 'Bidding History', label: 'Bidding History' },
    { id: 'Harvesting History', label: 'Harvesting History' },
    { id: 'Budgeting History', label: 'Budgeting History' },
  ];

  return (
    <div className="flex flex-col w-full mx-auto p-6 space-y-4 pb-20 min-h-screen">
      
      {/* Header Row */}
      <div className=" flex items-center justify-between shrink-0">
         <Breadcrumb />
         <Button variant="branding" size="md" icon={<CameraVideo size={16} />}>Learn</Button>
      </div>

      {/* Global Controls & Tabs */}
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
                options={['All', 'Sponsored Products', 'Sponsored Brands', 'Sponsored Display']} 
                onChange={setAdType}
                width="w-[180px]"
            />
            <SingleSelect 
                label="Date"
                value={dateRange} 
                options={['Last 3 days', 'Last 7 days', 'Last 14 days', 'Last 30 days']} 
                onChange={setDateRange}
                width="w-[160px]"
            />
            <button className="h-full w-[48px] bg-[#4aaada] flex rounded-r-lg items-center justify-center hover:bg-[#3a9aca] transition-colors">
                <Search className="w-5 h-5 text-white" />
            </button>
        </div>

        <ScrollableTabs 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />   
      </div>

      {/* Main Content Area - Passing Props */}
      <div className="flex flex-col flex-1 min-h-0">
        {activeTab === 'Bidding History' && <BiddingHistoryTab storeIds={selectedStoreIds} dateRange={dateRange} adType={adType} />}
        {activeTab === 'Harvesting History' && <HarvestingHistoryTab storeIds={selectedStoreIds} dateRange={dateRange} adType={adType} />}
        {activeTab === 'Budgeting History' && <BudgetingHistoryTab storeIds={selectedStoreIds} dateRange={dateRange} adType={adType} />}
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-gray-900 font-medium text-lg">Advertising</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="font-medium">Ad History</span>
    </div>
  );
}