'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { X, CheckCircleFill, ExclamationCircleFill } from 'react-bootstrap-icons';
import { db } from '@/lib/bqool/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/app/bqool/context/AuthContext';

// --- SUB-COMPONENTS (Defined below for single-file clarity, move to separate files in real project) ---
import { Step1Intro } from './steps/Step1Intro';
import { AmazonLoginSimulation } from './steps/AmazonLoginSimulation';
import { AmazonPermissionSimulation } from './steps/AmazonPermissionSimulation';
import { StoreSelector } from './steps/StoreConnection';
import { StoreConnectionStatus } from './steps/StoreConnectionStatus';
import { Step2Intro } from './steps/Step2Intro';
import { Step2ConnectSeller } from './steps/SellerConnection';
import { FinalLoading } from './steps/FinalLoading';

export function OnboardingWizard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  
  // WIZARD STATE MACHINE
  // 'intro' -> 'login_simulation' -> 'permission_simulation' -> 'store_select' -> 'seller_connect' -> 'final'
  const [step, setStep] = useState('intro'); 
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // 1. Fetch "Mock" Stores from Firestore (IM Data)
  useEffect(() => {
    const fetchStores = async () => {
        // In a real app, we might filter by the "owner's" stores. 
        // For demo, we fetch ALL active stores created in Admin Panel.
        const q = query(collection(db, 'stores'), where('status', '==', 'active'));
        const snap = await getDocs(q);
        setAvailableStores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchStores();
  }, []);

  // 2. Finalize Onboarding
  const handleFinish = async () => {
    if (user && selectedStoreIds.length > 0) {
        // Save the connection to the User Profile
        await updateDoc(doc(db, 'users', user.uid), {
            onboarded: true,
            connectedStoreIds: selectedStoreIds
        });
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* STEP 1: INTRO (Connect Ads Account) */}
      {step === 'intro' && (
        <Step1Intro onNext={() => setStep('login_simulation')} />
      )}

      {/* STEP 1.1: AMAZON LOGIN SIMULATION */}
      {step === 'login_simulation' && (
        <AmazonLoginSimulation 
            onLoginSuccess={() => setStep('permission_simulation')} 
            onCancel={() => setStep('intro')}
        />
      )}

      {/* STEP 1.2: PERMISSION SIMULATION */}
      {step === 'permission_simulation' && (
        <AmazonPermissionSimulation 
            onAllow={() => setStep('store_select')} 
            onCancel={() => setStep('intro')}
        />
      )}

      {/* STEP 1.3: STORE SELECTION */}
      {step === 'store_select' && (
        <StoreSelector 
            stores={availableStores}
            onConfirm={(ids: string[]) => {
                setSelectedStoreIds(ids);
                setStep('store_status'); // Go to Status Check
            }}
            onCancel={() => setStep('intro')}
        />
      )}

      {/* STEP 1.4 Store Status */}
      {step === 'store_status' && (
        <StoreConnectionStatus 
            selectedStores={availableStores.filter(s => selectedStoreIds.includes(s.id))}
            onConfirm={() => setStep('step2_intro')} 
        />
      )}

      {/* STEP 2: Intro (SELLER ACCOUNT) */}
      {step === 'step2_intro' && (
        <Step2Intro onNext={() => setStep('seller_connect')} />
      )}

      {/* STEP 2.1: CONNECT SELLER CENTRAL */}
      {step === 'seller_connect' && (
        <Step2ConnectSeller 
            selectedStores={availableStores.filter(s => selectedStoreIds.includes(s.id))}
            onNext={() => setStep('final')}
        />
      )}

      {/* STEP 3: FINAL LOADING */}
      {step === 'final' && (
        <FinalLoading onFinish={handleFinish} />
      )}

      {/* Update FinalLoading to use handleFinish */}
      {step === 'final' && <FinalLoading onFinish={handleFinish} />}
    </>
  );
}