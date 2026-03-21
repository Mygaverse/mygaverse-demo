'use client';

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Person, Camera, ChevronRight } from 'react-bootstrap-icons';
import { NameEditorPopover } from '@/components/bqool/ui/NameEditorPopover';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
// Import custom selectors
import { SingleSelect } from '@/components/bqool/ui/SingleSelect';
import { StoreSelector } from '@/components/bqool/ui/StoreSelector';

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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth(); // Get authLoading
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Editor State
  // track which field is currently being edited: 'displayName' | 'phone' | null
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Modals State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Helper: Map marketplace string to 2-letter code for flags
  const getCountryCode = (mkt: string) => {
    if (!mkt) return 'us';
    const lower = mkt.toLowerCase();
    if (lower.includes('us') || lower === 'amazon.com') return 'us';
    if (lower.includes('ca') || lower === 'amazon.ca') return 'ca';
    if (lower.includes('mx') || lower === 'amazon.com.mx') return 'mx';
    if (lower.includes('uk') || lower === 'amazon.co.uk') return 'gb';
    if (lower.includes('de') || lower === 'amazon.de') return 'de';
    if (lower.includes('fr') || lower === 'amazon.fr') return 'fr';
    if (lower.includes('it') || lower === 'amazon.it') return 'it';
    if (lower.includes('es') || lower === 'amazon.es') return 'es';
    if (lower.includes('jp') || lower === 'amazon.co.jp') return 'jp';
    return 'us'; // default
  };

  // Load Data
  useEffect(() => {
    // 1. Wait for Auth to initialize
    if (authLoading) return;

    // 2. If Auth done but no user, redirect to login
    if (!user) {
        router.push('/login'); 
        return;
    }

    const fetchData = async () => {
      if (!user) return;
      try {
        // 3. Get User Profile
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
           setProfile({ id: userSnap.id, ...userSnap.data() });
        }

      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        // 5. Always stop loading
        setPageLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading, router]);

  // --- ACTIONS ---

  const handleUpdateField = async (field: string, value: string) => {
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', user.uid), { [field]: value });
        setProfile((prev: any) => ({ ...prev, [field]: value }));
        setActiveField(null); // Close editor on success
    } catch (e) {
        alert("Failed to update " + field);
    }
  };

  const handlePasswordReset = () => {
     // For demo purposes, we simulate a reset
     alert("Password reset email sent to " + user?.email);
     setIsPasswordModalOpen(false);
  };

  // Show loading only while fetching data
  if (authLoading || pageLoading) {
    return (
        <DashboardShell>
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        </DashboardShell>
    );
  }

  // Language Options
  const LANGUAGES = ['English (Default)', 'Español', '中文 (繁體)', 'Deutsch', 'Français'];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 w-full max-w-[1600px] mx-auto pb-10">
        
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* --- TOP SECTION: HEADER CARD --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center gap-6">
            {/* Avatar with Edit Overlay */}
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white">
                   {profile?.photoUrl ? (
                     <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <Person size={48} />
                   )}
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                </div>
                <div className="absolute bottom-0 right-0 bg-[#4aaada] p-1 rounded-full border-2 border-white">
                    <Camera className="text-white w-3 h-3" />
                </div>
            </div>

            {/* Basic Info */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.displayName || 'User'}</h1>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <p className="text-gray-400 text-xs mt-1 capitalize">{profile?.role || 'Owner'}</p>
            </div>
        </div>

        {/* --- BOTTOM SECTION: SETTINGS TABLE --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-8 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Profile Settings</h2>
            </div>
            
            {/* Table Grid Structure */}
            <div className="divide-y divide-[#e2e2e2] p-8 border border-gray-200">

                {/* Row 1: User Name (Editable) */}
                <ProfileRow label="User Name">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-900">{profile?.displayName || '-'}</span>
                    
                        <div className="relative ml-2">
                            <button 
                                onClick={() => setActiveField('displayName')}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Edit
                            </button>
                            
                            {/* CONDITIONAL RENDER OF EDITOR */}
                            {activeField === 'displayName' && (
                                <NameEditorPopover 
                                    initialName={profile?.displayName || ''} 
                                    onSave={(val) => handleUpdateField('displayName', val)}
                                    onCancel={() => setActiveField(null)}
                                    position={{ top: 25, left: 0 }} // Position relative to the Edit button wrapper
                                />
                            )}
                        </div>
                    </div>
                    
                </ProfileRow>

                {/* Row 2: User Role (Fixed) */}
                <ProfileRow label="User Role">
                    <span className="text-gray-900 capitalize">{profile?.role || 'User'}</span>
                </ProfileRow>

                {/* Row 3: Email (Fixed) */}
                <ProfileRow label="User Email">
                    <span className="text-gray-900">{user?.email}</span>
                </ProfileRow>

                {/* Row 4: Password (Modal Trigger) */}
                <ProfileRow label="Password">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-900">******</span>
                        <button 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2"
                        >
                            Edit
                        </button>
                    </div>
                    
                </ProfileRow>

                {/* Row 5: Mobile No (Editable) */}
                <ProfileRow label="Mobile No.">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-900">{profile?.phone || '-'}</span>
                    
                        <div className="relative ml-2">
                            <button 
                                onClick={() => setActiveField('phone')}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Edit
                            </button>

                            {/* CONDITIONAL RENDER OF EDITOR */}
                            {activeField === 'phone' && (
                                <NameEditorPopover 
                                    initialName={profile?.phone || ''} 
                                    onSave={(val) => handleUpdateField('phone', val)}
                                    onCancel={() => setActiveField(null)}
                                    position={{ top: 25, left: 0 }}
                                />
                            )}
                        </div>
                    </div>
                    
                </ProfileRow>

                {/* Row 6: Default Language (SingleSelect) */}
                <ProfileRow label="Default Language">
                    <div className="w-[250px] h-[42px] rounded-md">
                        <SingleSelect 
                            value={profile?.language || 'English (Default)'}
                            options={LANGUAGES}
                            onChange={(val) => handleUpdateField('language', val)}
                            width="w-full"
                        />
                    </div>
                </ProfileRow>

                {/* Row 7: Default Store (StoreSelector) */}
                <ProfileRow label="Default Store">
                    <div className="w-[250px] h-[42px] rounded-r-md border-r border-gray-300">
                         <StoreSelector
                            mode="single"
                            selectedStoreIds={profile?.defaultStoreId ? [profile.defaultStoreId] : []}
                            onSelect={(ids) => handleUpdateField('defaultStoreId', ids[0])}
                            showLabel={false}
                        />
                    </div>
                </ProfileRow>

            </div>
        </div>

        {/* --- MODALS --- */}
        
        {/* Password Modal */}
        <Modal 
            isOpen={isPasswordModalOpen} 
            onClose={() => setIsPasswordModalOpen(false)} 
            title="Change Password"
            width="max-w-md"
        >
            <div className="p-6">
                <p className="text-gray-600 text-sm mb-6">
                    To ensure security, we will send a password reset link to your email address: 
                    <span className="font-bold block mt-1">{user?.email}</span>
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                    <Button onClick={handlePasswordReset}>Send Reset Link</Button>
                </div>
            </div>
        </Modal>

        {/* Avatar Modal */}
        <Modal 
            isOpen={isAvatarModalOpen} 
            onClose={() => setIsAvatarModalOpen(false)} 
            title="Update Profile Photo"
            width="max-w-md"
        >
            <div className="p-6 text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                    <Camera size={32} />
                </div>
                <p className="text-sm text-gray-500 mb-6">Drag and drop an image here, or click to upload.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsAvatarModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => setIsAvatarModalOpen(false)}>Upload</Button>
                </div>
            </div>
        </Modal>

      </div>
    </DashboardShell>
  );
}

// --- Helper Component for Rows ---
function ProfileRow({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[240px_1fr] min-h-[64px]">
            {/* Label Column: Light Blue Background */}
            <div className="bg-[#f8fbff] border-r border-[#e2e2e2] px-6 flex items-center text-[14px] text-gray-700">
                {label}
            </div>
            
            {/* Value Column: White Background */}
            <div className="bg-white px-6 flex items-center text-[14px] py-3">
                {children}
            </div>
        </div>
    )
}