import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

interface FabricProduct {
  id: string;
  name: string;
  mainSection: 'cloths' | 'shoes' | 'tailoring-machine';
  category: string;
  categorySlug: string;
  description: string;
  availableStock?: number;
  minimumOrder?: number;
  unitLabel?: string;
  image: string;
  galleryImages?: string[];
  colors: string[];
  fabricType: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  suitableFor: string[];
  textureNote?: string;
  origin?: string;
  isWholesaleAvailable?: boolean;
  wholesaleNote?: string;
  badge?: string;
  pricePerYard?: number;
  price?: number;
  updatedAt?: any;
}

interface SyncMetadata {
  lastSyncTimestamp: number;
  lastSyncDate: string;
  totalProducts: number;
  products: Record<string, {
    status: 'SYNCED' | 'IMAGE_FAILED' | 'DATA_FAILED';
    image?: string;
    lastModified?: string;
    error?: string;
  }>;
}

const ROOT_DIR = process.cwd();
const PRODUCTS_JSON_PATH = path.join(ROOT_DIR, 'src/data/products.json');
const METADATA_JSON_PATH = path.join(ROOT_DIR, 'src/data/sync_metadata.json');
const IMAGES_DIR = path.join(ROOT_DIR, 'public/images/products');

// Helper to ensure target directories exist
function ensureDirs() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

// Helper to load JSON safely
function loadJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`[WARN] Failed to read ${filePath}, using fallback.`);
  }
  return fallback;
}

// Download image from URL to local disk
function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    // If it's a data URL, decode and write directly
    if (url.startsWith('data:image')) {
      try {
        const parts = url.split(',');
        if (parts.length === 2) {
          const buffer = Buffer.from(parts[1], 'base64');
          fs.writeFileSync(destPath, buffer);
          return resolve(buffer.length > 0);
        }
      } catch (e) {
        console.error(`[ERROR] Failed to decode base64 image:`, e);
        return resolve(false);
      }
    }

    // HTTP / HTTPS download
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve);
      }

      if (res.statusCode !== 200) {
        console.error(`[ERROR] Image download failed with status HTTP ${res.statusCode} for ${url}`);
        return resolve(false);
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          const stat = fs.statSync(destPath);
          resolve(stat.size > 0);
        });
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        console.error(`[ERROR] File stream error for ${destPath}:`, err);
        resolve(false);
      });
    });

    req.on('error', (err) => {
      console.error(`[ERROR] Network error downloading ${url}:`, err);
      resolve(false);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.error(`[ERROR] Download timed out for ${url}`);
      resolve(false);
    });
  });
}

// Initialize Firebase Admin safely
function initFirebaseAdmin(): { app: App | null; db: Firestore | null } {
  if (getApps().length > 0) {
    const app = getApps()[0];
    return { app, db: getFirestore(app) };
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (saJson) {
      const credentials = JSON.parse(saJson);
      const app = initializeApp({
        credential: cert(credentials),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${credentials.project_id}.appspot.com`
      });
      return { app, db: getFirestore(app) };
    } else if (projectId && clientEmail && privateKey) {
      const app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`
      });
      return { app, db: getFirestore(app) };
    }
  } catch (err) {
    console.error(`[ERROR] Firebase Admin initialization failed:`, err);
  }

  return { app: null, db: null };
}

async function main() {
  console.log('=====================================================');
  console.log('  FIREBASE → LOCAL SOURCE FILES → GITHUB BACKUP SYNC');
  console.log('=====================================================');

  ensureDirs();

  const existingProducts = loadJsonFile<FabricProduct[]>(PRODUCTS_JSON_PATH, []);
  const syncMetadata = loadJsonFile<SyncMetadata>(METADATA_JSON_PATH, {
    lastSyncTimestamp: 0,
    lastSyncDate: 'Never',
    totalProducts: 0,
    products: {}
  });

  console.log(`[INFO] Current local catalog count: ${existingProducts.length} products`);
  console.log(`[INFO] Last sync timestamp: ${syncMetadata.lastSyncTimestamp} (${syncMetadata.lastSyncDate})`);

  const { app, db } = initFirebaseAdmin();

  // If no Firebase credentials found (e.g. local dry-run or verification mode)
  if (!db) {
    console.log('\n[NOTICE] No Firebase credentials provided in environment.');
    console.log('[NOTICE] Running in LOCAL VERIFICATION & INTEGRITY MODE.');
    console.log('[NOTICE] (Credentials should be configured in GitHub Secrets for live sync).');

    // Verify existing local files and image paths
    let missingImages = 0;
    for (const p of existingProducts) {
      const imgPath = p.image.startsWith('/') ? p.image.slice(1) : p.image;
      const fullPath = path.join(ROOT_DIR, 'public', imgPath);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
        console.error(`[ERROR] Missing image on disk for ${p.id}: ${fullPath}`);
        missingImages++;
      }
    }

    if (missingImages > 0) {
      console.error(`[FAILED] Local catalog verification failed with ${missingImages} missing images.`);
      process.exit(1);
    }

    console.log(`[SUCCESS] All ${existingProducts.length} local products and image assets are verified on disk!`);
    console.log('=====================================================');
    return;
  }

  const isFullSync = process.argv.includes('--full') || process.env.FORCE_FULL_SYNC === 'true';
  console.log(`[INFO] Sync Mode: ${isFullSync ? 'FULL SYNC' : 'INCREMENTAL SYNC'}`);

  let query: any = db.collection('products');
  if (!isFullSync && syncMetadata.lastSyncTimestamp > 0) {
    const lastTimestamp = Timestamp.fromMillis(syncMetadata.lastSyncTimestamp);
    query = query.where('updatedAt', '>', lastTimestamp);
  }

  console.log('[INFO] Querying Firestore collection "products"...');
  let snapshot;
  try {
    snapshot = await query.get();
  } catch (err: any) {
    // If the index or query fails on updatedAt, fall back gracefully to getting products safely
    console.warn(`[WARN] Incremental query failed: ${err.message}. Falling back to standard query.`);
    snapshot = await db.collection('products').get();
  }

  console.log(`[INFO] Retrieved ${snapshot.docs.length} products from Firebase.`);

  if (snapshot.empty && !isFullSync) {
    console.log('[INFO] Catalog is already up-to-date with Firebase. No new or modified items.');
    console.log('=====================================================');
    return;
  }

  // Pre-index local products by ID for strict duplicate prevention
  const productMap = new Map<string, FabricProduct>();
  for (const p of existingProducts) {
    productMap.set(p.id, p);
  }

  let imagesDownloaded = 0;
  let imagesCached = 0;
  let syncErrors = 0;

  for (const doc of snapshot.docs) {
    const rawData = doc.data();
    const docId = doc.id;
    console.log(`\n[PRODUCT] Processing: ${docId} - "${rawData.name || 'Untitled'}"`);

    let localImagePath = productMap.get(docId)?.image || '';
    const remoteImage = rawData.image || '';

    // Handle Image Synchronization
    if (remoteImage) {
      // Determine file extension
      let ext = 'jpg';
      if (remoteImage.includes('.png') || remoteImage.startsWith('data:image/png')) ext = 'png';
      else if (remoteImage.includes('.webp') || remoteImage.startsWith('data:image/webp')) ext = 'webp';

      const filename = `prod_${docId}_main.${ext}`;
      const targetFilePath = path.join(IMAGES_DIR, filename);
      const expectedLocalPath = `/images/products/${filename}`;

      // Check if file already exists locally with non-zero size
      if (fs.existsSync(targetFilePath) && fs.statSync(targetFilePath).size > 0 && localImagePath === expectedLocalPath) {
        console.log(`  └─ Image already up-to-date locally: ${filename}`);
        imagesCached++;
        localImagePath = expectedLocalPath;
      } else {
        console.log(`  └─ Downloading image to ${filename}...`);
        const success = await downloadFile(remoteImage, targetFilePath);
        if (success) {
          imagesDownloaded++;
          localImagePath = expectedLocalPath;
          console.log(`  └─ Download complete (${fs.statSync(targetFilePath).size} bytes).`);
        } else {
          console.error(`  └─ [ERROR] Failed to download image for product ${docId}.`);
          syncErrors++;
          syncMetadata.products[docId] = {
            status: 'IMAGE_FAILED',
            lastModified: new Date().toISOString(),
            error: 'Failed to download image file from remote storage'
          };
          continue; // Do not commit with a broken image path
        }
      }
    }

    // Construct the synchronized product record
    const synchronizedProduct: FabricProduct = {
      id: docId,
      name: rawData.name || 'Untitled Product',
      mainSection: rawData.mainSection || 'cloths',
      category: rawData.category || '',
      categorySlug: rawData.categorySlug || 'general',
      description: rawData.description || '',
      availableStock: Number(rawData.availableStock) || 10,
      minimumOrder: Number(rawData.minimumOrder) || 1,
      unitLabel: rawData.unitLabel || (rawData.mainSection === 'shoes' ? 'pair' : 'yard'),
      image: localImagePath || '/hero-logo.png',
      galleryImages: Array.isArray(rawData.galleryImages) && rawData.galleryImages.length > 0
        ? rawData.galleryImages
        : [localImagePath || '/hero-logo.png'],
      colors: Array.isArray(rawData.colors) && rawData.colors.length > 0 ? rawData.colors : ['Standard Original'],
      fabricType: rawData.fabricType || 'Cotton / Ankara',
      isNewArrival: rawData.isNewArrival ?? true,
      isFeatured: rawData.isFeatured ?? false,
      isBestseller: rawData.isBestseller ?? false,
      inStock: rawData.inStock ?? true,
      rating: Number(rawData.rating) || 5,
      reviewCount: Number(rawData.reviewCount) || 0,
      suitableFor: Array.isArray(rawData.suitableFor) ? rawData.suitableFor : ['Retail & Wholesale'],
      textureNote: rawData.textureNote || '',
      origin: rawData.origin || 'Lagos, Nigeria',
      isWholesaleAvailable: rawData.isWholesaleAvailable ?? true,
      wholesaleNote: rawData.wholesaleNote || 'Contact on WhatsApp for wholesale cartons & bundle rates.',
      badge: rawData.badge || '',
      pricePerYard: Number(rawData.pricePerYard) || 0,
      price: Number(rawData.price) || 0
    };

    // Merge without duplicates (overwrites or appends into the map)
    productMap.set(docId, synchronizedProduct);
    syncMetadata.products[docId] = {
      status: 'SYNCED',
      image: path.basename(localImagePath),
      lastModified: new Date().toISOString()
    };
  }

  // Convert map back to list
  const finalProducts = Array.from(productMap.values());

  // Strict Pre-Commit Verification Tests
  console.log('\n-----------------------------------------------------');
  console.log('  RUNNING INTEGRITY & DEPENDENCY VERIFICATION');
  console.log('-----------------------------------------------------');

  let verificationFailed = false;
  for (const p of finalProducts) {
    if (p.image.includes('firebasestorage.googleapis.com')) {
      console.error(`[ERROR] Remote Firebase URL still present in product ${p.id}: ${p.image}`);
      verificationFailed = true;
    }
    const imgPath = p.image.startsWith('/') ? p.image.slice(1) : p.image;
    const fullPath = path.join(ROOT_DIR, 'public', imgPath);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
      console.error(`[ERROR] Product ${p.id} references missing image on disk: ${fullPath}`);
      verificationFailed = true;
    }
  }

  if (verificationFailed || syncErrors > 0) {
    console.error(`\n[FATAL] Synchronization verification failed! Total errors: ${syncErrors}`);
    console.error('[FATAL] Halting commit to prevent deploying corrupted backup data.');
    process.exit(1);
  }

  // Update sync metadata
  syncMetadata.lastSyncTimestamp = Date.now();
  syncMetadata.lastSyncDate = new Date().toISOString();
  syncMetadata.totalProducts = finalProducts.length;

  // Atomically write updated files
  fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(finalProducts, null, 2), 'utf-8');
  fs.writeFileSync(METADATA_JSON_PATH, JSON.stringify(syncMetadata, null, 2), 'utf-8');

  console.log(`[SUCCESS] Synchronized ${finalProducts.length} products to ${PRODUCTS_JSON_PATH}`);
  console.log(`[SUCCESS] Images downloaded: ${imagesDownloaded}, already cached: ${imagesCached}`);
  console.log(`[SUCCESS] Updated sync metadata: ${METADATA_JSON_PATH}`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
