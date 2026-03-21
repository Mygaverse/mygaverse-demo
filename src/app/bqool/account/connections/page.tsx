'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { Button } from '@/components/bqool/ui/Button';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Plus, Search, ArrowRepeat, Link45deg, Check, X, ChevronRight } from 'react-bootstrap-icons';
import { SingleSelect } from '@/components/bqool/ui/SingleSelect'; //
import { StoreSelector, Store } from '@/components/bqool/ui/StoreSelector'; //
import { NameEditorPopover } from '@/components/bqool/ui/NameEditorPopover';
import { Modal } from '@/components/bqool/ui/Modal';
import { StatusToggle } from '@/components/bqool/ui/StatusToggle';
import { OnboardingWizard } from '@/components/bqool/onboarding/OnboardingWizard';

// --- Sub-Components ---

function Breadcrumb() {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className="text-lg font-medium">BQool Account</span>
      <ChevronRight size={16} />
      <span className="text-sm">Profile</span>
    </div>
  );
}

export default function ConnectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Filters State ---
  const [selectedMktIds, setSelectedMktIds] = useState<string[]>([]); // For StoreSelector
  const [statusFilter, setStatusFilter] = useState('All');
  const [connFilter, setConnFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Actions State ---
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // --- Modal State for Toggle Logic ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'pause' | 'enable'; //
    storeId: string | null;
  }>({ isOpen: false, type: 'enable', storeId: null });

  // 1. Fetch Data
  const loadConnections = async () => {
    if (!user) return;
    try {
        // Fetch user stores connection map
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userStoreIds = userSnap.data()?.connectedStoreIds || [];

        // Fetch all active stores (in a real app, filtering by ID array is better)
        // For demo, we fetch all active and match IDs
        const q = query(collection(db, 'stores')); // Fetching all so we can show paused ones too if needed
        const storeSnap = await getDocs(q);
        
        const mappedStores = storeSnap.docs
            .filter(d => userStoreIds.includes(d.id))
            .map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    // Map generic status to our UI states if needed
                    // Assuming 'status' field exists in Firestore ('active' | 'paused')
                    uiStatus: data.status === 'paused' ? 'paused' : 'active',
                    // Mocking separate account statuses for the table demo
                    adsStatus: 'connected', 
                    sellerStatus: 'connected' 
                };
            });
        setStores(mappedStores);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadConnections();
  }, [user, authLoading]);


  // 2. Logic Handlers

  const handleToggleClick = (store: any) => {
    if (store.uiStatus === 'active') {
        // Active -> Pause: Show Warning Modal
        setConfirmModal({ isOpen: true, type: 'pause', storeId: store.id });
    } else {
        // Paused -> Enable: Show Info Modal
        setConfirmModal({ isOpen: true, type: 'enable', storeId: store.id });
    }
  };

  const executeToggle = async () => {
    if (!confirmModal.storeId) return;

    // Optimistic Update
    const isPausing = confirmModal.type === 'pause';
    const newStatus = isPausing ? 'paused' : 'active'; // In real app, might go to 'enabling' first

    try {
        await updateDoc(doc(db, 'stores', confirmModal.storeId), { status: newStatus });
        
        setStores(prev => prev.map(s => 
            s.id === confirmModal.storeId 
            ? { ...s, uiStatus: isPausing ? 'paused' : 'enabling', status: newStatus } 
            : s
        ));

        // If enabling, simulate the "Enabling..." delay
        if (!isPausing) {
            setTimeout(() => {
                setStores(prev => prev.map(s => s.id === confirmModal.storeId ? { ...s, uiStatus: 'active' } : s));
            }, 3000);
        }

    } catch (e) {
        console.error("Toggle failed", e);
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleRename = async (newName: string) => {
    if (!editingStoreId) return;
    try {
        await updateDoc(doc(db, 'stores', editingStoreId), { name: newName });
        setStores(prev => prev.map(s => s.id === editingStoreId ? { ...s, name: newName } : s));
        setEditingStoreId(null);
    } catch (e) {
        alert("Failed to rename");
    }
  };


  // 3. Filtering Logic
  const filteredStores = stores.filter(store => {
    // Search
    if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Status Filter
    if (statusFilter !== 'All') {
        if (statusFilter === 'Enabled' && store.uiStatus !== 'active') return false;
        if (statusFilter === 'Paused' && store.uiStatus !== 'paused') return false;
        if (statusFilter === 'Enabling' && store.uiStatus !== 'enabling') return false;
    }

    // Connections Filter (Mock logic)
    if (connFilter === 'Connected' && store.adsStatus !== 'connected') return false;
    if (connFilter === 'Disconnected' && store.adsStatus === 'connected') return false;

    // Marketplace Filter (using StoreSelector IDs)
    // We compare store.id vs selectedIds, OR store.marketplace if your selector returns mkt codes.
    // Based on your StoreSelector mock, it returns store IDs. 
    // Since our stores table uses different IDs than the StoreSelector MOCK data, 
    // we need to be careful. For this demo, let's assume filtering by Store ID matches.
    if (selectedMktIds.length > 0 && !selectedMktIds.includes(store.id)) return false;

    return true;
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10 min-h-[calc(100vh-64px)] font-sans">
        
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* --- FILTER BAR --- */}
        <div className="flex flex-wrap items-center gap-4">
            
            {/* Main Filter Group - Connected Look */}
            <div className="flex items-center shadow-sm rounded-md h-[48px]">
                {/* 1. Marketplace Selector */}
                <div className="w-[240px] h-full">
                    <StoreSelector
                        mode="multiple"
                        selectedStoreIds={selectedMktIds}
                        onSelect={setSelectedMktIds}
                        showLabel={true}
                    />
                </div>

                {/* 2. Status Selector */}
                <div className="w-[180px] h-full">
                    <SingleSelect 
                        label="Status"
                        value={statusFilter}
                        options={['All', 'Enabled', 'Enabling', 'Paused']} //
                        onChange={setStatusFilter}
                        width="w-full border-r-0"
                    />
                </div>

                {/* 3. Connections Selector */}
                <div className="w-[180px] h-full">
                    <SingleSelect 
                        label="Connections"
                        value={connFilter}
                        options={['All', 'Connected', 'Disconnected']} //
                        onChange={setConnFilter}
                        width="w-full"
                    />
                </div>

                <button className="h-[48px] w-[48px] bg-[#4aaada] flex items-center justify-center hover:bg-[#3a9aca] border border-[#4aaada] rounded-r-md">
                    <Search className="text-white" size={20} />
                </button>
            </div>
            

            {/* 4. Search Bar */}
            <div className="flex-1 min-w-[200px] relative h-[48px]">
                <input 
                    type="text"
                    placeholder="Search by Store Name"
                    className="w-full h-full pl-4 pr-10 border border-[#e2e2e2] rounded-md text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center bg-[#3c8dbc] text-white rounded-r-md">
                    <Search />
                </div>
            </div>

            {/* 5. Connect New Store Button */}
            <div className="h-full">
                <Button
                    variant='primary'
                    size='md'
                    className="flex items-center gap-2 bg-[#3c8dbc] hover:bg-[#357ca5]"
                    onClick={() => setIsWizardOpen(true)}
                    icon={<Plus size={18} />}
                >
                Connect New Store
                </Button>
            </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e2e2e2] overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#f4f8fb] border-b border-[#e2e2e2] text-gray-700 font-bold">
                    <tr>
                        <th className="px-6 py-4">BQool Advertising</th>
                        <th className="px-6 py-4">Marketplace</th>
                        <th className="px-6 py-4">Store Name</th>
                        <th className="px-6 py-4">Store ID</th>
                        <th className="px-6 py-4">Advertising Account</th>
                        <th className="px-6 py-4">Seller Account</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e2e2]">
                    {loading ? (
                         <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                    ) : filteredStores.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No stores found.</td></tr>
                    ) : (
                        filteredStores.map(store => (
                            <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                
                                {/* 1. Toggle Column */}
                                <td className="px-6 py-4">
                                    <StatusToggle 
                                        status={store.uiStatus}
                                        onClick={() => handleToggleClick(store)}
                                    />
                                </td>

                                {/* 2. Marketplace Column */}
                                <td className="px-6 py-4 flex items-center gap-2 font-medium text-gray-700">
                                     <img 
                                        src={`https://flagcdn.com/w20/${store.marketplace.toLowerCase().includes('us') ? 'us' : 'ca'}.png`} 
                                        alt="flag" 
                                        className="w-5 h-3.5 object-cover rounded-[1px] shadow-sm"
                                    />
                                    Amazon {store.marketplace}
                                </td>

                                {/* 3. Store Name (Editable) */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 group">
                                        <span className="text-gray-900">{store.name}</span>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setEditingStoreId(store.id)}
                                                className="text-xs text-[#3c8dbc] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Edit
                                            </button>
                                            {editingStoreId === store.id && (
                                                <NameEditorPopover 
                                                    initialName={store.name}
                                                    onSave={handleRename}
                                                    onCancel={() => setEditingStoreId(null)}
                                                    position={{ top: 20, left: 0 }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* 4. Store ID */}
                                <td className="px-6 py-4 font-mono text-sm text-gray-500">
                                    {store.id}
                                </td>

                                {/* 5. Advertising Account Status */}
                                <td className="px-6 py-4">
                                    {store.adsStatus === 'connected' ? (
                                        <span className="text-green-500 font-medium text-xs">Connected</span>
                                    ) : (
                                        <button className="border border-red-300 text-red-500 text-xs px-3 py-1 rounded hover:bg-red-50 flex items-center gap-1 transition-colors">
                                            <ArrowRepeat /> Reconnect
                                        </button>
                                    )}
                                </td>

                                {/* 6. Seller Account Status */}
                                <td className="px-6 py-4">
                                    {store.sellerStatus === 'connected' ? (
                                        <button className="border border-red-300 text-red-500 text-xs px-3 py-1 rounded hover:bg-red-50 flex items-center gap-1 transition-colors">
                                            <ArrowRepeat /> Reconnect
                                        </button>
                                    ) : (
                                        <button className="border border-[#3c8dbc] text-[#3c8dbc] text-xs px-3 py-1 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors">
                                            <Link45deg /> Connect Account
                                        </button>
                                    )}
                                </td>

                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            {/* Pagination Footer (Static for Demo) */}
            <div className="px-6 py-4 border-t border-[#e2e2e2] bg-white flex items-center justify-between text-sm text-gray-600">
                 <div className="flex items-center gap-2">
                    <span>Display</span>
                    <select className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none">
                        <option>25</option>
                        <option>50</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-4">
                    <span>20 Results, Page 1 of 5</span>
                    <div className="flex gap-1">
                        <button disabled className="px-2 py-1 border rounded disabled:opacity-50">&lt;</button>
                        <button className="px-2 py-1 border rounded hover:bg-gray-50">&gt;</button>
                    </div>
                 </div>
            </div>
        </div>

        {/* --- MODALS --- */}

        {/* 1. Confirmation Modal (Pause/Enable) */}
        <Modal 
            isOpen={confirmModal.isOpen} 
            onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
            title="Message"
            width="max-w-xl"
        >
            <div className="p-0">
                
                <div className="p-10 text-center">
                    {confirmModal.type === 'pause' ? (
                        <p className="text-red-500 text-base leading-relaxed">
                            Are you sure you want to pause BQool Advertising? This will remove your store and data from BQool.
                        </p>
                    ) : (
                        <p className="text-gray-800 text-base leading-relaxed">
                            We are in the process of downloading advertising data from Amazon. <br/>
                            Your store should be available in few hours.
                        </p>
                    )}
                </div>

                <div className=" px-4 py-3 flex justify-center gap-2 border-t border-[#e2e2e2] rounded-b">
                     {confirmModal.type === 'pause' ? (
                        <>
                            <Button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="px-4 py-2 bg-[#e2e2e2] hover:bg-gray-300 text-gray-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
                                icon={<X />}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={executeToggle}
                                className="px-4 py-2 bg-[#3c8dbc] hover:bg-[#357ca5] text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                                icon={<Check />}
                            >
                                Yes
                            </Button>
                        </>
                     ) : (
                        <Button
                            onClick={executeToggle}
                            className="px-6 py-2 bg-[#3c8dbc] hover:bg-[#357ca5] text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                            icon={<Check />}
                        >
                            OK
                        </Button>
                     )}
                </div>
            </div>
        </Modal>

        {/* 2. Onboarding Wizard (Connect New Store) */}
        <OnboardingWizard 
            isOpen={isWizardOpen} 
            onClose={() => setIsWizardOpen(false)} 
        />

      </div>
    </DashboardShell>
  );
}