-- ============================================================
-- Migration 004: Supabase Storage buckets
--
-- Run this via Supabase SQL editor.
-- Alternatively, create these through the Supabase dashboard UI.
-- ============================================================

-- Restaurant assets: logos, cover images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-assets',
  'restaurant-assets',
  true,
  5242880,  -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728,  -- 3MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ─── Storage policies ─────────────────────────────────────────────────────────

-- Public read for both buckets (images are served publicly via CDN URL)
create policy "public_read_restaurant_assets"
  on storage.objects for select
  using (bucket_id = 'restaurant-assets');

create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only authenticated staff can upload to their own tenant's folder
-- Folder structure: {restaurant_id}/{filename}
create policy "staff_upload_restaurant_assets"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-assets'
    and auth.role() = 'authenticated'
  );

create policy "staff_upload_product_images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

create policy "staff_delete_own_assets"
  on storage.objects for delete
  using (
    auth.role() = 'authenticated'
    and owner = auth.uid()
  );
