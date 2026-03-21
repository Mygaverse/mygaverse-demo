'use client';

import React, { useState, useMemo } from 'react';
import { Search, LayoutThreeColumns, PlusCircleFill } from "react-bootstrap-icons";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';

import { Button } from "../../ui/Button";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { DynamicTable } from "../../tables/DynamicTable"; 
import { getBudgetingGroupColumns } from "../columns/budgeting-groups-columns";
import { AddBudgetGroupModal } from "../modals/AddBudgetGroupModal";

interface BudgetingGroupTabProps {
    data: any[];
    setData: React.Dispatch<React.SetStateAction<any[]>>;
    refreshData: () => void;
    currentStoreId?: string;
}

export function BudgetingGroupTab({ data, setData, refreshData, currentStoreId }: BudgetingGroupTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusIds, setStatusIds] = useState<string[]>(['all']);
  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<any>(null); // State for editing

  // --- Handlers ---
  const handleToggleStatus = async (id: string, newVal: boolean) => {
    // Optimistic
    setData(prev => prev.map(row => row.id === id ? { ...row, enabled: newVal } : row));
    try {
        await updateDoc(doc(db, 'budget_groups', id), { enabled: newVal });
    } catch (e) { console.error(e); }
  };

  const handleBudgetChange = async (id: string, newVal: number) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, budget: newVal } : row));
    try {
        await updateDoc(doc(db, 'budget_groups', id), { budget: newVal });
    } catch (e) { console.error(e); }
  };

  const handleDeleteGroup = async (id: string) => {
      if(confirm("Are you sure you want to delete this budgeting group?")) {
          // Optimistic
          setData(prev => prev.filter(g => g.id !== id));
          try {
              await deleteDoc(doc(db, 'budget_groups', id));
          } catch (e) { console.error(e); }
      }
  };

  // --- NEW: Edit Handler ---
  const handleEditGroup = (group: any) => {
      setGroupToEdit(group); // Pass the full object
      setIsModalOpen(true);
  };

  const handleAddGroup = () => {
      setGroupToEdit(null); // Clear edit state
      setIsModalOpen(true);
  };

  const columns = useMemo(() => getBudgetingGroupColumns(
    handleToggleStatus, 
    handleBudgetChange, 
    handleEditGroup, 
    handleDeleteGroup
  ), []);

  const STATUS_OPTIONS = [
      { id: 'all', label: 'All Budgeting Group Status' },
      { id: 'enabled', label: 'Enabled' },
      { id: 'paused', label: 'Paused' }
  ];

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <div className="flex items-center gap-3 h-[48px] z-40 relative">
        <div className="flex-1 flex items-center h-full">
            <div className="h-full px-3 flex items-center justify-center bg-white border border-r-0 border-[#e2e2e2] rounded-l-md text-gray-400"><Search size={18} /></div>
            <input type="text" placeholder="Search by Budget Group" className="h-full flex-1 border border-[#e2e2e2] border-l-0 px-2 text-sm outline-none focus:border-[#4aaada]" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
            <button className="h-full w-[48px] bg-[#4aaada] rounded-r-md flex items-center justify-center hover:bg-[#3a9aca] text-white"><Search size={18} /></button>
        </div>

        <div className="w-[280px]">
            <MultipleSelector label="Status" options={STATUS_OPTIONS} selectedIds={statusIds} onChange={setStatusIds} width="w-full" />
        </div>

        <Button variant="primary" size="lg" icon={<PlusCircleFill size={18} />} onClick={() => setIsModalOpen(true)}>
            Add Budgeting Group
        </Button>

        <Button variant="secondary" size="lg" icon={<LayoutThreeColumns size={16} />}>Columns</Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg shadow-sm overflow-hidden border-0 border-[#e2e2e2]">
          <DynamicTable 
            data={data.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))} 
            columns={columns} 
            emptyVariant="cta"
            emptyTitle="No budgeting group available"
            emptyActionLabel="Add Budgeting Group"
            onEmptyAction={() => setIsModalOpen(true)}
          />
      </div>

      <AddBudgetGroupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshData}
        initialStoreId={currentStoreId}
        groupToEdit={groupToEdit} // Pass the group to edit
      />
    </div>
  );
}