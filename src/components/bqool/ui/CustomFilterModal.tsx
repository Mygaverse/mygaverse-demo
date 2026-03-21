'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Trash, Star, StarFill, ChevronDown, Check } from 'react-bootstrap-icons';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Modal } from '@/components/bqool/ui/Modal';
import { NameEditorPopover } from '@/components/bqool/ui/NameEditorPopover';
import { Button } from '@/components/bqool/ui/Button';
import { Badge } from "@/components/bqool/ui/Badge";
import { Portal } from '@/components/bqool/ui/Portal';

export type FilterSelection = {
  id: string;
  name: string;
  items: string[];
  type: 'Campaign' | 'ASIN';
};

interface CustomFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
  onSaveFavorite: (name: string, selectedIds: string[], type: 'Campaign' | 'ASIN') => void;
  filterToEdit?: FilterSelection | null; 
}

export function CustomFilterModal({ isOpen, onClose, onApply, onSaveFavorite, filterToEdit }: CustomFilterModalProps) {
  // State
  const [searchType, setSearchType] = useState<'Campaign' | 'ASIN'>('Campaign');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dataList, setDataList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  
  // Saving State
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [editName, setEditName] = useState(""); // Name input for Edit Mode

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    if (isOpen) {
        if (filterToEdit) {
            setSearchType(filterToEdit.type);
            setSelectedIds(filterToEdit.items);
            setEditName(filterToEdit.name); // Pre-fill name
        } else {
            setSelectedIds([]);
            setEditName("");
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const coll = (filterToEdit ? filterToEdit.type : searchType) === 'Campaign' ? 'campaigns' : 'products';
                const q = query(collection(db, coll));
                const snap = await getDocs(q);
                const results = snap.docs.map(doc => ({ 
                    id: doc.id, ...doc.data(),
                    name: doc.data().name || doc.data().productName || 'Unknown',
                    type: doc.data().type || 'ASIN',
                    status: doc.data().status || doc.data().campaignStatus || 'Active',
                    marketplace: doc.data().storeName || 'Store',
                    goal: doc.data().goalName 
                }));
                setDataList(results);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }
  }, [isOpen, searchType, filterToEdit]);

  // --- 2. LOGIC ---
  const filteredData = useMemo(() => {
    if (!searchTerm) return dataList;
    return dataList.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [dataList, searchTerm]);

  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = { 'uncategorized': [] };
    filteredData.forEach(item => {
      if (item.goal) {
        if (!groups[item.goal]) groups[item.goal] = [];
        groups[item.goal].push(item);
      } else { groups['uncategorized'].push(item); }
    });
    return groups;
  }, [filteredData]);

  // --- HANDLERS ---
  const toggleSelection = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const getItemById = (id: string) => dataList.find(c => c.id === id);

  const handleSaveClick = () => {
      if (filterToEdit) {
          // Edit Mode: Save directly using the input value
          onSaveFavorite(editName, selectedIds, searchType);
          onClose();
      } else {
          // Create Mode: Open Popover
          setShowNameEditor(true);
      }
  };

  const handleApplyClick = () => {
      onApply(selectedIds);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={filterToEdit ? "Edit Favorite Filter" : `Search by ${searchType}`} 
        width="max-w-5xl"
        headerStyle="branding"
      >
        {/* EDIT NAME INPUT (Visible only in Edit Mode) */}
        {filterToEdit && (
            <div className="px-6 pt-4 pb-2">
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4aaada] bg-white text-gray-800"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter filter name..."
                />
            </div>
        )}

        <div className="flex h-[500px]">
          
          {/* --- LEFT PANE --- */}
          <div className="w-1/2 flex flex-col border-r border-gray-200 pr-4 p-4">
            <div className="flex mb-4">
              <div className="relative">
                <select 
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="h-[40px] pl-3 pr-8 bg-gray-50 border border-gray-300 rounded-l-md text-sm focus:outline-none appearance-none cursor-pointer hover:bg-gray-100"
                  disabled={!!filterToEdit} // Lock type if editing
                >
                  <option value="Campaign">Campaigns</option>
                  <option value="ASIN">ASINs</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600" size={10} />
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder={searchType === 'Campaign' ? 'Enter campaign name...' : 'Enter ASIN...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-[40px] pl-3 pr-10 border-y border-r border-gray-300 rounded-r-md text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="absolute right-0 top-0 h-[40px] w-[40px] flex items-center justify-center bg-[#4aaada] rounded-r-md text-white"><Search size={16} /></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {loading ? <div className="text-center text-gray-400 mt-10">Loading...</div> : (
              <>
                  {/* (Mapping Logic same as before) */}
                  {Object.keys(groupedData).map(key => {
                      if (key === 'uncategorized') return null;
                      const groupItems = groupedData[key];
                      const isGroupFullSelected = groupItems.every(i => selectedIds.includes(i.id));
                      return (
                          <div key={key} className="border border-gray-200 rounded-md p-3">
                              <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isGroupFullSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                      {isGroupFullSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                                  </div>
                                  <span className="font-bold text-sm text-gray-900">Goal</span>
                                  <span className="text-sm text-gray-700">{key}</span>
                              </div>
                              <div className="pl-6 space-y-3">
                                  {groupItems.map(item => <ItemRow key={item.id} item={item} isSelected={selectedIds.includes(item.id)} onToggle={() => toggleSelection(item.id)} />)}
                              </div>
                          </div>
                      );
                  })}
                  {groupedData['uncategorized'].map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-md p-3">
                          <ItemRow item={item} isSelected={selectedIds.includes(item.id)} onToggle={() => toggleSelection(item.id)} />
                      </div>
                  ))}
                  {filteredData.length === 0 && <div className="text-center text-gray-400 mt-10">No results found</div>}
              </>
              )}
            </div>
          </div>

          {/* --- RIGHT PANE --- */}
          <div className="w-1/2 flex flex-col pl-4 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
              <span className="font-medium text-gray-900">Selected</span>
              <span className="text-gray-500 text-sm">{selectedIds.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {selectedIds.length === 0 ? <div className="h-full flex items-center justify-center text-gray-400 text-sm">No items selected</div> : 
                selectedIds.map(id => {
                  const item = getItemById(id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</span>
                        <button onClick={() => toggleSelection(id)} className="text-gray-400 hover:text-red-500"><Trash size={14} /></button>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="mt-auto p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
            
            {/* Show Save if editing, or user wants to create favorite */}
            <div className="relative">
                {showNameEditor && (
                    <NameEditorPopover 
                        initialName=""
                        onCancel={() => setShowNameEditor(false)}
                        onSave={(name) => { onSaveFavorite(name, selectedIds, searchType); onClose(); }}
                        position={{ top: -160, left: 0 }}
                        title="Name Filter"
                    />
                )}
                
                <button 
                    onClick={handleSaveClick} 
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors border bg-white border-gray-300 hover:bg-gray-50 text-gray-700 mr-2"
                >
                    {filterToEdit ? <Check size={16}/> : <Star size={16}/>}
                    {filterToEdit ? 'Save Changes' : 'Save as Favorite'}
                </button>
            </div>

            <Button variant="secondary" onClick={onClose}>Cancel</Button>

            {/* Apply Button is always visible for manual applying */}
            <Button onClick={handleApplyClick}>Apply</Button>
        </div>
      </Modal>
      
      </div>
    </Portal>
  );
}

function ItemRow({ item, isSelected, onToggle }: { item: any, isSelected: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-start gap-3 mb-1 cursor-pointer" onClick={onToggle}>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${isSelected ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 hover:border-[#4aaada]'}`}>
        {isSelected && <Check size={14} className="text-white" />}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900 leading-tight mb-1">{item.name}</div>
        <div className="flex gap-2"><Badge variant="neutral" size="sm">{item.status}</Badge></div>
      </div>
    </div>
  )
}