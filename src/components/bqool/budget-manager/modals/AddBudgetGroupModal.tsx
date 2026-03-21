'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Trash3, InfoCircleFill } from "react-bootstrap-icons";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { NumberStepper } from "../../ui/NumberStepper";
import { Badge } from "../../ui/Badge";
import { SearchInputGroup } from "../../ui/SearchInputGroup"; 
import { SingleSelect } from "../../ui/SingleSelect";   
import { StoreSelector } from "../../ui/StoreSelector";  
import { Pagination } from "../../ui/Pagination";   
import { Portal } from '@/components/bqool/ui/Portal';

interface AddBudgetGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; 
  initialStoreId?: string;
  groupToEdit?: any; 
}

export const AddBudgetGroupModal = ({ isOpen, onClose, onSuccess, initialStoreId, groupToEdit}: AddBudgetGroupModalProps) => {
  const { user } = useAuth(); // Get current user

  // Form State
  const [groupName, setGroupName] = useState("New Budget Group");
  const [budget, setBudget] = useState<number>(50.00);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(initialStoreId ? [initialStoreId] : []);
  
  // Data State
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Enabled");
  const [adTypeFilter, setAdTypeFilter] = useState("All");
  
  // Pagination
  const [leftPage, setLeftPage] = useState(1);
  const [leftPageSize, setLeftPageSize] = useState(5);

  // --- INITIALIZE FORM ---
  useEffect(() => {
    if (isOpen) {
        if (groupToEdit) {
            // EDIT MODE: Populate from existing group
            setGroupName(groupToEdit.name);
            setBudget(groupToEdit.budget);
            setSelectedStoreIds([groupToEdit.storeId]);
            // Campaigns will be selected after fetchCampaigns runs
        } else {
            // CREATE MODE: Defaults
            setGroupName("New Budget Group");
            setBudget(50.00);
            setSelectedStoreIds(initialStoreId ? [initialStoreId] : []);
            setSelectedCampaigns([]);
        }
        // Reset filters on open
        setSearchTerm("");
        setStatusFilter("Enabled");
        setAdTypeFilter("All");
    }
  }, [isOpen, groupToEdit, initialStoreId]);

  // --- 1. LOAD CAMPAIGNS FROM FIRESTORE ---
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (selectedStoreIds.length === 0) return;
      setLoading(true);
      try {
        const q = query(
            collection(db, 'campaigns'), 
            where('storeId', '==', selectedStoreIds[0])
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAvailableCampaigns(data);

        // If Editing, restore selected campaigns based on IDs stored in group
        if (groupToEdit && groupToEdit.campaignIds) {
            const preSelected = data.filter((c: any) => groupToEdit.campaignIds.includes(c.id));
            setSelectedCampaigns(preSelected);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && selectedStoreIds.length > 0) {
        fetchCampaigns();
    }
  }, [isOpen, selectedStoreIds, groupToEdit]);

  // --- 2. FILTERING ---
  const filteredCampaigns = useMemo(() => {
    return availableCampaigns.filter(camp => {
        // 1. Status Check
        if (statusFilter !== 'All') {
            if (statusFilter === 'Enabled' && !camp.enabled) return false;
            if (statusFilter === 'Paused' && camp.enabled) return false;
        }
        // Ad Type Filter
        if (adTypeFilter !== 'All' && camp.type !== adTypeFilter) return false;
        // 2. Search Check
        if (searchTerm && !camp.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        // 3. Exclude Already Selected
        if (selectedCampaigns.find(sc => sc.id === camp.id)) return false;

        return true;
    });
  }, [availableCampaigns, statusFilter, adTypeFilter, searchTerm, selectedCampaigns]);

  // --- 3. PAGINATION ---
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (leftPage - 1) * leftPageSize;
    return filteredCampaigns.slice(startIndex, startIndex + leftPageSize);
  }, [filteredCampaigns, leftPage, leftPageSize]);

  // --- HANDLERS ---
  const handleSelectCampaign = (camp: any) => {
      setSelectedCampaigns([...selectedCampaigns, camp]);
  };

  const handleRemoveCampaign = (id: string) => {
      setSelectedCampaigns(selectedCampaigns.filter(c => c.id !== id));
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
      if (loading || !user) return;
      if (selectedCampaigns.length === 0) {
          alert("Please select at least one campaign.");
          return;
      }

      setLoading(true);
      try {
          const batch = writeBatch(db);

          // Calculate Aggregates
          const metrics = selectedCampaigns.reduce((acc, curr) => ({
              adSales: acc.adSales + (curr.sales || 0),
              adSpend: acc.adSpend + (curr.spend || 0),
              impressions: acc.impressions + (curr.impressions || 0),
              clicks: acc.clicks + (curr.clicks || 0),
              orders: acc.orders + (curr.orders || 0),
              units: acc.units + (curr.units || 0),
          }), { adSales: 0, adSpend: 0, impressions: 0, clicks: 0, orders: 0, units: 0 });

          // Common Data Payload
          const groupData: any = {
              name: groupName,
              storeId: selectedStoreIds[0],
              userId: user.uid, // Bind to User
              storeName: selectedCampaigns[0].storeName || 'Store',
              storeFlag: selectedCampaigns[0].flag || 'us',
              budget: budget,
              ruleType: 'Auto-budgeting',
              campaignCount: selectedCampaigns.length,
              campaignIds: selectedCampaigns.map(c => c.id),
              // Metrics
              adSales: metrics.adSales,
              adSpend: metrics.adSpend,
              acos: metrics.adSales > 0 ? (metrics.adSpend / metrics.adSales) * 100 : 0,
              roas: metrics.adSpend > 0 ? metrics.adSales / metrics.adSpend : 0,
              orders: metrics.orders,
              units: metrics.units,
              clicks: metrics.clicks,
              impressions: metrics.impressions,
              ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
              cpc: metrics.clicks > 0 ? metrics.adSpend / metrics.clicks : 0,
          };

          // Set Group Doc Operation
          const groupRef = groupToEdit 
            ? doc(db, 'budget_groups', groupToEdit.id) 
            : doc(collection(db, 'budget_groups'));

          if (groupToEdit) {
              batch.update(groupRef, groupData);
              //await updateDoc(doc(db, 'budget_groups', groupToEdit.id), groupData);
          } else {
              batch.set(groupRef, { ...groupData, enabled: true, createdAt: new Date().toISOString() });
              /*
              await addDoc(collection(db, 'budget_groups'), {
                  ...groupData,
                  enabled: true,
                  createdAt: new Date().toISOString()
              });
              */
          }

          // Handle Unlinking Removed Campaigns
          if (groupToEdit && groupToEdit.campaignIds) {
              const newIds = selectedCampaigns.map(c => c.id);
              const removedIds = groupToEdit.campaignIds.filter((id: string) => !newIds.includes(id));
              
              removedIds.forEach((id: string) => {
                  const campRef = doc(db, 'campaigns', id);
                  batch.update(campRef, {
                      budgetGroupId: null,
                      budgetingGroupName: null,
                      autoBudget: false
                  });
              });
          }

          // UPDATE CAMPAIGNS (Add 'Auto-budgeting' badge flag)
          selectedCampaigns.forEach(camp => {
              const campRef = doc(db, 'campaigns', camp.id);
              batch.update(campRef, { 
                  autoBudget: true, // This triggers the badge in Ad Manager
                  budgetGroupId: groupRef.id,    // Link to group ID
                  budgetingGroupName: groupName, // Link to group name
              });
          });

          // Commit Batch
          await batch.commit();

          onSuccess();
          onClose();
      } catch (error) {
          console.error("Error saving budget group:", error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <Portal>
        <div className='z-[1000] relative'>
        <Modal isOpen={isOpen} onClose={onClose} title={groupToEdit ? "Edit Budgeting Group" : "Add Budgeting Group"} width="max-w-7xl" headerStyle="branding">
            <div className="px-6 py-4 flex flex-col gap-6 bg-white min-h-[600px]">
                
                {/* Top Form */}
                <div className="border border-[#e2e2e2] rounded-md text-sm shrink-0 z-50 relative">
                    <div className="grid grid-cols-[200px_1fr] border-b border-[#e2e2e2]">
                        <div className="bg-gray-50 px-4 py-4 font-medium text-gray-900 flex items-center border-r border-[#e2e2e2]">Budgeting Group Name</div>
                        <div className="bg-white px-4 py-3 flex items-center">
                            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border border-[#e2e2e2] rounded-md px-3 py-2 focus:outline-none focus:border-[#4aaada]"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-[200px_1fr_200px_1fr]">
                        <div className="bg-gray-50 px-4 py-4 font-medium text-gray-900 flex items-center border-r border-[#e2e2e2]">Store</div>
                        <div className="bg-white px-4 py-3 flex items-center border-r border-[#e2e2e2]">
                            <div className="rounded-r-md border-r border-gray-300 flex items-center overflow-hidden">
                                {/* Disable Store Selector in Edit Mode to prevent conflicts */}
                                <div className={groupToEdit ? "pointer-events-none opacity-60" : "h-[42px]"}>
                                    <StoreSelector mode="single" selectedStoreIds={selectedStoreIds} onSelect={setSelectedStoreIds} showLabel={false} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-4 font-medium text-gray-700 flex items-center gap-1 border-r border-[#e2e2e2]">Total Daily Budget <InfoCircleFill className="text-[#4aaada]" size={12} /></div>
                        <div className="bg-white px-4 py-2 flex items-center">
                            <div className="w-[120px]"><NumberStepper value={budget} onChange={(val) => setBudget(val)} prefix="$" step={1} /></div>
                        </div>
                    </div>
                </div>

                {/* Dual Selector */}
                <div className="flex gap-4 h-[400px] z-0 relative">
                    {/* Left Pane: Available */}
                    <div className="flex-1 flex flex-col border border-[#e2e2e2] rounded-md overflow-hidden min-h-0">
                        <div className="px-4 py-3 bg-white border-b border-[#e2e2e2] font-medium text-gray-800 shrink-0">Search Campaigns</div>
                        <div className="p-4 flex flex-col gap-3 bg-white shrink-0">
                            <div className='h-[42px]'>
                                <SearchInputGroup options={['Campaign']} selectedOption="Campaign" onOptionChange={()=>{}} searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search..." className='h-[42px] w-full' />
                            </div>
                            
                            <div className='flex gap-2'>
                                <SingleSelect label="Ad Type" value={statusFilter} options={['All', 'Sponsored Product', 'Sponsored Brand', 'Sponsored Display']} onChange={setStatusFilter} width="w-full" className="border-gray-200 rounded-md" />
                                <SingleSelect label="Campaign Status" value={statusFilter} options={['All', 'Enabled', 'Paused']} onChange={setStatusFilter} width="w-full" className="border-gray-200 rounded-md" />
                            </div>
                            
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white px-4 space-y-2 border-t border-[#e2e2e2]">
                            {loading ? <div className="p-4 text-center text-gray-500">Loading...</div> : 
                            paginatedCampaigns.map(camp => (
                                <div key={camp.id} onClick={() => handleSelectCampaign(camp)} className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200">
                                    <div className="w-4 h-4 rounded-full border border-gray-300 bg-white"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{camp.name}</div>
                                        <div className="flex gap-2"><Badge variant="neutral" size="sm">{camp.type}</Badge><Badge variant={camp.enabled?'status-enabled':'neutral'} size="sm">{camp.enabled?'Enabled':'Paused'}</Badge></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="shrink-0"><Pagination currentPage={leftPage} totalItems={filteredCampaigns.length} pageSize={leftPageSize} onPageChange={setLeftPage} onPageSizeChange={setLeftPageSize} /></div>
                    </div>

                    <div className="flex flex-col justify-center text-gray-300"><ChevronRight size={24}/></div>

                    {/* Right Pane: Selected */}
                    <div className="flex-1 flex flex-col border border-[#e2e2e2] rounded-md overflow-hidden bg-white">
                        <div className="px-4 py-3 bg-[#f1f7ff] border-b border-[#e2e2e2] flex justify-between items-center">
                            <span className="font-medium text-gray-800">Selected</span>
                            <span className="text-sm font-bold text-[#0066b7]">{selectedCampaigns.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {selectedCampaigns.map(camp => (
                                <div key={camp.id} className="p-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="text-sm text-gray-900 truncate mb-1">{camp.name}</div>
                                        <Badge variant={camp.enabled?'status-enabled':'neutral'} size="sm">{camp.enabled?'Enabled':'Paused'}</Badge>
                                    </div>
                                    <button onClick={() => handleRemoveCampaign(camp.id)} className="text-gray-400 hover:text-red-500"><Trash3 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-[#e2e2e2] flex justify-between bg-white shrink-0">
                            <Button variant="ghostOutline" onClick={onClose}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} disabled={loading}>Save Group</Button>
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
        </div>
    </Portal>
    
  );
};