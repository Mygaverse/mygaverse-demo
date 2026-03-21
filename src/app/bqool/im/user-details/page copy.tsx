'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Button } from '@/components/bqool/ui/Button';
import { AdminGuard } from '@/components/bqool/auth/AdminGuard';
import { ArrowLeft, ShieldLockFill, PersonBadge, ArrowCounterclockwise, Trash } from 'react-bootstrap-icons';

export default function UserDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uid = searchParams.get('uid'); // Get UID from URL

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch User Data
  const fetchUser = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [uid]);

  // 2. Handle Admin Toggle
  const toggleAdminRole = async () => {
    if (!user) return;

    const isCurrentlyAdmin = user.role === 'admin';
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    const actionName = isCurrentlyAdmin ? 'Revoke Admin' : 'Promote to Admin';

    if (!confirm(`Are you sure you want to ${actionName} access for ${user.email}?`)) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole
      });
      // Refresh local state to show changes immediately
      setUser({ ...user, role: newRole });
      alert(`Success! User is now a ${newRole}.`);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role.");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Reset Onboarding Logic
  const resetOnboarding = async () => {
    if (!user) return;
    if (!confirm(`Reset onboarding for ${user.email}? Next time they login, they will see the setup wizard.`)) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        onboarded: false,         // Trigger Wizard
        connectedStoreIds: []     // Optional: Clear their "real" connections
      });
      setUser({ ...user, onboarded: false, connectedStoreIds: [] });
      alert("Onboarding flow has been reset!");
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      alert("Failed to reset.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- NEW: DELETE USER LOGIC ---
  const handleDeleteUser = async () => {
    if (!user) return;
    
    const confirmMsg = `DANGER: Are you sure you want to delete ${user.email}?\n\nThis will remove their profile and all data access from this dashboard. This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    // Double confirmation for safety
    if (!confirm("Are you absolutely sure?")) return;

    setActionLoading(true);
    try {
        // 1. Delete the Firestore User Document
        await deleteDoc(doc(db, 'users', user.id));
        
        alert("User profile deleted successfully.");
        // 2. Redirect back to list
        router.push('/im');
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user profile.");
    } finally {
        setActionLoading(false);
    }
  };

  if (!uid) return <div className="p-6">Error: No User ID provided.</div>;

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft /> Back to List
        </button>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          {loading ? (
            <div>Loading details...</div>
          ) : user ? (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">User Details</h1>
                  <p className="text-gray-500">Managing account for {user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                        user.status === 'approved' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                    }`}>
                        {user.status?.toUpperCase() || 'PENDING'}
                    </span>
                    <span className="text-xs text-gray-400">UID: {user.id}</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Role</label>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                        {user.role === 'admin' ? <ShieldLockFill className="text-purple-600"/> : <PersonBadge className="text-gray-500"/>}
                        <span className="capitalize">{user.role || 'User'}</span>
                    </div>
                </div>

                <div className="p-4 bg-gray-100 rounded-lg">
                    <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Onboarding Status</label>
                    <div className="font-medium text-gray-900">
                        {user.onboarded ? (
                            <span className="text-green-600 flex items-center gap-1">Completed</span>
                        ) : (
                            <span className="text-orange-500 flex items-center gap-1">Pending Setup</span>
                        )}
                    </div>
                </div>
                
                <div className="p-4 bg-gray-100 rounded-lg">
                    <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Created At</label>
                    <div className="font-medium text-gray-900">
                        {user.createdAt?.seconds 
                            ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() 
                            : 'N/A'}
                    </div>
                </div>
              </div>

              {/* DANGER ZONE / ACTIONS */}
              <div className="pt-6 border-t">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Permissions & Security</h3>
                
                <div className="flex flex-col md:flex-row gap-4">
                  
                  {/* CARD 1: Admin Access */}
                  <div className="flex-1 flex flex-col justify-between p-4 border border-gray-200 rounded-lg bg-white">
                    <div>
                      <div className="font-medium text-gray-900">Administrator Access</div>
                      <div className="text-sm text-gray-500 mt-1">
                          {user.role === 'admin' 
                              ? "This user has full access to the Admin Panel." 
                              : "This user only has access to the standard Dashboard."}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-0 border-gray-100">
                      <Button 
                          className="w-full justify-center"
                          variant={user.role === 'admin' ? "danger" : "primary"}
                          disabled={actionLoading}
                          onClick={toggleAdminRole}
                      >
                          {user.role === 'admin' ? 'Revoke Admin Access' : 'Promote to Admin'}
                      </Button>        
                    </div>
                  </div>

                  {/* CARD 2: Onboarding Status */}
                  <div className="flex-1 flex flex-col justify-between p-4 border border-gray-200 rounded-lg bg-[#f1f7ff]">
                    <div>
                        <div className="font-medium text-gray-900">Onboarding Status</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Force the "Getting Started" wizard to reappear for this user on their next login.
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-0 border-gray-200/50">
                      <Button 
                          className="w-full justify-center flex items-center gap-2"
                          variant="secondary"
                          disabled={actionLoading}
                          onClick={resetOnboarding}
                          icon={<ArrowCounterclockwise />}
                      >
                        Reset Flow
                      </Button>
                    </div>
                    
                  </div>

                  {/* Card 3. DELETE USER */}
                  <div className="flex-1 flex flex-col justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div>
                          <div className="font-bold text-red-700">Delete User</div>
                          <div className="text-sm text-red-600">
                              Permanently remove this user profile and disconnect their data.
                          </div>
                      </div>
                      <Button
                          variant="danger"
                          disabled={actionLoading}
                          onClick={handleDeleteUser}
                          icon={<Trash />}
                      >
                        Delete User
                      </Button>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div>User not found.</div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}