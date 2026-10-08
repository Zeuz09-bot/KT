-- Migration: 20261007000005_slug_redirects.sql
-- U05: Catalogue Management - Slug Redirects

create table if not exists slug_redirects (
  id         bigserial primary key,
  old_slug   text not null unique,
  new_slug   text not null,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Index on old_slug for lookups
create index if not exists idx_slug_redirects_old_slug on slug_redirects(old_slug);

-- RLS: enabled
alter table slug_redirects enable row level security;

-- Admin read/write policy
create policy slug_redirects_admin on slug_redirects for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- Public read policy so customer site can redirect old URLs to new URLs
create policy slug_redirects_public_read on slug_redirects for select to anon
  using (true);
