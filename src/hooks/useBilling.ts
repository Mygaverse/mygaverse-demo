'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/bqool/firebase';
import { useAuth, BillingData } from '../app/bqool/context/AuthContext';

const DEFAULT_BILLING_DATA: BillingData = {
    isSubscribed: false,
    subscriberStatus: 'active',
    trialDaysLeft: 16,
    subscriptionDate: null,
    activePlan: null,
    previousPlan: null,
    savedPaymentMethods: [],
};

export function useBilling() {
    const { user } = useAuth();
    const [billingData, setBillingData] = useState<BillingData>(DEFAULT_BILLING_DATA);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Initialize with user.billing if available, otherwise DEFAULT
        if (user.billing) {
            setBillingData(user.billing);
        }

        // Subscribe to Firestore changes for real-time updates
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                if (userData.billing) {
                    const billing = { ...userData.billing };
                    if (billing.subscriptionDate && typeof billing.subscriptionDate.toDate === 'function') {
                        billing.subscriptionDate = billing.subscriptionDate.toDate();
                    }
                    setBillingData(billing);
                } else {
                    // If no billing data in Firestore, initialize it
                    initializeBilling(user.uid);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const initializeBilling = async (uid: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                billing: DEFAULT_BILLING_DATA,
            });
        } catch (error) {
            console.error('Error initializing billing data:', error);
        }
    };

    const updateBilling = async (updates: Partial<BillingData>) => {
        if (!user) return;

        try {
            const newBillingData = { ...billingData, ...updates };
            await updateDoc(doc(db, 'users', user.uid), {
                billing: newBillingData,
            });
        } catch (error) {
            console.error('Error updating billing data:', error);
        }
    };

    const addPaymentMethod = async (method: any) => {
        if (!user) return;

        const newMethods = method.isDefault
            ? billingData.savedPaymentMethods.map(m => ({ ...m, isDefault: false })).concat(method)
            : [...billingData.savedPaymentMethods, method];

        await updateBilling({ savedPaymentMethods: newMethods });
    };

    const removePaymentMethod = async (methodId: string) => {
        if (!user) return;

        const newMethods = billingData.savedPaymentMethods.filter(m => m.id !== methodId);
        await updateBilling({ savedPaymentMethods: newMethods });
    };

    const resetToFreeTrial = async () => {
        if (!user) return;
        await updateBilling(DEFAULT_BILLING_DATA);
    };

    return {
        billingData,
        loading,
        updateBilling,
        addPaymentMethod,
        removePaymentMethod,
        resetToFreeTrial,
    };
}
