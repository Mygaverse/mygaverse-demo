'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/bqool/firebase';
import router from 'next/dist/shared/lib/router/router';
//import { useRouter } from 'next/navigation';

// 2. Define a Custom User Type that includes 'role'
export interface BillingData {
  isSubscribed: boolean;
  subscriberStatus: 'active' | 'cancel' | 'switch' | 'overdue' | 'suspended';
  trialDaysLeft: number | 'canceled';
  subscriptionDate: any | null;
  activePlan: {
    name: string;
    amount: number;
    billingCycle: string;
    overage: string;
    overageFee: number;
    nextPaymentDate?: string;
  } | null;
  previousPlan: any | null;
  savedPaymentMethods: any[];
}

export interface AppUser extends User {
  role?: string;
  status?: string;
  category?: string;
  onboarded?: boolean;
  displayName: string | null;
  billing?: BillingData;
}

type AuthContextType = {
  user: AppUser | null; // 3. Use AppUser instead of User
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  //const router = useRouter();

  useEffect(() => {
    // 2. Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userData = userDoc.data();
            
            // We check if role is 'admin' to give them a "VIP Pass"
            const isApproved = userData?.status === 'approved';
            const isAdmin = userData?.role === 'admin';

            if (!isApproved && !isAdmin) {
               console.warn("User is not approved and not admin. Redirecting...");
               window.location.href = "/bqool/login"; 
               return;
            }
            
            // Should also attach role to the state here if you want to use it later
            setUser({ ...currentUser, 
                      role: userData?.role, 
                      status: userData?.status 
            } as AppUser);

        } catch (e) {
            console.error("Error verifying user status", e);
        }
      } else {
        // ... existing logout logic
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);