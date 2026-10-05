import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { FabricProduct, StoreSettings, InquiryRecord } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from '../data/initialData';

// -----------------------------------------------------
// TYPES & SYNC STATUS
// -----------------------------------------------------
export type SyncStatus = 'synced' | 'saving' | 'saved' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  message: string;
  lastUpdated?: string;
  source: 'firestore' | 'local_cache' | 'offline_fallback';
}

let currentSyncState: SyncState = {
  status: isFirebaseConfigured() ? 'saving' : 'offline',
  message: isFirebaseConfigured() ? 'Connecting to Firebase...' : 'Using Local Catalog (Firebase Not Configured)',
  source: isFirebaseConfigured() ? 'firestore' : 'offline_fallback',
  lastUpdated: new Date().toISOString()
};

const SYNC_STATUS_EVENT = 'asv_sync_status_change';
const DB_UPDATE_EVENT = 'asv_local_db_update';

function notifySyncStatus(state: Partial<SyncState>) {
  currentSyncState = {
    ...currentSyncState,
    ...state,
    lastUpdated: new Date().toISOString()
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: currentSyncState }));
  }
}

export function subscribeToSyncStatus(callback: (state: SyncState) => void): () => void {
  callback(currentSyncState);
  const handler = (e: Event) => {
    const custom = e as CustomEvent<SyncState>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener(SYNC_STATUS_EVENT, handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(SYNC_STATUS_EVENT, handler);
    }
  };
}

function notifyLocalListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_UPDATE_EVENT));
  }
}

export function normalizeImageUrl(url: any): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/pleasant-ankara/')) return '';
  if (trimmed.startsWith('/src/assets/')) {
    return trimmed.replace(/^\/src\/assets\//, '/assets/');
  }
  return trimmed;
}

// -----------------------------------------------------
// LOCAL CACHING (Read-Only Fallback - Never Overwrites Firestore)
// -----------------------------------------------------
const CACHE_KEY_PRODUCTS = 'asv_firestore_cache_products';
const CACHE_KEY_SETTINGS = 'asv_firestore_cache_settings';
const CACHE_KEY_INQUIRIES = 'asv_firestore_cache_inquiries';

function getCachedProducts(): FabricProduct[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const cached = localStorage.getItem(CACHE_KEY_PRODUCTS);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read cached products:', err);
  }
  return INITIAL_PRODUCTS;
}

function setCachedProducts(products: FabricProduct[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn('Failed to update local products cache:', err);
  }
}

// -----------------------------------------------------
// REAL-TIME PRODUCTS SUBSCRIPTION (Firestore Live onSnapshot)
// -----------------------------------------------------
export function subscribeToProducts(
  onUpdate: (products: FabricProduct[]) => void,
  onError?: (error: unknown) => void
): () => void {
  // Push initial cached data immediately for zero layout shift
  onUpdate(getCachedProducts());

  const db = getFirebaseDb();

  // If Firebase is not configured or available, fall back cleanly to local catalog
  if (!db) {
    notifySyncStatus({
      status: 'offline',
      message: 'Offline (Using Local Catalog)',
      source: 'offline_fallback'
    });

    const localUpdateHandler = () => {
      onUpdate(getCachedProducts());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(DB_UPDATE_EVENT, localUpdateHandler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(DB_UPDATE_EVENT, localUpdateHandler);
      }
    };
  }

  notifySyncStatus({
    status: 'saving',
    message: 'Listening for live catalog changes...',
    source: 'firestore'
  });

  const productsCollection = collection(db, 'products');

  let isFirstLoad = true;
  const unsubscribe: Unsubscribe = onSnapshot(
    productsCollection,
    (snapshot) => {
      // If Firestore collection has documents, Firestore is the absolute source of truth
      if (!snapshot.empty) {
        const liveProducts: FabricProduct[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const cleanDocId = docSnap.id;
          return {
            ...data,
            id: cleanDocId,
            image: normalizeImageUrl(data.image),
            galleryImages: Array.isArray(data.galleryImages)
              ? data.galleryImages.map((img: string) => normalizeImageUrl(img)).filter(Boolean)
              : data.image
              ? [normalizeImageUrl(data.image)]
              : []
          } as FabricProduct;
        });

        // Safely cache for offline usage only
        setCachedProducts(liveProducts);

        onUpdate(liveProducts);
        notifySyncStatus({
          status: 'synced',
          message: `Synced with Firebase (${liveProducts.length} items live)`,
          source: 'firestore'
        });
      } else {
        // Firestore is initialized but collection has no documents yet
        // Fall back to local catalog so user can seed or add products
        const fallback = getCachedProducts();
        onUpdate(fallback);
        notifySyncStatus({
          status: 'synced',
          message: 'Firestore empty. Ready to seed local catalog.',
          source: 'offline_fallback'
        });
      }
      isFirstLoad = false;
    },
    (error) => {
      console.error('[Firebase] Error in live products listener:', error);
      notifySyncStatus({
        status: 'error',
        message: `Sync Error: ${error.message || 'Connection failed'}. Using cached catalog.`,
        source: 'local_cache'
      });
      // Fallback to cache without breaking the UI
      onUpdate(getCachedProducts());
      if (onError) onError(error);
    }
  );

  return () => {
    unsubscribe();
  };
}

// -----------------------------------------------------
// CREATE / UPDATE PRODUCT IN FIRESTORE
// -----------------------------------------------------
export async function saveProductToDatabase(product: FabricProduct): Promise<void> {
  const cleanId = String(product.id || `prod-${Date.now()}`);
  const now = new Date().toISOString();

  const normalizedProduct: FabricProduct = {
    ...product,
    id: cleanId,
    image: normalizeImageUrl(product.image),
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.map(img => normalizeImageUrl(img)).filter(Boolean)
      : product.image ? [normalizeImageUrl(product.image)] : [],
    createdAt: product.createdAt || now,
    updatedAt: now
  };

  notifySyncStatus({
    status: 'saving',
    message: `Saving "${product.name}" to Firebase...`,
    source: 'firestore'
  });

  const db = getFirebaseDb();

  // If Firebase is available, save directly to Firestore
  if (db) {
    try {
      const docRef = doc(db, 'products', cleanId);
      // Remove any undefined properties to adhere to Firestore rules
      const cleanData = JSON.parse(JSON.stringify(normalizedProduct));
      await setDoc(docRef, cleanData, { merge: true });

      notifySyncStatus({
        status: 'saved',
        message: `Saved "${product.name}" to Firebase`,
        source: 'firestore'
      });

      // Update local cache
      const cached = getCachedProducts();
      const idx = cached.findIndex(p => p.id === cleanId);
      if (idx > -1) {
        cached[idx] = normalizedProduct;
      } else {
        cached.unshift(normalizedProduct);
      }
      setCachedProducts(cached);
      notifyLocalListeners();

      // Return status to synced after 2 seconds
      setTimeout(() => {
        notifySyncStatus({
          status: 'synced',
          message: 'Synced with Firebase',
          source: 'firestore'
        });
      }, 2000);
      return;
    } catch (err: any) {
      console.error('[Firebase] Failed to write product to Firestore:', err);
      notifySyncStatus({
        status: 'error',
        message: `Failed to save to Firebase: ${err.message || String(err)}`,
        source: 'firestore'
      });
      throw err;
    }
  }

  // Offline fallback if Firebase is not connected
  console.warn('[Firebase] Database not connected. Storing product in offline cache.');
  const cached = getCachedProducts();
  const idx = cached.findIndex(p => p.id === cleanId);
  if (idx > -1) {
    cached[idx] = normalizedProduct;
  } else {
    cached.unshift(normalizedProduct);
  }
  setCachedProducts(cached);
  notifyLocalListeners();
  notifySyncStatus({
    status: 'offline',
    message: 'Saved to local cache (Firebase Offline)',
    source: 'offline_fallback'
  });
}

// -----------------------------------------------------
// DELETE PRODUCT FROM FIRESTORE
// -----------------------------------------------------
export async function deleteProductFromDatabase(productId: string): Promise<void> {
  if (!productId) return;

  notifySyncStatus({
    status: 'saving',
    message: `Deleting product ${productId} from Firebase...`,
    source: 'firestore'
  });

  const db = getFirebaseDb();

  if (db) {
    try {
      const docRef = doc(db, 'products', productId);
      await deleteDoc(docRef);

      notifySyncStatus({
        status: 'saved',
        message: `Deleted product from Firebase`,
        source: 'firestore'
      });

      // Update local cache
      const cached = getCachedProducts().filter(p => p.id !== productId);
      setCachedProducts(cached);
      notifyLocalListeners();

      setTimeout(() => {
        notifySyncStatus({
          status: 'synced',
          message: 'Synced with Firebase',
          source: 'firestore'
        });
      }, 2000);
      return;
    } catch (err: any) {
      console.error('[Firebase] Failed to delete product from Firestore:', err);
      notifySyncStatus({
        status: 'error',
        message: `Failed to delete from Firebase: ${err.message || String(err)}`,
        source: 'firestore'
      });
      throw err;
    }
  }

  // Offline fallback
  const cached = getCachedProducts().filter(p => p.id !== productId);
  setCachedProducts(cached);
  notifyLocalListeners();
  notifySyncStatus({
    status: 'offline',
    message: 'Deleted from local cache (Firebase Offline)',
    source: 'offline_fallback'
  });
}

// -----------------------------------------------------
// SAFE SEED / SYNC LOCAL CATALOG TO FIRESTORE (Non-destructive)
// -----------------------------------------------------
export async function syncAllProductsToDatabase(products: FabricProduct[]): Promise<number> {
  const db = getFirebaseDb();
  if (!db) {
    setCachedProducts(products);
    notifyLocalListeners();
    return products.length;
  }

  notifySyncStatus({
    status: 'saving',
    message: `Syncing ${products.length} products to Firebase Firestore...`,
    source: 'firestore'
  });

  let syncedCount = 0;
  const now = new Date().toISOString();

  // Write in batches of up to 40 items to respect Firestore batch limit of 500 operations
  for (let i = 0; i < products.length; i += 40) {
    const chunk = products.slice(i, i + 40);
    const batch = writeBatch(db);

    for (const p of chunk) {
      const cleanId = String(p.id || `prod-${Date.now()}-${syncedCount}`);
      const docRef = doc(db, 'products', cleanId);
      const cleanData = JSON.parse(JSON.stringify({
        ...p,
        id: cleanId,
        image: normalizeImageUrl(p.image),
        galleryImages: Array.isArray(p.galleryImages)
          ? p.galleryImages.map(img => normalizeImageUrl(img)).filter(Boolean)
          : p.image ? [normalizeImageUrl(p.image)] : [],
        updatedAt: p.updatedAt || now,
        createdAt: p.createdAt || now
      }));
      batch.set(docRef, cleanData, { merge: true });
      syncedCount++;
    }

    await batch.commit();
  }

  setCachedProducts(products);
  notifyLocalListeners();
  notifySyncStatus({
    status: 'synced',
    message: `Successfully synced ${syncedCount} products to Firebase!`,
    source: 'firestore'
  });

  return syncedCount;
}

// Delete all products (Used by Admin reset)
export async function deleteAllProducts(): Promise<void> {
  const db = getFirebaseDb();
  if (db) {
    const snapshot = await getDocs(collection(db, 'products'));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  setCachedProducts([]);
  notifyLocalListeners();
  notifySyncStatus({
    status: 'synced',
    message: 'Catalog cleared',
    source: 'firestore'
  });
}

export async function removeAllProductImages(): Promise<number> {
  const current = getCachedProducts();
  const updated = current.map(p => ({
    ...p,
    image: '',
    galleryImages: []
  }));
  return syncAllProductsToDatabase(updated);
}

// -----------------------------------------------------
// STORE SETTINGS (Firestore Collection 'settings', doc 'store_settings')
// -----------------------------------------------------
export function subscribeToSettings(onUpdate: (settings: StoreSettings) => void): () => void {
  // Push cached settings first
  let cached = INITIAL_STORE_SETTINGS;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY_SETTINGS);
      if (stored) cached = JSON.parse(stored);
    } catch {}
  }
  onUpdate(cached);

  const db = getFirebaseDb();
  if (!db) {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(CACHE_KEY_SETTINGS);
        if (stored) onUpdate(JSON.parse(stored));
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(DB_UPDATE_EVENT, handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(DB_UPDATE_EVENT, handleUpdate);
      }
    };
  }

  const docRef = doc(db, 'settings', 'store_settings');
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const live = docSnap.data() as StoreSettings;
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(live));
      }
      onUpdate(live);
    }
  }, (err) => {
    console.warn('[Firebase] Settings listener notice:', err.message);
  });

  return () => unsubscribe();
}

export async function saveSettingsToDatabase(settings: StoreSettings): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(settings));
  }
  notifyLocalListeners();

  const db = getFirebaseDb();
  if (db) {
    try {
      const docRef = doc(db, 'settings', 'store_settings');
      const cleanData = JSON.parse(JSON.stringify(settings));
      await setDoc(docRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('[Firebase] Failed to write settings to Firestore:', err);
    }
  }
}

// -----------------------------------------------------
// INQUIRIES & ORDERS (Firestore Collection 'inquiries')
// -----------------------------------------------------
export function subscribeToInquiries(onUpdate: (inquiries: InquiryRecord[]) => void): () => void {
  let cached: InquiryRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY_INQUIRIES);
      if (stored) cached = JSON.parse(stored);
    } catch {}
  }
  onUpdate(cached);

  const db = getFirebaseDb();
  if (!db) {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(CACHE_KEY_INQUIRIES);
        if (stored) onUpdate(JSON.parse(stored));
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(DB_UPDATE_EVENT, handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(DB_UPDATE_EVENT, handleUpdate);
      }
    };
  }

  const inqCollection = collection(db, 'inquiries');
  const unsubscribe = onSnapshot(inqCollection, (snapshot) => {
    const list: InquiryRecord[] = snapshot.docs.map(d => ({
      ...d.data(),
      id: d.id
    } as InquiryRecord));

    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY_INQUIRIES, JSON.stringify(list));
    }
    onUpdate(list);
  }, (err) => {
    console.warn('[Firebase] Inquiries listener notice:', err.message);
  });

  return () => unsubscribe();
}

export async function saveInquiryToDatabase(inquiry: InquiryRecord): Promise<void> {
  const cleanId = inquiry.id || `INQ-${Date.now()}`;
  const now = new Date().toISOString();
  const normalized: InquiryRecord = {
    ...inquiry,
    id: cleanId,
    createdAt: inquiry.createdAt || now
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY_INQUIRIES);
      const list: InquiryRecord[] = stored ? JSON.parse(stored) : [];
      list.unshift(normalized);
      localStorage.setItem(CACHE_KEY_INQUIRIES, JSON.stringify(list));
    } catch {}
  }
  notifyLocalListeners();

  const db = getFirebaseDb();
  if (db) {
    try {
      const docRef = doc(db, 'inquiries', cleanId);
      const cleanData = JSON.parse(JSON.stringify(normalized));
      await setDoc(docRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('[Firebase] Failed to write inquiry to Firestore:', err);
    }
  }
}

export function subscribeToQuotaExceeded(cb: (isExceeded: boolean, link: string) => void) {
  cb(false, '');
  return () => {};
}
