'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, CameraVideo, ChevronRight } from "react-bootstrap-icons";
import { doc, getDoc, collection, query, where, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { Button } from "../ui/Button";
import { BudgetingGroupTab } from "./tabs/BudgetingGroupTab";
import { CampaignsTab } from "./tabs/CampaignsTab";
import { StoreSelector } from "../ui/StoreSelector";
import { ScrollableTabs } from "../ui/ScrollableTabs";
import { ProductAdsModal } from './modals/ProductAdsModal';

export function BudgetManagerContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Budgeting Group');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Real Data State
  const [budgetingGroups, setBudgetingGroups] = useState<any[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [allProductAds, setAllProductAds] = useState<any[]>([]); // Store all campaigns to link
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isProductAdsModalOpen, setIsProductAdsModalOpen] = useState(false);
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState<any>(null);

  // --- 1. Load Default Store ---
  useEffect(() => {
    const initDefaultStore = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().defaultStoreId) {
          setSelectedStoreIds([userDoc.data().defaultStoreId]);
        }
      } catch (error) { console.error(error); }
    };
    initDefaultStore();
  }, [user]);

  // --- 2. Fetch Groups & Campaigns ---
  const fetchData = async () => {
    if (!user || selectedStoreIds.length === 0) return;
    setLoading(true);
    try {
      const stores = selectedStoreIds.slice(0, 10);

      // A. Fetch Budget Groups
      const groupQ = query(
        collection(db, 'budget_groups'),
        where('userId', '==', user.uid),
        where('storeId', 'in', stores)
      );

      // B. Fetch Campaigns (to link them in the Campaigns Tab)
      const campQ = query(
        collection(db, 'campaigns'),
        where('storeId', 'in', stores)
      );

      // Fetch Product Ads to calculate counts
      const adsQ = query(
        collection(db, 'product_ads'),
        where('storeId', 'in', stores)
      );

      const [groupSnap, campSnap, adsSnap] = await Promise.all([
        getDocs(groupQ),
        getDocs(campQ),
        getDocs(adsQ)
      ]);

      setBudgetingGroups(groupSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAllCampaigns(campSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => !c.createdBy || c.createdBy === 'system' || c.createdBy === user.uid));
      setAllProductAds(adsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Error loading budget manager data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedStoreIds]);

  // --- 3. DELETE HANDLER ---
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this budget group? Associated campaigns will be unlinked.")) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. Delete the Group Document
      const groupRef = doc(db, 'budget_groups', groupId);
      batch.delete(groupRef);

      // 2. Find associated campaigns and Unlink them
      const associatedCampaigns = allCampaigns.filter(c => c.budgetGroupId === groupId);

      associatedCampaigns.forEach(camp => {
        const campRef = doc(db, 'campaigns', camp.id);
        batch.update(campRef, {
          budgetGroupId: null, // Remove link
          budgetingGroupName: null, // Clear badge
          autoBudget: false,   // Remove badge
          budgetRule: null     // Clear legacy field if any
        });
      });

      // 3. Commit
      await batch.commit();

      // 4. Refresh UI
      fetchData();

    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Derived State: Link Campaigns to Groups ---
  const campaignData = useMemo(() => {
    // Step 1: Filter campaigns that have a Group ID
    const linkedCampaigns = allCampaigns.filter(c => c.budgetGroupId);

    // Step 2: Map and Filter out Orphans (Fixes "Unknown Group" issue immediately)
    const validCampaigns = linkedCampaigns.reduce((acc, camp) => {
      const parentGroup = budgetingGroups.find(g => g.id === camp.budgetGroupId);

      // Only include if the parent group actually exists in our current data
      if (parentGroup) {
        const adsCount = allProductAds.filter(ad => ad.campaignId === camp.id).length;

        acc.push({
          ...camp,
          dailyBudget: camp.budget,
          budgetingGroupId: camp.budgetGroupId,
          budgetingGroupName: parentGroup.name,
          budgetingGroupStatus: parentGroup.enabled ? 'Enabled' : 'Paused',
          productCount: adsCount,

          adSales: camp.sales || 0,
          adSpend: camp.spend || 0,
          acos: camp.acos || 0,
          roas: camp.roas || 0,
          orders: camp.orders || 0,
          units: camp.units || 0,
          cvr: camp.cvr || 0,
          impressions: camp.impressions || 0,
          clicks: camp.clicks || 0,
          ctr: camp.ctr || 0,
          cpc: camp.cpc || 0,
        });
      }
      return acc;
    }, [] as any[]);

    return validCampaigns;
  }, [budgetingGroups, allCampaigns, allProductAds]);

  const handleSwitchToGroup = (groupId: string) => {
    setActiveTab('Budgeting Group');
  };

  const handleOpenProductAdsModal = (campaign: any) => {
    setSelectedCampaignForModal(campaign);
    setIsProductAdsModalOpen(true);
  };

  const handleCloseProductAdsModal = () => {
    setIsProductAdsModalOpen(false);
    setSelectedCampaignForModal(null);
  };

  const BUDGET_TABS = [
    { id: 'Budgeting Group', label: 'Budgeting Group', disabled: false },
    { id: 'Campaigns', label: 'Campaigns', disabled: campaignData.length === 0 },
  ];

  return (
    <div className="flex flex-col w-full mx-auto p-6 space-y-4 pb-20 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Breadcrumb />
        <Button variant="branding" size="md" icon={<CameraVideo size={16} />}>Learn</Button>
      </div>

      {/* Controls & Tabs */}
      <div className="flex items-center h-[48px] gap-4 z-60 relative">
        <div className="flex items-center rounded-md shadow-sm border-0 border-[#e2e2e2] bg-white h-full shrink-0 z-60 relative">
          <div className="h-full border-0 border-[#e2e2e2]">
            <StoreSelector
              mode="multiple"
              selectedStoreIds={selectedStoreIds}
              onSelect={setSelectedStoreIds}
            />
          </div>
          <button className="h-full w-[48px] bg-[#4aaada] flex rounded-r-lg items-center justify-center hover:bg-[#3a9aca] transition-colors">
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>

        <ScrollableTabs
          tabs={BUDGET_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {activeTab === 'Budgeting Group' && (
          <BudgetingGroupTab
            data={budgetingGroups}
            setData={setBudgetingGroups}
            refreshData={fetchData}
            currentStoreId={selectedStoreIds[0]}
          />
        )}

        {activeTab === 'Campaigns' && (
          <CampaignsTab
            data={campaignData}
            onSwitchToGroup={handleSwitchToGroup}
            onProductAdsClick={handleOpenProductAdsModal}
          />
        )}
      </div>

      {/* Product Ads Modal */}
      <ProductAdsModal
        isOpen={isProductAdsModalOpen}
        onClose={handleCloseProductAdsModal}
        campaign={selectedCampaignForModal}
      />
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-gray-900 font-medium text-lg">Advertising</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="font-medium">Budget Manager</span>
    </div>
  );
}