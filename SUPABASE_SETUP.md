# Supabase Setup Guide for Ayobami SAM Ventures

This project uses **Supabase** as its live cloud database, real-time sync engine, and image storage backend.

---

## 1. Vercel Environment Variables

When deploying the project to Vercel, add the following two environment variables under **Project Settings → Environment Variables**:

| Variable Name | Description | Example Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xyzprojectid.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Publishable / Anon API Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> ⚠️ **Important**: Use the **`anon` (public)** key only. Never put the `service_role` (secret) key into frontend environment variables.

---

## 2. Setting Up Tables in Supabase (1-Click SQL)

1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project.
3. In the left navigation, click on **SQL Editor**.
4. Click **New Query**.
5. Copy and paste the contents of `supabase-schema.sql` (found in the root of this repository).
6. Click **Run**.

This automatically creates:
- The **`products`** table with all product attributes, prices, stock, and indexes.
- The **`settings`** table for live store address, phone numbers, and WhatsApp configuration.
- The **`inquiries`** table for customer orders.
- Row Level Security (RLS) policies allowing public browsing and updates.
- Realtime publication on the `products` table so all devices sync instantly.
- The **`product-images`** public storage bucket for uploaded product photos.

---

## 3. Storage Bucket for Product Images

If not created by the SQL script:
1. Go to **Storage** in the Supabase left navigation.
2. Click **New Bucket**.
3. Name it: `product-images`
4. Make sure **Public Bucket** is checked (toggle ON).
5. Click **Save**.

---

## 4. How Multi-Device Real-Time Sync Works

```
ADMIN DEVICE (Phone A)
  ↓ Adds / Edits / Deletes product
SUPABASE POSTGRESQL (Online Database)
  ↓ Realtime Event (INSERT / UPDATE / DELETE)
ALL OTHER DEVICES (Phone B, Phone C, Desktop)
  → Automatically receive the update without refreshing!
```

---

## 5. 1-Click Migration of Existing Catalog

1. Open the website and click on the **Admin** button (password: `2006`).
2. Go to **Products** or **Settings**.
3. Click the **"Push 55 Local Products to Supabase"** button.
4. Your complete 55-item catalog will be safely uploaded into Supabase with all images, categories, and prices preserved!
