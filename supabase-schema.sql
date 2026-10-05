-- ========================================================
-- AYOBAMI SAM VENTURES - SUPABASE DATABASE SETUP SCHEMA
-- Copy and run this script in your Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ========================================================

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null,
  main_section text default 'cloths',
  category text default '',
  category_slug text default 'general',
  description text default '',
  available_stock integer default 50,
  minimum_order integer default 1,
  unit_label text default '',
  image text default '',
  image_url text default '',
  gallery_images jsonb default '[]'::jsonb,
  colors jsonb default '["Standard Original"]'::jsonb,
  fabric_type text default '',
  is_new_arrival boolean default true,
  is_featured boolean default true,
  is_bestseller boolean default false,
  in_stock boolean default true,
  rating numeric default 4.9,
  review_count integer default 20,
  suitable_for jsonb default '["Retail & Wholesale"]'::jsonb,
  texture_note text default '',
  origin text default 'Lagos, Nigeria',
  is_wholesale_available boolean default true,
  wholesale_note text default 'Contact on WhatsApp for wholesale cartons & bundle rates.',
  badge text default '',
  product_code text default '',
  design_group_id text,
  design_group_name text,
  color_variant text,
  is_matching_set boolean default false,
  design_type text,
  price_per_yard numeric default 0,
  price numeric default 0,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- Index for speedy lookups
create index if not exists idx_products_main_section on public.products (main_section);
create index if not exists idx_products_updated_at on public.products (updated_at desc);

-- 2. STORE SETTINGS TABLE
create table if not exists public.settings (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 3. INQUIRIES & ORDERS TABLE
create table if not exists public.inquiries (
  id text primary key,
  inquiry_number text,
  customer jsonb,
  items jsonb,
  status text default 'New Inquiry',
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.products enable row level security;
alter table public.settings enable row level security;
alter table public.inquiries enable row level security;

-- Policies for products:
-- Anyone can view products (public catalog)
drop policy if exists "Allow public read access to products" on public.products;
create policy "Allow public read access to products"
  on public.products for select
  using (true);

-- Allow insert/update/delete on products
drop policy if exists "Allow full write access to products" on public.products;
create policy "Allow full write access to products"
  on public.products for all
  using (true)
  with check (true);

-- Policies for settings:
drop policy if exists "Allow public read access to settings" on public.settings;
create policy "Allow public read access to settings"
  on public.settings for select
  using (true);

drop policy if exists "Allow full write access to settings" on public.settings;
create policy "Allow full write access to settings"
  on public.settings for all
  using (true)
  with check (true);

-- Policies for inquiries:
drop policy if exists "Allow public insert to inquiries" on public.inquiries;
create policy "Allow public insert to inquiries"
  on public.inquiries for insert
  with check (true);

drop policy if exists "Allow public read/update to inquiries" on public.inquiries;
create policy "Allow public read/update to inquiries"
  on public.inquiries for all
  using (true)
  with check (true);

-- 5. ENABLE REALTIME ON PRODUCTS
-- This ensures Phone A changes stream to Phone B and Phone C instantly
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.products, public.settings, public.inquiries;
commit;

-- 6. STORAGE BUCKET FOR PRODUCT IMAGES
-- Create public storage bucket 'product-images' if it doesn't already exist
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Policy to allow anyone to read images from 'product-images' bucket
drop policy if exists "Public Access for product images" on storage.objects;
create policy "Public Access for product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Policy to allow uploads to 'product-images' bucket
drop policy if exists "Allow uploads to product-images" on storage.objects;
create policy "Allow uploads to product-images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "Allow updates to product-images" on storage.objects;
create policy "Allow updates to product-images"
  on storage.objects for update
  using (bucket_id = 'product-images');

drop policy if exists "Allow delete from product-images" on storage.objects;
create policy "Allow delete from product-images"
  on storage.objects for delete
  using (bucket_id = 'product-images');
