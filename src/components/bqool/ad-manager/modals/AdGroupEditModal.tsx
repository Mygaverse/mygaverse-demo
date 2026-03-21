'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'react-bootstrap-icons';
import { Portal } from '@/components/bqool/ui/Portal';
import { Badge } from '@/components/bqool/ui/Badge';
import { Button } from '@/components/bqool/ui/Button';
import { BudgetCell } from '@/components/bqool/tables/cells/BudgetCell';
import { NumberStepper } from '@/components/bqool/ui/NumberStepper'; // Assuming you have this or standard input

interface AdGroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  adGroup: any; // Ideally types: UnifiedAdGroup
  onSave: (id: string, updates: any) => Promise<void>;
}

export const AdGroupEditModal = ({ isOpen, onClose, adGroup, onSave }: AdGroupEditModalProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Enabled');
  const [bid, setBid] = useState(0.00);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (adGroup) {
      setName(adGroup.name);
      setStatus(adGroup.enabled ? 'Enabled' : 'Paused');
      setBid(adGroup.defaultBid || 0);
    }
  }, [adGroup]);

  if (!isOpen || !adGroup) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(adGroup.id, {
      name,
      defaultBid: bid,
      enabled: status === 'Enabled'
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => {if(e.target === e.currentTarget) onClose()}}>
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          
          {/* 1. Header */}
          <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-white">Edit Ad Group</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24}/></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#f8f9fa] p-6 space-y-4">
            
            {/* 2. Campaign Context Card */}
            <div className="bg-white border border-[#e2e2e2] rounded-md p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                        <span className="font-bold text-sm text-gray-900">Campaign</span>
                        <span className="text-sm text-gray-700 font-medium">{adGroup.campaignName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 pl-4">
                    <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                        <img src={`https://flagcdn.com/w20/${adGroup.flag || 'us'}.png`} className="w-3.5 h-2.5 rounded-[1px]" alt="flag" />
                        <span className="text-xs text-gray-600">{adGroup.storeName}</span>
                    </div>
                    <Badge variant="neutral">{adGroup.type === 'SP' ? 'SP Manual' : adGroup.type}</Badge>
                    <Badge variant="status-enabled">Enabled</Badge>
                </div>
            </div>

            {/* 3. Ad Group Context Card */}
            <div className="bg-white border border-[#e2e2e2] rounded-md p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                    <span className="font-bold text-sm text-gray-900">Ad Group</span>
                    <span className="text-sm text-gray-900 font-bold">{adGroup.name}</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                    <Badge variant={adGroup.enabled ? 'status-enabled' : 'neutral'}>{adGroup.enabled ? 'Enabled' : 'Paused'}</Badge>
                    {/* Mock AI Badge if needed based on data */}
                    {adGroup.aiBidding && <Badge variant="ai-bidding">AI-Bidding</Badge>}
                    <div className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs font-medium text-gray-700">
                        Default Bid ${adGroup.defaultBid?.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* 4. Settings Form */}
            <div className="flex flex-col md:flex-row gap-6 mt-6">
                <div className="w-48 pt-2">
                    <h3 className="text-base font-medium text-gray-900">Ad Group Settings</h3>
                </div>
                
                <div className="flex-1 bg-white border border-[#e2e2e2] rounded-md overflow-hidden">
                    {/* Name */}
                    <div className="flex border-b border-[#e2e2e2]">
                        <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Ad Group Name</div>
                        <div className="w-2/3 p-4">
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#4aaada] outline-none"
                            />
                            {name.length > 200 && <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">⚠️ Up to 255 Characters</div>}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex border-b border-[#e2e2e2]">
                        <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Ad Group Status</div>
                        <div className="w-2/3 p-4">
                            <div className="relative w-40">
                                <select 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm appearance-none bg-white outline-none focus:border-[#4aaada] cursor-pointer"
                                >
                                    <option value="Enabled">Enabled</option>
                                    <option value="Paused">Paused</option>
                                    <option value="Archived">Archived</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Default Bid */}
                    <div className="flex">
                        <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Default Bid</div>
                        <div className="w-2/3 p-4">
                            <div className="w-32">
                                <BudgetCell 
                                  value={bid} 
                                  isAuto={false} 
                                  onChange={setBid} 
                                />
                            </div>
                            {bid < 0.02 && <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">⚠️ Bid must be at least $0.02</div>}
                        </div>
                    </div>
                </div>
            </div>

          </div>

          {/* 5. Footer */}
          <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
            <Button variant="ghost" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300">Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving} className="bg-[#4aaada] hover:bg-[#3a9ad0] text-white px-6">Save</Button>
          </div>

        </div>
      </div>
    </Portal>
  );
};