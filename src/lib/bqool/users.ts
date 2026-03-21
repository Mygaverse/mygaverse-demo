// handle user updates.

import { db } from '@/lib/bqool/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const UserService = {
  getAll: async () => {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  },

  resetOnboarding: async (uid: string) => {
    await updateDoc(doc(db, 'users', uid), {
        onboarded: false,
        connectedStoreIds: [] // Clear their connections too
    });
  }
};