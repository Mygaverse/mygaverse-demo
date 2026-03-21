'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldLockFill, PersonBadge, BriefcaseFill, TagFill } from 'react-bootstrap-icons';
import { collection, query, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { DynamicTable, ColumnDef } from '@/components/bqool/tables/DynamicTable';
import { Button } from '@/components/bqool/ui/Button'; // Reuse your Button!
import { AdminGuard } from '@/components/bqool/auth/AdminGuard';
import { SearchInputGroup } from '@/components/bqool/ui/SearchInputGroup';
import { MultipleSelector } from '@/components/bqool/ui/MultipleSelector';
import { ColumnSorter, SortDirection } from '@/components/bqool/ui/ColumnSorter';


interface UserData {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  category?: string;
  date: string;
  createdAt: any;
  onboarded?: boolean;
}

// --- CONSTANTS ---
const CATEGORY_OPTIONS = [
  { id: 'Customer', name: 'Customer' },
  { id: 'Employee', name: 'Employee' },
  { id: 'Partner', name: 'Partner' },
  { id: 'Vendor', name: 'Vendor' }
];

const ROLE_OPTIONS = [
  { id: 'admin', name: 'Admin' },
  { id: 'manager', name: 'Manager' },
  { id: 'user', name: 'User' }
];

const STATUS_OPTIONS = [
  { id: 'approved', name: 'Active' },
  { id: 'pending', name: 'Pending' }
];

const ONBOARDING_OPTIONS = [
  { id: 'completed', name: 'Completed' },
  { id: 'incomplete', name: 'Incomplete' }
];

export default function AdminDashboard() {
  const router = useRouter();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedOnboarding, setSelectedOnboarding] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // --- SORT STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ 
    key: 'createdAt', direction: 'desc' 
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(userData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (uid: string) => {
    if(!confirm("Approve this user?")) return;
    await updateDoc(doc(db, "users", uid), { status: "approved" });
    loadUsers(); // Refresh
  };

  // Helper function to format Firestore Timestamps
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    // Handle Firestore Timestamp (has .seconds)
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    // Handle standard Date objects or strings
    return new Date(timestamp).toLocaleDateString();
  };

  useEffect(() => {
    loadUsers();
    
  }, []);

  // Define Columns using your existing Table system
  const columns: ColumnDef<UserData>[] = [
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '120px',
      render: (row) => (
        <div className="flex justify-center gap-2">
           {row.status !== 'approved' && (
             <Button size="sm" onClick={() => approveUser(row.id)}>Approve</Button>
           )}
           <Button size="sm" variant="secondary" onClick={() => router.push(`/im/user-details?uid=${row.id}`)}>Details</Button>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      render: (row) => {
        // Replaced Badge with simple Tailwind span since Badge has no variant
        const isApproved = row.status === 'approved';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isApproved 
              ? 'bg-blue-50 text-blue-600 border-blue-100' 
              : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {isApproved ? 'Active' : 'Pending'}
          </span>
        );
      }
    },
    {
      key: 'onboarded',
      header: 'Onboarding',
      align: 'center',
      width: '120px',
      render: (row) => (
         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            row.onboarded 
              ? 'bg-green-50 text-green-600 border-green-100' 
              : 'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
            {row.onboarded ? 'Completed' : 'Incomplete'}
          </span>
      )
    },
    {
      key: 'email',
      header: 'User Email',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.email}</span>
          <span className="text-xs text-gray-400">{row.id}</span>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      width: '100px',
      render: (row) => <span className="capitalize text-gray-600">{row.role || 'User'}</span>
    },
    {
      key: 'createdAt',
      header: 'Date Created',
      width: '150px',
      render: (row) => <span className="capitalize text-gray-600">{formatDate(row.createdAt) || 'Date Created'}</span>
    },
    
  ];

  return (
    <AdminGuard>
      <div className="w-full max-w-[1600px] mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account - User Management</h1>
          <Button variant="outline" onClick={loadUsers}>Refresh</Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : (
             <DynamicTable data={users} columns={columns} />
          )}
        </div>
      </div>
    </AdminGuard>
  );
}