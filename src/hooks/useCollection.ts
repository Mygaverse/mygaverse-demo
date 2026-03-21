import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase'; // Your initialized firebase file

export const useAdCampaigns = (statusFilter?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'campaigns'));
    
    if (statusFilter) {
      q = query(q, where('status', '==', statusFilter));
    }

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(docs);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [statusFilter]);

  return { data, loading };
};