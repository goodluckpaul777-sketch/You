import { FabricProduct, StoreSettings, InquiryRecord } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from '../data/initialData';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  uploadImageToSupabaseStorage,
  getSupabaseConfig,
  saveSupabaseConfig
} from './supabase';

// Re-export Supabase helpers for AdminPortal
export { isSupabaseConfigured, getSupabaseConfig, saveSupabaseConfig, uploadImageToSupabaseStorage };

// -----------------------------------------------------
// TYPES & SYNC STATUS
// -----------------------------------------------------
export type SyncStatus = 'synced' | 'saving' | 'saved' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  message: string;
  lastUpdated?: string;
  source: 'supabase' | 'local_cache' | 'offline_fallback';
}

let currentSyncState: SyncState = {
  status: isSupabaseConfigured() ? 'saving' : 'offline',
  message: isSupabaseConfigured() ? 'Connecting to Supabase...' : 'Using Local Catalog (Supabase Not Configured)',
  source: isSupabaseConfigured() ? 'supabase' : 'offline_fallback',
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
// ROW MAPPERS (PostgreSQL snake_case & camelCase compatible)
// -----------------------------------------------------
export function mapRowToProduct(row: any): FabricProduct {
  const image = normalizeImageUrl(row.image_url || row.image || '');
  let gallery: string[] = [];

  if (Array.isArray(row.gallery_images)) {
    gallery = row.gallery_images.map(normalizeImageUrl).filter(Boolean);
  } else if (Array.isArray(row.galleryImages)) {
    gallery = row.galleryImages.map(normalizeImageUrl).filter(Boolean);
  } else if (typeof row.gallery_images === 'string') {
    try {
      const parsed = JSON.parse(row.gallery_images);
      if (Array.isArray(parsed)) gallery = parsed.map(normalizeImageUrl).filter(Boolean);
    } catch {}
  }

  if (gallery.length === 0 && image) {
    gallery = [image];
  }

  let colors: string[] = ['Standard Original'];
  if (Array.isArray(row.colors)) {
    colors = row.colors;
  } else if (typeof row.colors === 'string') {
    try {
      const parsed = JSON.parse(row.colors);
      if (Array.isArray(parsed)) colors = parsed;
    } catch {
      colors = [row.colors];
    }
  }

  let suitableFor: string[] = ['Retail & Wholesale'];
  if (Array.isArray(row.suitable_for)) {
    suitableFor = row.suitable_for;
  } else if (Array.isArray(row.suitableFor)) {
    suitableFor = row.suitableFor;
  }

  return {
    id: String(row.id),
    name: row.name || 'Untitled Product',
    mainSection: row.main_section || row.mainSection || 'cloths',
    category: row.category || '',
    categorySlug: row.category_slug || row.categorySlug || 'general',
    description: row.description || '',
    availableStock: row.available_stock ?? row.availableStock ?? row.stock ?? 50,
    minimumOrder: row.minimum_order ?? row.minimumOrder ?? 1,
    unitLabel: row.unit_label || row.unitLabel || '',
    image,
    galleryImages: gallery,
    colors,
    fabricType: row.fabric_type || row.fabricType || '',
    isNewArrival: row.is_new_arrival ?? row.isNewArrival ?? true,
    isFeatured: row.is_featured ?? row.isFeatured ?? true,
    isBestseller: row.is_bestseller ?? row.isBestseller ?? false,
    inStock: row.in_stock ?? row.inStock ?? row.availability ?? true,
    rating: Number(row.rating ?? 4.9),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 20),
    suitableFor,
    textureNote: row.texture_note || row.textureNote || '',
    origin: row.origin || 'Lagos, Nigeria',
    isWholesaleAvailable: row.is_wholesale_available ?? row.isWholesaleAvailable ?? true,
    wholesaleNote: row.wholesale_note || row.wholesaleNote || 'Contact on WhatsApp for wholesale cartons & bundle rates.',
    badge: row.badge || '',
    productCode: row.product_code || row.productCode || '',
    designGroupId: row.design_group_id || row.designGroupId || undefined,
    designGroupName: row.design_group_name || row.designGroupName || undefined,
    colorVariant: row.color_variant || row.colorVariant || undefined,
    isMatchingSet: row.is_matching_set ?? row.isMatchingSet ?? false,
    designType: row.design_type || row.designType || undefined,
    pricePerYard: Number(row.price_per_yard ?? row.pricePerYard ?? row.price ?? 0),
    price: Number(row.price ?? row.price_per_yard ?? row.pricePerYard ?? 0),
    createdAt: row.created_at || row.createdAt || undefined,
    updatedAt: row.updated_at || row.updatedAt || undefined
  };
}

export function mapProductToRow(p: FabricProduct): Record<string, any> {
  const now = new Date().toISOString();
  return {
    id: String(p.id),
    name: p.name || 'Untitled Product',
    main_section: p.mainSection || 'cloths',
    category: p.category || '',
    category_slug: p.categorySlug || 'general',
    description: p.description || '',
    available_stock: Number(p.availableStock ?? 50),
    minimum_order: Number(p.minimumOrder ?? 1),
    unit_label: p.unitLabel || '',
    image: normalizeImageUrl(p.image || ''),
    image_url: normalizeImageUrl(p.image || ''),
    gallery_images: Array.isArray(p.galleryImages)
      ? p.galleryImages.map(normalizeImageUrl).filter(Boolean)
      : p.image ? [normalizeImageUrl(p.image)] : [],
    colors: Array.isArray(p.colors) ? p.colors : ['Standard Original'],
    fabric_type: p.fabricType || '',
    is_new_arrival: !!p.isNewArrival,
    is_featured: !!p.isFeatured,
    is_bestseller: !!p.isBestseller,
    in_stock: p.inStock !== false,
    rating: Number(p.rating ?? 4.9),
    review_count: Number(p.reviewCount ?? 20),
    suitable_for: Array.isArray(p.suitableFor) ? p.suitableFor : ['Retail & Wholesale'],
    texture_note: p.textureNote || '',
    origin: p.origin || 'Lagos, Nigeria',
    is_wholesale_available: p.isWholesaleAvailable !== false,
    wholesale_note: p.wholesaleNote || '',
    badge: p.badge || '',
    product_code: p.productCode || '',
    design_group_id: p.designGroupId || null,
    design_group_name: p.designGroupName || null,
    color_variant: p.colorVariant || null,
    is_matching_set: !!p.isMatchingSet,
    design_type: p.designType || null,
    price_per_yard: Number(p.pricePerYard ?? p.price ?? 0),
    price: Number(p.price ?? p.pricePerYard ?? 0),
    created_at: p.createdAt || now,
    updated_at: now
  };
}

// -----------------------------------------------------
// LOCAL CACHING (Read-Only Fallback - Never Overwrites Supabase)
// -----------------------------------------------------
const CACHE_KEY_PRODUCTS = 'asv_supabase_cache_products';
const CACHE_KEY_SETTINGS = 'asv_supabase_cache_settings';
const CACHE_KEY_INQUIRIES = 'asv_supabase_cache_inquiries';

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
// REAL-TIME PRODUCTS SUBSCRIPTION (Supabase Live Realtime)
// -----------------------------------------------------
export function subscribeToProducts(
  onUpdate: (products: FabricProduct[]) => void,
  onError?: (error: unknown) => void
): () => void {
  // Push initial cached data immediately for zero layout shift
  onUpdate(getCachedProducts());

  const supabase = getSupabaseClient();

  // If Supabase is not configured, fall back cleanly to local catalog
  if (!supabase) {
    notifySyncStatus({
      status: 'offline',
      message: 'Offline (Using Local Catalog - Supabase Not Configured)',
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
    message: 'Connecting to Supabase...',
    source: 'supabase'
  });

  let isCancelled = false;

  // Helper function to fetch full product list from Supabase
  const fetchLiveProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (isCancelled) return;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const liveProducts = data.map(mapRowToProduct);
        setCachedProducts(liveProducts);
        onUpdate(liveProducts);
        notifySyncStatus({
          status: 'synced',
          message: `Synced with Supabase (${liveProducts.length} items live)`,
          source: 'supabase'
        });
      } else {
        // Table exists but is empty - fall back to local catalog so admin can seed
        const fallback = getCachedProducts();
        onUpdate(fallback);
        notifySyncStatus({
          status: 'synced',
          message: 'Supabase connected. Database empty (ready to seed catalog).',
          source: 'offline_fallback'
        });
      }
    } catch (err: any) {
      if (isCancelled) return;
      console.error('[Supabase] Error loading products:', err);
      notifySyncStatus({
        status: 'error',
        message: `Supabase Error: ${err.message || 'Connection failed'}. Using cached catalog.`,
        source: 'local_cache'
      });
      onUpdate(getCachedProducts());
      if (onError) onError(err);
    }
  };

  // Trigger initial fetch
  fetchLiveProducts();

  // Subscribe to Realtime postgres_changes on products table
  const channel = supabase
    .channel('realtime:public:products')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        console.log('[Supabase Realtime] Product event received:', payload.eventType);
        fetchLiveProducts();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase Realtime] Successfully subscribed to products channel.');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase Realtime] Channel subscription warning.');
      }
    });

  return () => {
    isCancelled = true;
    supabase.removeChannel(channel);
  };
}

// -----------------------------------------------------
// CREATE / UPDATE PRODUCT IN SUPABASE
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
    message: `Saving "${product.name}" to Supabase...`,
    source: 'supabase'
  });

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const fullRow = mapProductToRow(normalizedProduct);

      // Attempt upsert with full row
      let { error } = await supabase.from('products').upsert(fullRow, { onConflict: 'id' });

      // If full row fails due to missing optional columns in user table, retry with core fields
      if (error && error.code === '42703') {
        console.warn('[Supabase] Missing optional columns in products table. Retrying with core columns.');
        const coreRow = {
          id: fullRow.id,
          name: fullRow.name,
          category: fullRow.category,
          price: fullRow.price,
          description: fullRow.description,
          image: fullRow.image,
          image_url: fullRow.image_url,
          available_stock: fullRow.available_stock,
          created_at: fullRow.created_at,
          updated_at: fullRow.updated_at
        };
        const retry = await supabase.from('products').upsert(coreRow, { onConflict: 'id' });
        error = retry.error;
      }

      if (error) {
        throw error;
      }

      notifySyncStatus({
        status: 'saved',
        message: `Saved "${product.name}" to Supabase`,
        source: 'supabase'
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

      setTimeout(() => {
        notifySyncStatus({
          status: 'synced',
          message: 'Synced with Supabase',
          source: 'supabase'
        });
      }, 2000);
      return;
    } catch (err: any) {
      console.error('[Supabase] Failed to write product:', err);
      notifySyncStatus({
        status: 'error',
        message: `Failed to save to Supabase: ${err.message || String(err)}`,
        source: 'supabase'
      });
      throw err;
    }
  }

  // Offline fallback if Supabase is not configured
  console.warn('[Supabase] Client not configured. Storing product in local cache.');
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
    message: 'Saved to local cache (Supabase Not Configured)',
    source: 'offline_fallback'
  });
}

// -----------------------------------------------------
// DELETE PRODUCT FROM SUPABASE
// -----------------------------------------------------
export async function deleteProductFromDatabase(productId: string): Promise<void> {
  if (!productId) return;

  notifySyncStatus({
    status: 'saving',
    message: `Deleting product ${productId} from Supabase...`,
    source: 'supabase'
  });

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      notifySyncStatus({
        status: 'saved',
        message: 'Deleted product from Supabase',
        source: 'supabase'
      });

      const cached = getCachedProducts().filter(p => p.id !== productId);
      setCachedProducts(cached);
      notifyLocalListeners();

      setTimeout(() => {
        notifySyncStatus({
          status: 'synced',
          message: 'Synced with Supabase',
          source: 'supabase'
        });
      }, 2000);
      return;
    } catch (err: any) {
      console.error('[Supabase] Failed to delete product:', err);
      notifySyncStatus({
        status: 'error',
        message: `Failed to delete from Supabase: ${err.message || String(err)}`,
        source: 'supabase'
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
    message: 'Deleted from local cache (Supabase Offline)',
    source: 'offline_fallback'
  });
}

// -----------------------------------------------------
// 1-CLICK MIGRATION / SEED LOCAL CATALOG TO SUPABASE
// -----------------------------------------------------
export async function syncAllProductsToDatabase(products: FabricProduct[]): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    setCachedProducts(products);
    notifyLocalListeners();
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment or Settings.');
  }

  notifySyncStatus({
    status: 'saving',
    message: `Migrating ${products.length} products to Supabase...`,
    source: 'supabase'
  });

  let syncedCount = 0;
  const rows = products.map(p => mapProductToRow(p));

  // Upsert in batches of 20
  for (let i = 0; i < rows.length; i += 20) {
    const chunk = rows.slice(i, i + 20);
    const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Migration batch error:', error);
      throw error;
    }
    syncedCount += chunk.length;
  }

  setCachedProducts(products);
  notifyLocalListeners();
  notifySyncStatus({
    status: 'synced',
    message: `Successfully migrated ${syncedCount} products to Supabase!`,
    source: 'supabase'
  });

  return syncedCount;
}

// Delete all products (Used by Admin reset)
export async function deleteAllProducts(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('products').delete().neq('id', '___prevent_empty_clause___');
    if (error) console.warn('[Supabase] Delete all warning:', error);
  }
  setCachedProducts([]);
  notifyLocalListeners();
  notifySyncStatus({
    status: 'synced',
    message: 'Catalog cleared',
    source: 'supabase'
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
// STORE SETTINGS (Supabase Table 'settings', row id 'store_settings')
// -----------------------------------------------------
export function subscribeToSettings(onUpdate: (settings: StoreSettings) => void): () => void {
  let cached = INITIAL_STORE_SETTINGS;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY_SETTINGS);
      if (stored) cached = JSON.parse(stored);
    } catch {}
  }
  onUpdate(cached);

  const supabase = getSupabaseClient();
  if (!supabase) {
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

  // Fetch settings from Supabase
  supabase
    .from('settings')
    .select('data')
    .eq('id', 'store_settings')
    .maybeSingle()
    .then(({ data, error }) => {
      if (!error && data && data.data) {
        const live = data.data as StoreSettings;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(live));
        }
        onUpdate(live);
      }
    });

  // Realtime settings channel
  const channel = supabase
    .channel('realtime:public:settings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.store_settings' },
      (payload) => {
        if (payload.new && (payload.new as any).data) {
          const live = (payload.new as any).data as StoreSettings;
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(live));
          }
          onUpdate(live);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function saveSettingsToDatabase(settings: StoreSettings): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(settings));
  }
  notifyLocalListeners();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('settings').upsert({
        id: 'store_settings',
        data: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase] Failed to write settings:', err);
    }
  }
}

// -----------------------------------------------------
// INQUIRIES & ORDERS (Supabase Table 'inquiries')
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

  const supabase = getSupabaseClient();
  if (!supabase) {
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

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const list: InquiryRecord[] = data.map((d: any) => ({
          id: d.id,
          inquiryNumber: d.inquiry_number || d.inquiryNumber,
          customer: d.customer,
          items: d.items,
          status: d.status || 'New Inquiry',
          createdAt: d.created_at || d.createdAt
        }));

        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY_INQUIRIES, JSON.stringify(list));
        }
        onUpdate(list);
      }
    } catch (err) {
      console.warn('[Supabase] Inquiries fetch error:', err);
    }
  };

  fetchInquiries();

  const channel = supabase
    .channel('realtime:public:inquiries')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inquiries' },
      () => {
        fetchInquiries();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
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

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('inquiries').upsert({
        id: cleanId,
        inquiry_number: normalized.inquiryNumber,
        customer: normalized.customer,
        items: normalized.items,
        status: normalized.status,
        created_at: normalized.createdAt,
        updated_at: now
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase] Failed to write inquiry:', err);
    }
  }
}

export function subscribeToQuotaExceeded(cb: (isExceeded: boolean, link: string) => void) {
  cb(false, '');
  return () => {};
}
