'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/bqool/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DynamicTable, ColumnDef } from '@/components/bqool/tables/DynamicTable';
import { Button } from '@/components/bqool/ui/Button';
import {
  ArrowLeft,
  BoxSeam,
  Megaphone,
  Collection, // Ad Groups
  Bullseye,   // Targeting
  Search,     // Search Terms
  Trophy      // Goals
} from 'react-bootstrap-icons';
import { EditableCell } from "@/components/bqool/tables/EditableCell";
import { updateDoc, doc as firestoreDoc } from "firebase/firestore";

import { DataManagementCard } from "./DataManagementCard";

// --- DATA TYPES ---

interface Product {
  id: string;
  name: string;
  asin: string;
  price: number;
  img?: string; // Added img property
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;        // Renamed from dailyBudget
  sales: number;         // Renamed from totalSales
  spend: number;         // Renamed from totalSpend
  roas: number;
}

interface AdGroup {
  id: string;
  name: string;
  campaignName: string;
  defaultBid: number;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  acos: number;
}

interface Targeting {
  id: string;
  targetingText: string; // Renamed from keywordText
  matchType: string;
  bid: number;
  spend: number;
  sales: number;
}

interface SearchTerm {
  id: string;
  searchTerm: string;    // Renamed from query
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
}

interface Goal {
  id: string;
  name: string;
  targetAcos: number;
}

// --- MAIN COMPONENT ---

function StoreDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('id');

  // UI State
  const [activeTab, setActiveTab] = useState<'products' | 'campaigns' | 'adGroups' | 'targeting' | 'searchTerms' | 'goals'>('campaigns');
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('Loading...');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [targeting, setTargeting] = useState<Targeting[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (storeId) loadStoreData(storeId);
  }, [storeId]);

  // Update Handler
  const handleUpdate = async (collectionName: string, docId: string, field: string, value: any) => {
    try {
      // 1. Write to Firestore
      const ref = firestoreDoc(db, collectionName, docId);
      await updateDoc(ref, { [field]: value });

      // 2. Update Local State to reflect change immediately without reload
      if (collectionName === 'campaigns') {
        setCampaigns(prev => prev.map(item => item.id === docId ? { ...item, [field]: value } : item));
      } else if (collectionName === 'products') {
        setProducts(prev => prev.map(item => item.id === docId ? { ...item, [field]: value } : item));
      } else if (collectionName === 'ad_groups') {
        setAdGroups(prev => prev.map(item => item.id === docId ? { ...item, [field]: value } : item));
      } else if (collectionName === 'targeting') {
        setTargeting(prev => prev.map(item => item.id === docId ? { ...item, [field]: value } : item));
      } else if (collectionName === 'search_terms') {
        setSearchTerms(prev => prev.map(item => item.id === docId ? { ...item, [field]: value } : item));
      } else if (collectionName === 'goals') {
        setGoals(prev => prev.map(item => item.id === docId ? { ...item, [field]: value } : item));
      }

    } catch (e) {
      console.error("Update failed:", e);
      alert("Failed to update value.");
    }
  };

  const loadStoreData = async (id: string) => {
    setLoading(true);
    try {
      // 1. Store Info
      const storeSnap = await getDoc(doc(db, 'stores', id));
      if (storeSnap.exists()) setStoreName(storeSnap.data().name);

      // 2. Fetch All Collections in Parallel
      const [prodSnap, campSnap, agSnap, targetSnap, searchSnap, goalSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('storeId', '==', id))),
        getDocs(query(collection(db, 'campaigns'), where('storeId', '==', id))),
        getDocs(query(collection(db, 'ad_groups'), where('storeId', '==', id))),
        getDocs(query(collection(db, 'targeting'), where('storeId', '==', id))),
        getDocs(query(collection(db, 'search_terms'), where('storeId', '==', id))),
        getDocs(query(collection(db, 'goals'), where('storeId', '==', id)))
      ]);

      // 3. Map Data
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setCampaigns(campSnap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      setAdGroups(agSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdGroup)));
      setTargeting(targetSnap.docs.map(d => ({ id: d.id, ...d.data() } as Targeting)));
      setSearchTerms(searchSnap.docs.map(d => ({ id: d.id, ...d.data() } as SearchTerm)));
      setGoals(goalSnap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- COLUMN DEFINITIONS ---

  const campaignColumns: ColumnDef<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign Name',
      render: (r) => <EditableCell value={r.name} onSave={(val) => handleUpdate('campaigns', r.id, 'name', val)} />
    },
    { key: 'type', header: 'Type', width: '80px', render: r => <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{r.type}</span> },
    { key: 'status', header: 'Status', width: '100px', render: r => <span className={r.status === 'ENABLED' ? 'text-green-600 font-bold text-xs' : 'text-gray-400 text-xs'}>{r.status}</span> },
    {
      key: 'budget',
      header: 'Budget',
      width: '120px',
      render: r => <EditableCell value={r.budget} type="number" prefix="$" onSave={(val) => handleUpdate('campaigns', r.id, 'budget', Number(val))} />
    },
    { key: 'spend', header: 'Spend', width: '100px', align: 'right', render: r => <span>${r.spend?.toFixed(2)}</span> },
    { key: 'sales', header: 'Sales', width: '100px', align: 'right', render: r => <span>${r.sales?.toFixed(2)}</span> },
    { key: 'roas', header: 'ROAS', width: '80px', align: 'right', render: r => <span>{r.roas?.toFixed(2)}x</span> },
  ];

  const adGroupColumns: ColumnDef<AdGroup>[] = [
    {
      key: 'name',
      header: 'Ad Group Name',
      render: (r) => <EditableCell value={r.name} onSave={(val) => handleUpdate('ad_groups', r.id, 'name', val)} />
    },
    { key: 'campaignName', header: 'Campaign' },
    {
      key: 'defaultBid',
      header: 'Bid',
      width: '80px',
      render: r => <EditableCell value={r.defaultBid} type="number" prefix="$" onSave={(val) => handleUpdate('ad_groups', r.id, 'defaultBid', Number(val))} />
    },
    { key: 'impressions', header: 'Impr.', width: '80px', align: 'right', render: r => <span>{r.impressions}</span> },
    { key: 'spend', header: 'Spend', width: '100px', align: 'right', render: r => <span>${r.spend?.toFixed(2)}</span> },
    { key: 'acos', header: 'ACOS', width: '80px', align: 'right', render: r => <span>{r.acos?.toFixed(1)}%</span> },
  ];

  const targetingColumns: ColumnDef<Targeting>[] = [
    {
      key: 'targetingText',
      header: 'Keyword / Target',
      render: (r) => <EditableCell value={r.targetingText} onSave={(val) => handleUpdate('targeting', r.id, 'targetingText', val)} />
    },
    { key: 'matchType', header: 'Match', width: '100px', render: r => <span className="text-xs uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded">{r.matchType}</span> },
    {
      key: 'bid',
      header: 'Bid',
      width: '80px',
      render: r => <EditableCell value={r.bid} type="number" prefix="$" onSave={(val) => handleUpdate('targeting', r.id, 'bid', Number(val))} />
    },
    { key: 'spend', header: 'Spend', width: '100px', align: 'right', render: r => <span>${r.spend?.toFixed(2)}</span> },
    { key: 'sales', header: 'Sales', width: '100px', align: 'right', render: r => <span>${r.sales?.toFixed(2)}</span> },
  ];

  const searchTermsColumns: ColumnDef<SearchTerm>[] = [
    {
      key: 'searchTerm',
      header: 'Customer Search Term',
      render: (r) => <EditableCell value={r.searchTerm} onSave={(val) => handleUpdate('search_terms', r.id, 'searchTerm', val)} />
    },
    { key: 'impressions', header: 'Impr.', width: '80px', align: 'right', render: r => <span>{r.impressions}</span> },
    { key: 'clicks', header: 'Clicks', width: '80px', align: 'right', render: r => <span>{r.clicks}</span> },
    { key: 'sales', header: 'Sales', width: '100px', align: 'right', render: r => <span>${r.sales?.toFixed(2)}</span> },
  ];

  const goalColumns: ColumnDef<Goal>[] = [
    {
      key: 'name',
      header: 'Goal Name',
      render: (r) => <EditableCell value={r.name} onSave={(val) => handleUpdate('goals', r.id, 'name', val)} />
    },
    {
      key: 'targetAcos',
      header: 'Target ACOS',
      width: '120px',
      render: r => <EditableCell value={r.targetAcos} type="number" suffix="%" onSave={(val) => handleUpdate('goals', r.id, 'targetAcos', Number(val))} />
    },
    { key: 'id', header: 'Goal ID', width: '200px', render: r => <span className="text-xs text-gray-400">{r.id}</span> },
  ];

  const productColumns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: 'Product Name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <EditableCell value={r.img || ''} type="image" onSave={(val) => handleUpdate('products', r.id, 'img', val)} />
          <EditableCell value={r.name} onSave={(val) => handleUpdate('products', r.id, 'name', val)} />
        </div>
      )
    },
    { key: 'asin', header: 'ASIN', width: '150px' },
    {
      key: 'price',
      header: 'Price',
      width: '120px',
      render: (r) => <EditableCell value={r.price} type="number" prefix="$" onSave={(val) => handleUpdate('products', r.id, 'price', Number(val))} />
    },
  ];

  if (!storeId) return <div className="p-6">Invalid Store ID</div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          icon={<ArrowLeft size={16} />}
        >
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
          <p className="text-sm text-gray-500">Store ID: {storeId}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        <TabButton active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} icon={<Megaphone />} label={`Campaigns (${campaigns.length})`} />
        <TabButton active={activeTab === 'adGroups'} onClick={() => setActiveTab('adGroups')} icon={<Collection />} label={`Ad Groups (${adGroups.length})`} />
        <TabButton active={activeTab === 'targeting'} onClick={() => setActiveTab('targeting')} icon={<Bullseye />} label={`Targeting (${targeting.length})`} />
        <TabButton active={activeTab === 'searchTerms'} onClick={() => setActiveTab('searchTerms')} icon={<Search />} label={`Search Terms (${searchTerms.length})`} />
        <TabButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} icon={<Trophy />} label={`Goals (${goals.length})`} />
        <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<BoxSeam />} label={`Products (${products.length})`} />
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading data...</div>
        ) : (
          <>
            {activeTab === 'campaigns' && <DynamicTable<Campaign> data={campaigns} columns={campaignColumns} />}
            {activeTab === 'adGroups' && <DynamicTable<AdGroup> data={adGroups} columns={adGroupColumns} />}
            {activeTab === 'targeting' && <DynamicTable<Targeting> data={targeting} columns={targetingColumns} />}
            {activeTab === 'searchTerms' && <DynamicTable<SearchTerm> data={searchTerms} columns={searchTermsColumns} />}
            {activeTab === 'goals' && <DynamicTable<Goal> data={goals} columns={goalColumns} />}
            {activeTab === 'products' && <DynamicTable<Product> data={products} columns={productColumns} />}
          </>
        )}
      </div>

      {/* ADD THE NEW COMPONENT HERE */}
      <DataManagementCard storeId={storeId} onDataChange={() => loadStoreData(storeId)} />

    </div>
  );
}

// Helper for Tab Buttons to keep JSX clean
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
    >
      {icon} {label}
    </button>
  );
}

export default function StoreDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StoreDetailsContent />
    </Suspense>
  );
}