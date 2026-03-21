import { db } from '@/lib/bqool/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
        query, where, Timestamp, writeBatch } from 'firebase/firestore';

export interface StoreData {
  id: string;
  name: string;
  marketplace: string;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: any;
  [key: string]: any;
}

const COLLECTION = 'stores';

// Helper to batch delete by query
const batchDeleteByQuery = async (batch: any, collectionName: string, storeId: string) => {
    const q = query(collection(db, collectionName), where('storeId', '==', storeId));
    const snap = await getDocs(q);
    snap.forEach((doc) => batch.delete(doc.ref));
};

export const StoreService = {
  // 1. Get all stores
  getAll: async () => {
    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreData));
  },

  // 2. Create a new store
  create: async (data: Omit<StoreData, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: Timestamp.now()
    });
  },

  // 3. Update store
  update: async (id: string, data: Partial<StoreData>) => {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, data);
  },

  // 4. ROBUST DELETE (Removes ALL related data)
  deleteStore: async (storeId: string) => {
    const batch = writeBatch(db);

    console.log(`Deleting store ${storeId} and all child data...`);

    // Step A: Delete All Child Collections
    await batchDeleteByQuery(batch, 'search_terms', storeId);
    await batchDeleteByQuery(batch, 'targeting', storeId);
    await batchDeleteByQuery(batch, 'product_ads', storeId);
    await batchDeleteByQuery(batch, 'ad_groups', storeId);
    await batchDeleteByQuery(batch, 'campaigns', storeId);
    await batchDeleteByQuery(batch, 'goals', storeId);
    await batchDeleteByQuery(batch, 'products', storeId);

    // Step B: Delete the Store itself
    batch.delete(doc(db, COLLECTION, storeId));

    await batch.commit();
  },

  // 5. TOGGLE STATUS
  toggleStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { status: newStatus });
    return newStatus;
  },
};