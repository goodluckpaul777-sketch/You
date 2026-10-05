# Firebase → Local Files → Local Images → GitHub → Vercel Backup System

This repository implements a **read-only, non-destructive synchronization pipeline**:

```
FIREBASE (Source of Truth / Admin CMS)
       ↓
GITHUB ACTION (.github/workflows/firebase-sync.yml)
       ↓
LOCAL SOURCE ASSETS (src/data/products.json + public/images/products/)
       ↓
VERIFICATION SUITE (Pre-commit integrity check + zero Firebase URLs)
       ↓
GITHUB (main branch commit)
       ↓
VERCEL (Automatic static build & deployment)
```

Public visitors loading the website **never contact Firebase**; all products and images load instantly from the local static assets.

---

## 1. Required GitHub Actions Secrets

To enable the sync engine to read from Firebase, go to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

You can configure credentials using either **Option A** (Recommended - Single JSON) or **Option B** (Individual Keys):

### Option A (Simplest & Recommended):
* **`FIREBASE_SERVICE_ACCOUNT`**: The full JSON content of your Google Cloud / Firebase service account key file (or base64 encoded).
  ```json
  {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com"
  }
  ```

### Option B (Individual Keys):
* **`FIREBASE_PROJECT_ID`**: e.g., `your-project-id`
* **`FIREBASE_CLIENT_EMAIL`**: e.g., `firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com`
* **`FIREBASE_PRIVATE_KEY`**: The complete private key string, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`.

---

## 2. Synchronization Features & Triggers

### ⏰ Automatic Daily Sync
* Runs automatically every day at **2:00 AM UTC** (`0 2 * * *`).
* Executes incremental delta query (`updatedAt > lastSyncTimestamp`), downloading only newly added or updated items to protect your free quota.

### 🚀 Manual Immediate Sync (On-Demand)
1. Go to your repository on GitHub.
2. Click the **Actions** tab at the top.
3. In the left sidebar, click **"Firebase Catalog Backup & Local Sync"**.
4. Click **Run workflow** on the right.
   * Optional: Check **"Force full sync"** if you want to verify all items from scratch.
5. Click the green **Run workflow** button.

---

## 3. Strict Pre-Commit Verification Pipeline

The sync script (`scripts/sync-firebase.ts`) and GitHub Actions workflow execute the following checks before committing:

1. **Local File Generation**: All products are stored in `src/data/products.json` using stable document IDs (no duplicates).
2. **Real Image Downloads**: Images from Firebase Storage or data URLs are downloaded and saved as real files in `public/images/products/`.
3. **Local URL Rewriting**: Every `image` and `galleryImages` entry is rewritten to point to `/images/products/...`.
4. **URL Purity Check**: Confirms zero `firebasestorage.googleapis.com` URLs remain.
5. **Disk Integrity Check**: Confirms every referenced image file exists on disk and is non-empty.
6. **Secret Leak Prevention**: Scans staged files to guarantee no `.env`, `.pem`, `.key`, or credentials ever get committed.
7. **Clean Build**: Executes `npm run build` to verify the static website builds cleanly.

If any check fails, the workflow **aborts immediately** to protect your repository from corrupted backups.
