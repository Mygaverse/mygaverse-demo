'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StoreService, StoreData } from '@/lib/bqool/stores';
import { Button } from '@/components/bqool/ui/Button';
import { AdminGuard } from '@/components/bqool/auth/AdminGuard';
import { DynamicTable, ColumnDef } from '@/components/bqool/tables/DynamicTable';
import { StoreModal } from '@/components/bqool/im/stores/StoreModal';
import { Plus, Shop, LightningFill,ToggleOn, ToggleOff, Trash } from 'react-bootstrap-icons';
import { populateStoreData } from '@/lib/bqool/storeDataPopulator'; 

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const router = useRouter();

  // --- DATA LOADING ---
  const loadStores = async () => {
    setLoading(true);
    const data = await StoreService.getAll();
    setStores(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStores();
  }, []);

  // --- TEMPLATE GENERATOR LOGIC ---
  const handlePopulateData = async (storeId: string) => {
    if(!confirm("Generate demo campaigns, products, and metrics for this store?")) return;
    setGeneratingId(storeId);
    try {
        await populateStoreData(storeId); // We need to create this function
        alert("Demo data generated successfully!");
    } catch (error) {
        console.error(error);
        alert("Failed to generate data.");
    } finally {
        setGeneratingId(null);
    }
  };

  // HANDLER: Toggle
  const handleToggleStatus = async (store: StoreData) => {
    try {
        const newStatus = await StoreService.toggleStatus(store.id!, store.status);
        // Optimistic UI Update (or just reloadStores)
        setStores(prev => prev.map(s => s.id === store.id ? { ...s, status: newStatus as any } : s));
    } catch (e) {
        alert("Failed to toggle status");
    }
  };

  // HANDLER: Delete
  const handleDelete = async (storeId: string) => {
    if (!confirm("WARNING: This will delete the store and ALL generated campaign data. This cannot be undone.")) return;
    try {
        await StoreService.deleteStore(storeId);
        setStores(prev => prev.filter(s => s.id !== storeId)); // Remove from list
    } catch (e) {
        alert("Delete failed");
    }
  };

  const columns: ColumnDef<StoreData>[] = [
    {
      key: 'name',
      header: 'Store Name',
      render: (row) => (
        <div className="flex items-center gap-2 font-medium">
            <Shop className="text-gray-400" />
            {row.name}
        </div>
      )
    },
    { key: 'marketplace', header: 'Region', width: '100px', render: (row) => row.marketplace },
    { key: 'currency', header: 'Currency', width: '100px', render: (row) => row.currency },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => (
        <button 
           onClick={() => handleToggleStatus(row)}
           className="flex items-center gap-2 focus:outline-none"
           title="Click to Toggle"
        >
            {row.status === 'active' ? (
                <>
                  <ToggleOn size={28} className="text-green-600 text-xl" />
                  <span className="text-xs font-bold text-green-700">ACTIVE</span>
                </>
            ) : (
                <>
                  <ToggleOff size={28} className="text-gray-400 text-xl" />
                  <span className="text-xs font-bold text-gray-500">INACTIVE</span>
                </>
            )}
        </button>
      )
    },
    {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (row) => (
            <div className="flex justify-end items-center gap-3">
                {/* Populate */}
                <button 
                   onClick={() => handlePopulateData(row.id!)}
                   disabled={generatingId === row.id}
                   className="text-xs flex items-center gap-1 text-purple-600 border border-purple-200 bg-purple-50 px-2 py-2.5 rounded-md hover:bg-purple-100"
                   title="Each population creates 5 campaigns, plus products and 30 days of metrics."
                >
                    <LightningFill size={16} />
                    {generatingId === row.id ? 'Generating...' : 'Populate Data'}
                </button>
                
                {/* Manage */}
                <Button size="sm" variant="secondary" onClick={() => router.push(`/bqool/im/store-details?id=${row.id}`)}>
                  Manage
                </Button>

                {/* Delete */}
                <button 
                    onClick={() => handleDelete(row.id!)}
                    className="text-gray-300 hover:text-red-600 transition-colors ml-2"
                    title="Delete Store"
                >
                    <Trash size={16} />
                </button>
            </div>
        )
    }
  ];

  return (
    <AdminGuard>
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Amazon Stores Management</h1>
          <Button 
            variant="primary" 
            size="md" 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2"
            icon={<Plus size={20} className="text-white"/>}>
             Add Store
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
             <DynamicTable data={stores} columns={columns} />
        </div>

        <StoreModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadStores}
        />
      </div>
    </AdminGuard>
  );
}