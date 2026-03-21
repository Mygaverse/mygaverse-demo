'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldLockFill, PersonBadge, BriefcaseFill, TagFill } from 'react-bootstrap-icons';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
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
    { id: 'Customer', label: 'Customer' },
    { id: 'Employee', label: 'Employee' },
    { id: 'Partner', label: 'Partner' },
    { id: 'Vendor', label: 'Vendor' }
];

const ROLE_OPTIONS = [
    { id: 'admin', label: 'Admin' },
    { id: 'manager', label: 'Manager' },
    { id: 'user', label: 'User' }
];

const STATUS_OPTIONS = [
    { id: 'approved', label: 'Active' },
    { id: 'pending', label: 'Pending' }
];

const ONBOARDING_OPTIONS = [
    { id: 'completed', label: 'Completed' },
    { id: 'incomplete', label: 'Incomplete' }
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
            const q = query(collection(db, "users"));
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

    useEffect(() => { loadUsers(); }, []);

    // Action Handlers
    const approveUser = async (uid: string) => {
        if (!confirm("Approve this user?")) return;
        try {
            await updateDoc(doc(db, "users", uid), { status: "approved" });
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: 'approved' } : u));
        } catch (e) { console.error(e); }
        loadUsers(); // Refresh
    };

    // Filtering Logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (user.email?.toLowerCase().includes(searchLower)) ||
                (user.name?.toLowerCase().includes(searchLower));
            if (!matchesSearch) return false;

            // Filters
            if (selectedRoles.length > 0 && !selectedRoles.includes(user.role || 'user')) return false;
            if (selectedStatus.length > 0 && !selectedStatus.includes(user.status || 'pending')) return false;

            if (selectedOnboarding.length > 0) {
                const status = user.onboarded ? 'completed' : 'incomplete';
                if (!selectedOnboarding.includes(status)) return false;
            }

            if (selectedCategories.length > 0) {
                // Handle users with no category (treat as 'Unassigned' or filter out if strictly filtering)
                if (!user.category && !selectedCategories.includes('Unassigned')) return false;
                if (user.category && !selectedCategories.includes(user.category)) return false;
            }

            return true;
        });
    }, [users, searchTerm, selectedRoles, selectedStatus, selectedOnboarding, selectedCategories]);

    // 4. Sorting Logic
    const sortedUsers = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return filteredUsers;

        return [...filteredUsers].sort((a: any, b: any) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Handle Timestamp objects specifically for createdAt
            if (sortConfig.key === 'createdAt') {
                valA = valA?.seconds || 0;
                valB = valB?.seconds || 0;
            }
            // Handle Strings (Case Insensitive)
            else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB ? valB.toLowerCase() : '';
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredUsers, sortConfig]);

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
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/bqool/im/user-details?uid=${row.id}`)}>Details</Button>
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isApproved
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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.onboarded
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                    {row.onboarded ? 'Completed' : 'Incomplete'}
                </span>
            )
        },
        {
            key: 'name',
            header: () => <ColumnSorter columnKey="name" label="Name" currentSort={sortConfig} onSort={(k, d) => setSortConfig({ key: k, direction: d })} />,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{row.name || '-'}</span>
                </div>
            )
        },
        {
            key: 'email',
            header: () => <ColumnSorter columnKey="email" label="Email" currentSort={sortConfig} onSort={(k, d) => setSortConfig({ key: k, direction: d })} />,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-gray-700">{row.email}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{row.id.substring(0, 8)}...</span>
                </div>
            )
        },
        {
            key: 'role',
            header: () => <ColumnSorter columnKey="role" label="Role" currentSort={sortConfig} onSort={(k, d) => setSortConfig({ key: k, direction: d })} />,
            width: '120px',
            render: (row) => {
                let icon = <PersonBadge />;
                let color = "text-gray-600 bg-gray-50";
                if (row.role === 'admin') { icon = <ShieldLockFill />; color = "text-purple-700 bg-purple-50 border-purple-200"; }
                if (row.role === 'manager') { icon = <BriefcaseFill />; color = "text-blue-700 bg-blue-50 border-blue-200"; }

                return (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border w-fit text-xs font-medium ${color}`}>
                        {icon} <span className="capitalize">{row.role || 'User'}</span>
                    </div>
                );
            }
        },
        {
            key: 'category',
            header: 'Category', // Can add sorting if needed
            width: '120px',
            render: (row) => (
                row.category ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                        {row.category}
                    </span>
                ) : <span className="text-gray-400 text-xs">-</span>
            )
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
            <div className="w-full max-w-[1600px] mx-auto p-6 gap-4 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500">Manage system access, roles, and onboarding status.</p>
                    </div>
                    <Button variant="outline" onClick={loadUsers}>Refresh Data</Button>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col gap-4">
                    {/* Top Row: Search + Major Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Left: Multiple Selectors (Filters) */}
                        <div className="flex flex-wrap gap-2 items-center relative z-100">
                            <div className="min-w-[150px]">
                                <MultipleSelector label="Roles" options={ROLE_OPTIONS} selectedIds={selectedRoles} onChange={setSelectedRoles} />
                            </div>
                            <div className="min-w-[150px]">
                                <MultipleSelector label="Categories" options={CATEGORY_OPTIONS} selectedIds={selectedCategories} onChange={setSelectedCategories} />
                            </div>
                            <div className="min-w-[130px]">
                                <MultipleSelector label="Status" options={STATUS_OPTIONS} selectedIds={selectedStatus} onChange={setSelectedStatus} />
                            </div>
                            <div className="min-w-[140px]">
                                <MultipleSelector label="Onboarding" options={ONBOARDING_OPTIONS} selectedIds={selectedOnboarding} onChange={setSelectedOnboarding} />
                            </div>
                        </div>

                        {/* Right: Search Input */}
                        <div className="flex-1 min-w-[200px] h-12">
                            <SearchInputGroup
                                placeholder="Search name or email..."
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                options={['Name/Email']} selectedOption="Name/Email" onOptionChange={() => { }}
                                className="h-full"
                            />
                        </div>

                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading users...</div>
                    ) : (
                        <DynamicTable data={sortedUsers} columns={columns} />
                    )}
                </div>

                <div className="text-right text-xs text-gray-400">
                    Showing {sortedUsers.length} of {users.length} users
                </div>

            </div>
        </AdminGuard>
    );
}
