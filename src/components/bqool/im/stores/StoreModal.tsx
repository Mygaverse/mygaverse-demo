'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { StoreService } from '@/lib/bqool/stores';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StoreModal({ isOpen, onClose, onSuccess }: StoreModalProps) {
  const [loading, setLoading] = useState(false);
  
  // the State Initialization
const [formData, setFormData] = useState<{
  name: string;
  marketplace: string;
  currency: string;
  status: 'active' | 'inactive'; // <--- EXPLICITLY TYPE THIS
}>({
  name: '',
  marketplace: 'US',
  currency: 'USD',
  status: 'active' 
});

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await StoreService.create(formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Amazon Store" width="max-w-md">
      <div className="p-6 space-y-4">
        
        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
          <input 
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Gadget World"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        {/* Marketplace Select */}
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={formData.marketplace}
                onChange={e => setFormData({...formData, marketplace: e.target.value})}
              >
                <option value="US">United States (US)</option>
                <option value="CA">Canada (CA)</option>
                <option value="ES">Span (ES)</option>
                <option value="MX">Mexico (MX)</option>
                <option value="JP">Japan (JP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
              >
                <option value="USD">USD ($)</option>
                <option value="CAD">CAD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="MXN">MXN ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
          <select 
            className="w-full border rounded px-3 py-2"
            value={formData.status}
            onChange={(e) => setFormData({
                ...formData, 
                status: e.target.value as 'active' | 'inactive' 
            })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Store'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}