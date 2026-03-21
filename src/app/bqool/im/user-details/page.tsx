'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Button } from '@/components/bqool/ui/Button';
import { AdminGuard } from '@/components/bqool/auth/AdminGuard';
import { ArrowLeft, ShieldLockFill, PersonBadge, ArrowCounterclockwise, Trash, BriefcaseFill, TagFill, Pencil } from 'react-bootstrap-icons';

// Simple Category Options (Match with List Page)
const CATEGORIES = ['Customer', 'Employee', 'Partner', 'Vendor'];

export default function UserDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uid = searchParams.get('uid');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit State for Name
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const fetchUser = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser({ id: docSnap.id, ...data });
        setNameInput(data.name || "");
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUser(); }, [uid]);

  // --- ACTIONS ---

  // 1. Update Name
  const handleSaveName = async () => {
     if(!user) return;
     setActionLoading(true);
     try {
        await updateDoc(doc(db, 'users', user.id), { name: nameInput });
        setUser({ ...user, name: nameInput });
        setIsEditingName(false);
     } catch (e) { alert("Failed to save name"); }
     finally { setActionLoading(false); }
  };

  // 2. Update Category
  const handleCategoryChange = async (newCat: string) => {
     if(!user) return;
     try {
        await updateDoc(doc(db, 'users', user.id), { category: newCat });
        setUser({ ...user, category: newCat });
     } catch (e) { alert("Failed to update category"); }
  };

  // 3. Role Management (Admin / Manager)
  const setRole = async (newRole: 'admin' | 'manager' | 'user') => {
     if(!user) return;
     if(!confirm(`Change role for ${user.email} to ${newRole.toUpperCase()}?`)) return;

     setActionLoading(true);
     try {
        await updateDoc(doc(db, 'users', user.id), { role: newRole });
        setUser({ ...user, role: newRole });
     } catch (e) { alert("Failed to update role"); }
     finally { setActionLoading(false); }
  };

  // 4. Reset Onboarding
  const resetOnboarding = async () => {
    if (!user || !confirm(`Reset onboarding for ${user.email}?`)) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), { onboarded: false, connectedStoreIds: [] });
      setUser({ ...user, onboarded: false, connectedStoreIds: [] });
      alert("Onboarding reset!");
    } catch (error) { alert("Failed to reset."); } 
    finally { setActionLoading(false); }
  };

  // 5. Delete User
  const handleDeleteUser = async () => {
    if (!user || !confirm(`DANGER: Permanently delete ${user.email}? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
        await deleteDoc(doc(db, 'users', user.id));
        alert("User deleted.");
        router.push('/im');
    } catch (error) { alert("Failed to delete user."); } 
    finally { setActionLoading(false); }
  };

  if (!uid) return <div className="p-6">Error: No User ID provided.</div>;

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft /> Back to List
        </button>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          {loading ? <div>Loading...</div> : user ? (
            <div className="space-y-8">
              
              {/* HEADER */}
              <div className="flex justify-between items-start border-b pb-6">
                <div className="flex-1">
                   {/* Name Editing */}
                   <div className="flex items-center gap-2 mb-1">
                      {isEditingName ? (
                         <div className="flex gap-2">
                            <input 
                               className="border border-gray-300 rounded px-2 py-1 text-xl font-bold text-gray-900" 
                               value={nameInput}
                               onChange={(e) => setNameInput(e.target.value)}
                            />
                            <Button size="sm" onClick={handleSaveName} disabled={actionLoading}>Save</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setIsEditingName(false); setNameInput(user.name || ""); }}>Cancel</Button>
                         </div>
                      ) : (
                         <>
                            <h1 className="text-2xl font-bold text-gray-900">{user.name || 'No Name Set'}</h1>
                            <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-[#4aaada]"><Pencil /></button>
                         </>
                      )}
                   </div>
                   <p className="text-gray-500 text-sm">{user.email}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                   {/* Status Badge */}
                   <span className={`px-3 py-1 rounded-full text-sm font-bold border ${user.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                      {user.status?.toUpperCase() || 'PENDING'}
                   </span>
                   {/* Category Select */}
                   <div className="flex items-center gap-2 mt-2">
                      <TagFill className="text-gray-400" size={12} />
                      <select 
                         className="text-xs border-none bg-gray-50 rounded px-2 py-1 text-gray-700 cursor-pointer hover:bg-gray-100 focus:ring-0"
                         value={user.category || ''}
                         onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                         <option value="" disabled>Select Label...</option>
                         {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                   </div>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Role Card */}
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
                   <div className="flex justify-between items-start mb-2">
                      <label className="text-xs uppercase text-gray-500 font-bold">Current Role</label>
                      {user.role === 'admin' && <ShieldLockFill className="text-purple-600" size={18} />}
                      {user.role === 'manager' && <BriefcaseFill className="text-blue-600" size={18} />}
                      {user.role === 'user' && <PersonBadge className="text-gray-500" size={18} />}
                   </div>
                   <div className="text-lg font-bold text-gray-900 capitalize mb-4">{user.role || 'User'}</div>
                   
                   <div className="flex flex-col gap-2">
                      {user.role !== 'admin' && (
                         <Button size="sm" variant="outline" onClick={() => setRole('admin')} disabled={actionLoading}>Promote to Admin</Button>
                      )}
                      {user.role !== 'manager' && (
                         <Button size="sm" variant="outline" onClick={() => setRole('manager')} disabled={actionLoading}>Promote to Manager</Button>
                      )}
                      {user.role !== 'user' && (
                         <Button size="sm" variant="outline" onClick={() => setRole('user')} disabled={actionLoading}>Demote to User</Button>
                      )}
                   </div>
                </div>

                {/* Onboarding Card */}
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
                   <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Onboarding</label>
                   <div className="mb-4">
                      {user.onboarded ? (
                         <span className="text-green-600 font-medium flex items-center gap-1">Completed</span>
                      ) : (
                         <span className="text-orange-500 font-medium flex items-center gap-1">Pending Setup</span>
                      )}
                   </div>
                   <Button 
                      className="w-full justify-center" 
                      variant="secondary" 
                      onClick={resetOnboarding} 
                      disabled={actionLoading}
                      icon={<ArrowCounterclockwise />}
                   >
                      Reset Flow
                   </Button>
                </div>

                {/* Meta Card */}
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-between">
                   <div>
                      <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Created At</label>
                      <div className="text-gray-900 mb-4">
                         {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                      <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">User ID</label>
                      <div className="text-xs text-gray-400 font-mono truncate" title={user.id}>{user.id}</div>
                   </div>
                </div>
              </div>

              {/* DANGER ZONE */}
              <div className="pt-6 border-t mt-6">
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                   <div>
                      <div className="font-bold text-red-800">Delete User Account</div>
                      <div className="text-sm text-red-600">Permanently remove this user and all associated data.</div>
                   </div>
                   <Button variant="danger" onClick={handleDeleteUser} disabled={actionLoading} icon={<Trash />}>
                      Delete User
                   </Button>
                </div>
              </div>

            </div>
          ) : <div>User not found.</div>}
        </div>
      </div>
    </AdminGuard>
  );
}