import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEY_CONFIG = 'asv_supabase_client_config';

// Active connected Supabase project credentials (fallback defaults)
export const DEFAULT_SUPABASE_URL = 'https://zcmypimqxramhirszian.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbXlwaW1xeHJhbWhpcnN6aWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExODQ5ODEsImV4cCI6MjEwNjc2MDk4MX0.KOfqFh0GQ2CVnDP1LmRx-QPTKru4XP24PQXUIXTk9gc';

/**
 * Resolves the client-side Supabase configuration with priority:
 * 1. Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. Stored admin configuration in localStorage
 * 3. Default connected active project (zcmypimqxramhirszian)
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  // If environment has the old abandoned project, override with active project
  if (envUrl && envAnonKey && !envUrl.includes('lztueurdhccawdepseqp')) {
    return {
      url: envUrl.replace(/\/+$/, ''),
      anonKey: envAnonKey
    };
  }

  // Check localStorage fallback for admin configuration
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          // If stored has the old abandoned project, clean and upgrade it
          if (String(parsed.url).includes('lztueurdhccawdepseqp')) {
            localStorage.removeItem(STORAGE_KEY_CONFIG);
          } else {
            return {
              url: String(parsed.url).trim().replace(/\/+$/, ''),
              anonKey: String(parsed.anonKey).trim()
            };
          }
        }
      }
    } catch (e) {
      console.warn('[Supabase] Failed to parse stored Supabase config:', e);
    }
  }

  // Fallback to active live Supabase project
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY
  };
}

export function saveSupabaseConfig(config: Partial<SupabaseConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSupabaseConfig() || { url: '', anonKey: '' };
    const merged = {
      url: config.url !== undefined ? config.url.trim().replace(/\/+$/, '') : existing.url,
      anonKey: config.anonKey !== undefined ? config.anonKey.trim() : existing.anonKey
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
    // Reset cached client instance so next call uses updated credentials
    cachedClient = null;
  } catch (err) {
    console.error('[Supabase] Failed to save Supabase configuration to storage:', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedConfig: string = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.anonKey) {
    return null;
  }

  const configSignature = `${config.url}::${config.anonKey}`;
  if (cachedClient && lastUsedConfig === configSignature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastUsedConfig = configSignature;
    return cachedClient;
  } catch (err) {
    console.error('[Supabase] Client initialization error:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config && config.url && config.anonKey);
}

/**
 * Converts a data URL (base64) or string to a Blob object
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return {
    blob: new Blob([u8arr], { type: contentType }),
    contentType
  };
}

/**
 * Uploads an image to Supabase Storage bucket 'product-images'
 * and returns the permanent public URL.
 */
export async function uploadImageToSupabaseStorage(
  fileOrDataUrl: File | Blob | string,
  fileNameHint?: string
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const BUCKET_NAME = 'product-images';

  let uploadBody: Blob | File;
  let contentType = 'image/jpeg';
  let ext = 'jpg';

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('data:')) {
      const parsed = dataUrlToBlob(fileOrDataUrl);
      uploadBody = parsed.blob;
      contentType = parsed.contentType;
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else ext = 'jpg';
    } else {
      // It's already a remote or static URL, no upload needed
      return fileOrDataUrl;
    }
  } else if (fileOrDataUrl instanceof File) {
    uploadBody = fileOrDataUrl;
    contentType = fileOrDataUrl.type || 'image/jpeg';
    const parts = fileOrDataUrl.name.split('.');
    if (parts.length > 1) {
      ext = parts.pop() || 'jpg';
    }
  } else {
    uploadBody = fileOrDataUrl;
    contentType = fileOrDataUrl.type || 'image/jpeg';
  }

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const safeName = (fileNameHint || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);
  const filePath = `products/${safeName}_${timestamp}_${randomSuffix}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, uploadBody, {
      contentType,
      upsert: true,
      cacheControl: '31536000'
    });

  if (error) {
    console.error('[Supabase Storage] Upload error:', error);
    // Provide actionable error guidance for bucket permission issues
    if (error.message && error.message.toLowerCase().includes('bucket not found')) {
      throw new Error(`Supabase Storage bucket "${BUCKET_NAME}" does not exist. Please create a public bucket named "${BUCKET_NAME}" in your Supabase dashboard.`);
    }
    throw error;
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded image.');
  }

  return publicUrlData.publicUrl;
}
