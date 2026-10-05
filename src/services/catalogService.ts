import { FabricProduct, StoreSettings, InquiryRecord } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from '../data/initialData';

// Persistent local/cloud database synchronization service
export const auth = {
  currentUser: null
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Custom Event dispatcher to sync live subscriptions across components in real-time
const DB_UPDATE_EVENT = 'asv_local_db_update';
function notifyListeners() {
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
// PRODUCTS STORAGE & REAL-TIME SUBSCRIPTION
// -----------------------------------------------------
const PRODUCTS_KEY = 'asv_products_v6_cleared';

function loadProductsFromStorage(): FabricProduct[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load local products:', e);
  }
  // Initialize with initial products
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  }
  return INITIAL_PRODUCTS;
}

export function subscribeToProducts(
  onUpdate: (products: FabricProduct[]) => void,
  _onError?: (error: unknown) => void
) {
  // Push initial data
  onUpdate(loadProductsFromStorage());

  const handleUpdate = () => {
    onUpdate(loadProductsFromStorage());
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

export async function saveProductToDatabase(product: FabricProduct) {
  const current = loadProductsFromStorage();
  const cleanId = String(product.id || `prod-${Date.now()}`);
  const normalized = {
    ...product,
    id: cleanId,
    image: normalizeImageUrl(product.image),
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.map(img => normalizeImageUrl(img)).filter(Boolean)
      : product.image ? [normalizeImageUrl(product.image)] : []
  };

  const index = current.findIndex(p => p.id === cleanId);
  if (index >= 0) {
    current[index] = normalized;
  } else {
    current.push(normalized);
  }

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(current));
  notifyListeners();
}

export async function deleteProductFromDatabase(productId: string) {
  if (!productId) return;
  const current = loadProductsFromStorage();
  const filtered = current.filter(p => p.id !== productId);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
  notifyListeners();
}

export async function syncAllProductsToDatabase(products: FabricProduct[]): Promise<number> {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  notifyListeners();
  return products.length;
}

export async function removeAllProductImages(): Promise<number> {
  const current = loadProductsFromStorage();
  const updated = current.map(p => ({
    ...p,
    image: '',
    galleryImages: []
  }));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('asv_products_v5_real_imported_media', JSON.stringify(updated));
    } catch {}
  }
  notifyListeners();
  return updated.length;
}

export async function deleteAllProducts(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRODUCTS_KEY, '[]');
      localStorage.setItem('asv_products_v6_cleared', '[]');
      localStorage.setItem('asv_products_v5_real_imported_media', '[]');
      localStorage.setItem('asv_products_offline', '[]');
    } catch {}
  }
  notifyListeners();
}

// -----------------------------------------------------
// SETTINGS STORAGE & REAL-TIME SUBSCRIPTION
// -----------------------------------------------------
const SETTINGS_KEY = 'asv_settings_offline';

function loadSettingsFromStorage(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_STORE_SETTINGS));
  return INITIAL_STORE_SETTINGS;
}

export function subscribeToSettings(onUpdate: (settings: StoreSettings) => void) {
  onUpdate(loadSettingsFromStorage());

  const handleUpdate = () => {
    onUpdate(loadSettingsFromStorage());
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

export async function saveSettingsToDatabase(settings: StoreSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  notifyListeners();
}

// -----------------------------------------------------
// INQUIRIES STORAGE & REAL-TIME SUBSCRIPTION
// -----------------------------------------------------
const INQUIRIES_KEY = 'asv_inquiries_offline';

function loadInquiriesFromStorage(): InquiryRecord[] {
  try {
    const data = localStorage.getItem(INQUIRIES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

export function subscribeToInquiries(onUpdate: (inquiries: InquiryRecord[]) => void) {
  onUpdate(loadInquiriesFromStorage());

  const handleUpdate = () => {
    onUpdate(loadInquiriesFromStorage());
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

export async function saveInquiryToDatabase(inquiry: InquiryRecord) {
  const current = loadInquiriesFromStorage();
  current.push(inquiry);
  current.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(current));
  notifyListeners();
}

// Quota Exceeded Subscription (always false since we are completely local)
export function subscribeToQuotaExceeded(cb: (isExceeded: boolean, link: string) => void) {
  cb(false, '');
  return () => {};
}
