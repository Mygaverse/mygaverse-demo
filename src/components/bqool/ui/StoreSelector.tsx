'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from "react-bootstrap-icons";
import { StoreService } from '@/lib/bqool/stores';

// --- Updated Interface ---
export interface Store {
  id: string;
  name: string;
  marketplace: string;
  status: string; // Added to support filtering
}

// Amazon 'a' Logo SVG
const AmazonIcon = () => (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" 
    alt="Amazon" 
    className="w-4 h-4 object-contain opacity-80 mt-1" 
  />
);

interface StoreSelectorProps {
  mode?: 'multiple' | 'single' | 'list';
  selectedStoreIds?: string[];
  onSelect?: (selectedIds: string[]) => void;
  showLabel?: boolean;
}

export const StoreSelector = ({ 
  mode = 'multiple',
  selectedStoreIds = [],
  onSelect,
  showLabel = true 
}: StoreSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. LOAD & FILTER STORES ---
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const data = await StoreService.getAll();
        
        // FILTER: Only show 'active' stores in the selector
        // Cast to 'any' first if StoreData type mismatch, then filter
        const activeStores = data.filter((s: any) => s.status === 'active');
        
        setStores(activeStores as Store[]); 
      } catch (e) {
        console.error("Failed to load stores for selector", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (storeId: string) => {
    if (mode === 'list') return; 

    let newSelection: string[];
    if (mode === 'single') {
      newSelection = [storeId];
      setIsOpen(false); // Close immediately for single select
    } else {
      // Multiple mode
      if (selectedStoreIds.includes(storeId)) {
        newSelection = selectedStoreIds.filter(id => id !== storeId);
      } else {
        newSelection = [...selectedStoreIds, storeId];
      }
    }
    onSelect?.(newSelection);
  };

  // Render Trigger Content
  // Note: If the currently selected store is Inactive, 'firstStore' will be undefined
  // because it was filtered out of the 'stores' array.
  const firstStore = stores.find(s => s.id === selectedStoreIds[0]);
  
  const getFlagUrl = (code: string) => `https://flagcdn.com/w20/${code.toLowerCase()}.png`;

  const triggerLabel = () => {
    if (loading) return <span className="text-gray-400 text-xs">Loading...</span>;
    if (mode === 'list') return <span className="text-gray-500">Stores</span>;
    
    if (selectedStoreIds.length === 0) return <span>Select Store</span>;
    
    return (
      <div className="flex items-center gap-2">
        <AmazonIcon />
        {firstStore && (
          <img 
            src={getFlagUrl(firstStore.marketplace)} 
            alt={firstStore.marketplace} 
            className="w-5 h-3.5 object-cover rounded-[1px] border border-gray-100" 
          />
        )}
        <span className="truncate max-w-[90px]">
          {firstStore ? firstStore.name : 'Select'}
        </span>
        {selectedStoreIds.length > 1 && (
          <span className="text-gray-500 text-xs">({selectedStoreIds.length})</span>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full" ref={containerRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`h-full px-3 bg-white border-y border-l border-[#e2e2e2] rounded-l-md flex items-center justify-between gap-2 text-sm text-gray-700 font-medium min-w-[240px] transition-colors ${mode !== 'list' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2">
            {mode !== 'list' && showLabel && (
                <span className="text-[10px] text-gray-400 absolute top-1 left-3">Stores</span>
            )}
            <div className={(mode !== 'list' && showLabel) ? "mt-3.5" : ""}>
                {triggerLabel()}
            </div>
        </div>
        {mode !== 'list' && <ChevronDown size={14} className="text-gray-500 shrink-0 mt-4" />}
      </div>

      {/* Dropdown Menu */}
      {isOpen && mode !== 'list' && (
        <div className="absolute top-full left-0 mt-1 w-[240px] bg-white border border-[#e2e2e2] rounded-md shadow-xl z-[60] max-h-[300px] overflow-y-auto">
          {stores.length === 0 ? (
             <div className="px-4 py-3 text-xs text-gray-500">No active stores found.</div>
          ) : (
             stores.map(store => {
                const isSelected = selectedStoreIds.includes(store.id);
                return (
                  <div 
                    key={store.id} 
                    onClick={() => handleToggle(store.id)}
                    className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors
                      ${isSelected ? 'bg-[#f1f7ff]' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className={`w-5 h-5 flex items-center justify-center mr-3 rounded border transition-all
                      ${mode === 'single' ? 'rounded-full' : 'rounded'}
                      ${isSelected ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white'}
                    `}>
                      {isSelected && (
                        mode === 'single' 
                          ? <div className="w-2 h-2 rounded-full bg-white" /> 
                          : <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </div>

                    <div className="mr-3"><AmazonIcon /></div>
                    <img 
                      src={getFlagUrl(store.marketplace)} 
                      alt={store.marketplace} 
                      className="w-6 h-4 object-cover rounded-[2px] mr-3 shadow-sm border border-gray-100" 
                    />
                    
                    <span className={`text-sm ${isSelected ? 'font-medium text-[#4aaada]' : 'text-gray-700'}`}>
                      {store.name}
                    </span>
                  </div>
                );
             })
          )}
        </div>
      )}
    </div>
  );
};