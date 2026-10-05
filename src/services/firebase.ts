import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY_CONFIG = 'asv_firebase_client_config';

/**
 * Resolves the client-side Firebase configuration with priority:
 * 1. Vite environment variables (VITE_FIREBASE_*)
 * 2. Stored admin configuration in localStorage
 */
export function getClientFirebaseConfig(): FirebaseClientConfig | null {
  const envApiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
  const envProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim()
    || (typeof process !== 'undefined' ? (process.env.FIREBASE_PROJECT_ID as string | undefined)?.trim() : undefined);

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      projectId: envProjectId,
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() || `${envProjectId}.firebaseapp.com`,
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() || `${envProjectId}.appspot.com`,
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() || '',
      appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() || ''
    };
  }

  // Check localStorage for manually configured client settings
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projectId) {
          return {
            apiKey: parsed.apiKey || '',
            projectId: parsed.projectId,
            authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
            storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
            messagingSenderId: parsed.messagingSenderId || '',
            appId: parsed.appId || ''
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored Firebase client configuration:', e);
    }
  }

  return null;
}

export function saveClientFirebaseConfig(config: Partial<FirebaseClientConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getClientFirebaseConfig() || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
    const merged = { ...existing, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to save Firebase client configuration to storage:', err);
  }
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export function initFirebaseClient(): { app: FirebaseApp | null; db: Firestore | null } {
  if (cachedDb) {
    return { app: cachedApp, db: cachedDb };
  }

  const config = getClientFirebaseConfig();
  if (!config || !config.projectId) {
    return { app: null, db: null };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const db = getFirestore(app);

    cachedApp = app;
    cachedDb = db;
    return { app, db };
  } catch (error) {
    console.warn('[Firebase] Client initialization notice:', error);
    return { app: null, db: null };
  }
}

export function getFirebaseDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  return initFirebaseClient().db;
}

export function isFirebaseConfigured(): boolean {
  const config = getClientFirebaseConfig();
  return Boolean(config && config.projectId);
}
