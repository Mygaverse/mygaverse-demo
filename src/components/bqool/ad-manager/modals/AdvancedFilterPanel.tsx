'use client';

import React, { useState, useEffect } from 'react';
import { Trash, Plus, Star, X, CheckLg, Pencil, Files } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button'; 
import { NameEditorPopover } from '@/components/bqool/ui/NameEditorPopover';

// --- Types ---
export type FilterRow = {
  id: number;
  field: string;
  operator: string;
  value: string;
};

export type FavoriteGroup = {
  id: number;
  name: string;
  config: FilterRow[];
};

interface AdvancedFilterPanelProps {
  onClose?: () => void;
  onApply?: (filters: FilterRow[]) => void;
  initialFilters?: FilterRow[];
}

// Configuration Constants
const FILTER_FIELDS = [
  'Campaign Type', 'Status', 'Portfolio', 'Goal', 'Daily Budget', 
  'Ad Sales', 'Ad Spend', 'ACOS', 'ROAS', 'Ad Orders', 
  'Ad Units Sold', 'Impressions', 'Clicks', 'CTR', 'CPC', 
  'Out of Budget' 
];

const OPERATORS = [
  'greater than', 'less than', 'equals', 
  'greater than or equal to', 'less than or equal to'
];

export function AdvancedFilterPanel({ onClose, onApply, initialFilters = [] }: AdvancedFilterPanelProps) {
  const [activeTab, setActiveTab] = useState<'custom' | 'favorite'>('custom');
  
  // Initialize with passed filters or empty
  const [filters, setFilters] = useState<FilterRow[]>(initialFilters);
  
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteGroup[]>([
    { id: 1, name: 'High ACOS', config: [{ id: 1, field: 'ACOS', operator: 'greater than', value: '40' }] },
  ]);

  // Sync if parent updates (optional, but good for consistency)
  useEffect(() => {
    if (initialFilters) {
        setFilters(initialFilters);
    }
  }, [initialFilters]);

  // --- ACTIONS: CUSTOM FILTER ---

  const addFilter = () => {
    if (filters.length >= 3) return; // Max 3 limit
    const newId = Date.now();
    // Default values for new filter
    setFilters([...filters, { id: newId, field: 'Ad Sales', operator: 'greater than', value: '' }]);
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: number, key: keyof FilterRow, newValue: string) => {
    setFilters(filters.map(f => {
      if (f.id !== id) return f;
      // Special logic for "Out of Budget"
      if (key === 'field' && newValue === 'Out of Budget') {
        return { ...f, [key]: newValue, operator: '', value: '' }; 
      }
      if (key === 'field' && f.field === 'Out of Budget' && newValue !== 'Out of Budget') {
         return { ...f, [key]: newValue, operator: 'greater than', value: '' };
      }
      return { ...f, [key]: newValue };
    }));
  };

  const handleClear = () => {
      setFilters([]);
      // Auto-apply the clear? Usually better to wait for "Apply" click.
  };

  const handleSaveClick = () => {
    if (filters.length === 0) return;
    setShowSaveInput(true);
  };

  const handleConfirmSave = (name: string) => {
    const newFavorite: FavoriteGroup = { id: Date.now(), name, config: [...filters] };
    setFavorites([...favorites, newFavorite]);
    setShowSaveInput(false);
    setActiveTab('favorite');
  };

  // --- ACTIONS: FAVORITE TAB ---
  const loadFavorite = (fav: FavoriteGroup) => {
    setFilters([...fav.config]);
    setActiveTab('custom');
  };

  const deleteFavorite = (id: number) => {
    if(confirm("Delete this favorite?")) setFavorites(favorites.filter(fav => fav.id !== id));
  };

  return (
    <div className="flex flex-col min-w-[550px] bg-white text-gray-900 h-full">
      
      {/* --- HEADER TABS --- */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
            activeTab === 'custom' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Custom Filter
          {activeTab === 'custom' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[120px] h-[3px] bg-[#3b9ae8]" />}
        </button>

        <button
          onClick={() => setActiveTab('favorite')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
            activeTab === 'favorite' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Favorite Filter
          {activeTab === 'favorite' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[120px] h-[3px] bg-[#3b9ae8]" />}
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="p-6 min-h-[200px]">
        {/* VIEW 1: CUSTOM FILTER */}
        {activeTab === 'custom' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {filters.length === 0 ? (
              <div className="text-gray-400 text-sm italic py-2 text-center">
                No filters applied. Click "Add Filter" to start.
              </div>
            ) : (
              filters.map((filter, index) => {
                const isSpecial = filter.field === 'Out of Budget';
                
                return (
                  <div key={filter.id} className="flex items-center gap-2 group">
                    {/* 2. Logic: Show 'And' only for 2nd and 3rd row (index > 0) */}
                    <span className="text-sm font-medium text-gray-700 w-[30px] text-right">
                        {index > 0 ? 'And' : ''}
                    </span>
                    
                    {/* Field Selector */}
                    <select 
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 w-[160px]"
                    >
                      {FILTER_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    {/* Operator Selector */}
                    {!isSpecial && (
                        <select 
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 w-[180px]"
                        >
                        {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                    )}

                    {/* Value Input */}
                    {!isSpecial && (
                        <input 
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 w-[100px]"
                        placeholder="Value"
                        />
                    )}

                    {/* Delete Button */}
                    <button 
                      onClick={() => removeFilter(filter.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                );
              })
            )}

            {/* 3. Add Filter Button (Hidden if limit reached) */}
            {filters.length < 3 && (
                <div className="pl-[38px]">
                <button 
                    onClick={addFilter}
                    className="flex items-center gap-2 text-[#0066b7] text-sm hover:underline font-medium"
                >
                    <Plus size={18} /> Add Filter
                </button>
                </div>
            )}
          </div>
        )}

        {/* VIEW 2: FAVORITE FILTER LIST */}
        {activeTab === 'favorite' && (
          <div className="space-y-0 border rounded-md border-gray-200 overflow-hidden animate-in fade-in duration-200">
             {favorites.length === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">No favorites saved yet.</div>
             ) : (
               favorites.map((fav, index) => (
                 <div 
                    key={fav.id} 
                    className={`flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors ${
                      index !== favorites.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                 >
                    <span className="text-sm text-gray-700 font-medium">{fav.name}</span>
                    <div className="flex items-center gap-3 text-gray-400">
                      <button onClick={() => loadFavorite(fav)} title="Apply" className="hover:text-green-600 transition-colors"><CheckLg size={18} /></button>
                      <button onClick={() => deleteFavorite(fav.id)} title="Delete" className="hover:text-red-600 transition-colors"><Trash size={16} /></button>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white rounded-b-lg mt-auto">
        {/* Left: Save Favorite */}
        {activeTab === 'custom' ? (
           <div className="relative"> 
             {showSaveInput && (
               <NameEditorPopover
                 initialName=""
                 onSave={handleConfirmSave}
                 onCancel={() => setShowSaveInput(false)}
                 position={{ top: -160, left: 0 }} 
                 title="Name Filter"
                 label="Filter Name"
               />
             )}

             <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSaveClick}
              disabled={filters.length === 0}
              icon={<Star size={14} />}
             >
               Save as Favorite Filter
            </Button>
          </div>
        ) : <div />}

        {/* Right: Actions */}
        <div className="flex gap-3">
          <Button variant="ghostOutline" onClick={handleClear} disabled={filters.length === 0}>Clear</Button>
          <Button variant="ghost" onClick={onClose} icon={<X size={16} />}>Close</Button>
          <Button
            variant="primary" 
            icon={<CheckLg size={16} />}
            onClick={() => {
              if (onApply) onApply(filters);
              if (onClose) onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}