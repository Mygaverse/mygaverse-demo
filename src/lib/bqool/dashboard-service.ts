import { db } from '@/lib/bqool/firebase';
import { collection, query, where, getDocs, getDoc, doc, limit } from 'firebase/firestore';

export interface CampaignData {
  id: string;
  name: string;
  type: string;
  status: string;
  marketplace?: string; // We might need to fetch this from the store or add it to campaign
  goal?: string; // Optional goal grouping
}

export const DashboardService = {
  // 1. Get the first active store (for the demo)
  getDefaultStore: async () => {
    const q = query(collection(db, 'stores'), where('status', '==', 'active'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  // 2. Fetch Campaigns for a specific store
  getCampaigns: async (storeId: string) => {
    const q = query(collection(db, 'campaigns'), where('storeId', '==', storeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CampaignData[];
  }
};