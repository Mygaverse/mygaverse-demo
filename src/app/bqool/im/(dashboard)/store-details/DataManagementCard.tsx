'use client';

import React, { useState } from 'react';
import { Trash, DatabaseFill, ExclamationTriangle } from "react-bootstrap-icons";
import { Button } from "@/components/bqool/ui/Button";
import { clearStoreData, populateStoreData } from "@/lib/bqool/storeDataPopulator";

interface DataManagementCardProps {
  storeId: string;
  onDataChange?: () => void;
}

export function DataManagementCard({ storeId, onDataChange }: DataManagementCardProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleResetData = async () => {
    if (!confirm("⚠️ WARNING: This will DELETE ALL campaigns, ad groups, and keywords for this store and generate new random data.\n\nAre you sure?")) {
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('Clearing old data...');

    try {
      // 1. Wipe clean
      await clearStoreData(storeId);

      setMessage('Generating new data...');
      // 2. Repopulate
      await populateStoreData(storeId);

      setStatus('success');
      setMessage('Store data has been successfully reset!');

      if (onDataChange) onDataChange();
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOnly = async () => {
    if (!confirm("Are you sure you want to DELETE all data? The tables will be empty.")) return;

    setLoading(true);
    try {
      await clearStoreData(storeId);
      setStatus('success');
      setMessage('All data cleared.');
      if (onDataChange) onDataChange();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-red-200 rounded-lg shadow-sm overflow-hidden mt-8">
      {/* Header */}
      <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
        <ExclamationTriangle className="text-red-500" />
        <h3 className="font-bold text-red-900">Danger Zone: Data Management</h3>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6 max-w-2xl">
          Use these tools to reset the demo environment for this specific store.
          "Reset & Repopulate" is recommended if you want to see fresh charts and tables immediately.
        </p>

        <div className="flex gap-4 items-center">
          <Button
            onClick={handleResetData}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <DatabaseFill />
            )}
            Reset & Repopulate Data
          </Button>

          <Button
            variant="secondary"
            onClick={handleClearOnly}
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash /> Clear Data Only
          </Button>
        </div>

        {/* Status Feedback */}
        {message && (
          <div className={`mt-4 p-3 rounded text-sm font-medium ${status === 'success' ? 'bg-green-50 text-green-700' :
              status === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}