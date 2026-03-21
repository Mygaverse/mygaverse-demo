'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { WrenchAdjustable, X, Check } from 'react-bootstrap-icons';
import { useRouter } from 'next/navigation';

export const DebugToolbar = () => {
  // 1. Only show in Development Mode
  const isDev = process.env.NODE_ENV === 'development';
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDev || !user) return null;

  const setOnboardingStatus = async (status: boolean) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        onboarded: status,
        // Optional: Clear connections if resetting
        ...(status === false ? { connectedStoreIds: [] } : {})
      });
      
      // Force reload to trigger the layout checks
      window.location.href = status ? '/bqool' : '/bqool/getting-started';
      
    } catch (e) {
      console.error("Debug Error:", e);
      alert("Failed to update status");
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-sans">
      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-transform hover:scale-105"
          title="Open Developer Tools"
        >
          <WrenchAdjustable />
        </button>
      )}

      {/* Expanded Menu */}
      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-2xl rounded-lg p-4 w-64 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dev Tools</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-2">Current User: {user.email}</p>
            
            <button
              onClick={() => setOnboardingStatus(false)}
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Reset to "New User"
            </button>

            <button
              onClick={() => setOnboardingStatus(true)}
              className="w-full text-left px-3 py-2 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded border border-green-100 flex items-center gap-2"
            >
              <Check className="text-lg -ml-1" />
              Set as "Onboarded"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};