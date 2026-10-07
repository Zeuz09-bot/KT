-- =====================================================================
-- Keraunous Tech Store — Migration 004: Product Media Storage Bucket & RLS
-- Blueprint: Section 10 (U04) & Section 7.6
-- =====================================================================

-- 1. Create or update product-media storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  10485760, -- 10 MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- 2. Storage Objects RLS Policies for product-media

-- Allow public read access to all objects in product-media bucket
drop policy if exists product_media_public_read on storage.objects;
create policy product_media_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-media');

-- Allow authenticated admins with MFA to insert into product-media bucket
drop policy if exists product_media_admin_insert on storage.objects;
create policy product_media_admin_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-media'
  and is_admin()
  and has_mfa()
);

-- Allow authenticated admins with MFA to update objects in product-media bucket
drop policy if exists product_media_admin_update on storage.objects;
create policy product_media_admin_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-media'
  and is_admin()
  and has_mfa()
)
with check (
  bucket_id = 'product-media'
  and is_admin()
  and has_mfa()
);

-- Allow authenticated admins with MFA to delete objects in product-media bucket
drop policy if exists product_media_admin_delete on storage.objects;
create policy product_media_admin_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-media'
  and is_admin()
  and has_mfa()
);
