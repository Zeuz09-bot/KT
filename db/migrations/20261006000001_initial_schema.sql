-- =====================================================================
-- Keraunous Tech Store — Initial Database Migration
-- Blueprint: Section 7 & Unit U02 specification
-- =====================================================================

-- 1. EXTENSIONS
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- 2. ENUMS
create type product_status  as enum ('draft', 'published', 'archived');
create type item_condition  as enum ('brand_new', 'uk_used', 'open_box');
create type order_status    as enum ('new', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
create type fulfilment_type as enum ('delivery', 'pickup');
create type admin_role      as enum ('owner', 'staff');
create type banner_type     as enum ('hero', 'promo');

-- 3. UPDATED_AT TRIGGER FUNCTION
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. CATALOGUE TABLES

create table brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  logo_path   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  parent_id   uuid references categories(id),
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create table products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null check (char_length(name) between 2 and 120),
  brand_id          uuid not null references brands(id),
  category_id       uuid not null references categories(id),
  short_description text check (char_length(short_description) <= 200),
  description       text check (char_length(description) <= 5000),   -- plain text, no HTML
  specs             jsonb not null default '{}'::jsonb,              -- validated by Zod
  badge             text check (badge in ('new', 'best_seller', 'hot', 'limited')),
  is_featured       boolean not null default false,
  featured_rank     int,
  status            product_status not null default 'draft',
  published_at      timestamptz,
  search_key        text not null default '',                        -- maintained by trigger
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

create table product_variants (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references products(id) on delete cascade,
  sku                   text not null unique,
  storage_gb            int,
  ram_gb                int,
  color                 text,
  color_hex             text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  condition             item_condition not null default 'brand_new',
  price_ngn             int not null check (price_ngn > 0),
  compare_at_price_ngn  int check (compare_at_price_ngn is null or compare_at_price_ngn > price_ngn),
  sale_price_ngn        int check (sale_price_ngn is null or (sale_price_ngn > 0 and sale_price_ngn < price_ngn)),
  sale_starts_at        timestamptz,
  sale_ends_at          timestamptz,
  stock_qty             int not null default 0 check (stock_qty >= 0),
  low_stock_threshold   int not null default 2,
  warranty_months       int check (warranty_months is null or warranty_months between 0 and 36),
  is_active             boolean not null default true,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (sale_ends_at is null or sale_starts_at is null or sale_ends_at > sale_starts_at)
);

create unique index uq_variant_combo on product_variants
  (product_id, coalesce(storage_gb, 0), coalesce(color, ''), condition);

create trigger trg_product_variants_updated_at
before update on product_variants
for each row execute function set_updated_at();

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color      text,                        -- optional: image belongs to a specific colour
  path       text not null,               -- storage object path / URL
  alt        text not null,
  width      int,
  height     int,
  is_primary boolean not null default false,
  sort_order int not null default 0
);

create unique index uq_primary_image on product_images(product_id) where is_primary;

-- Effective price calculation function (sale price honours active sale window)
create or replace function effective_price(v product_variants)
returns int language sql stable as $$
  select case
    when v.sale_price_ngn is not null
     and (v.sale_starts_at is null or v.sale_starts_at <= now())
     and (v.sale_ends_at   is null or v.sale_ends_at   >  now())
    then v.sale_price_ngn else v.price_ngn end
$$;

-- Search key maintainer trigger: lower(brand + name + category) with only alphanumeric chars
create or replace function update_product_search_key()
returns trigger language plpgsql as $$
declare
  b_name text := '';
  c_name text := '';
  raw_key text;
begin
  select coalesce(name, '') into b_name from brands where id = new.brand_id;
  select coalesce(name, '') into c_name from categories where id = new.category_id;
  raw_key := lower(b_name || ' ' || new.name || ' ' || c_name);
  -- Keep alphanumeric only
  new.search_key := regexp_replace(raw_key, '[^a-z0-9]', '', 'g');
  return new;
end;
$$;

create trigger trg_products_search_key
before insert or update of name, brand_id, category_id on products
for each row execute function update_product_search_key();

-- 5. CONTENT & SETTINGS TABLES

create table banners (
  id          uuid primary key default gen_random_uuid(),
  type        banner_type not null,
  eyebrow     text,
  title       text not null,
  subtitle    text,
  cta_label   text,
  cta_href    text check (cta_href is null or cta_href ~ '^/[A-Za-z0-9/_\-?=&%.]*$'),
  image_path  text not null,
  product_id  uuid references products(id) on delete set null,
  starts_at   timestamptz,
  ends_at     timestamptz,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create table campaigns (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text,
  href       text check (href is null or href ~ '^/[A-Za-z0-9/_\-?=&%.]*$'),
  starts_at  timestamptz,
  ends_at    timestamptz not null,
  is_active  boolean not null default true
);

create table site_settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create trigger trg_site_settings_updated_at
before update on site_settings
for each row execute function set_updated_at();

-- 6. ORDERS & FULFILMENT TABLES

create table orders (
  id                   uuid primary key default gen_random_uuid(),
  public_id            text not null unique check (public_id ~ '^KRN-[0-9]{6}-[A-Z0-9]{5}$'),
  idempotency_key      uuid not null unique,
  customer_name        text not null,
  customer_phone       text not null check (customer_phone ~ '^\+234[789][01][0-9]{8}$'),
  fulfilment           fulfilment_type not null default 'delivery',
  delivery_state       text,
  delivery_city        text,
  delivery_address     text,
  customer_note        text check (char_length(customer_note) <= 300),
  status               order_status not null default 'new',
  subtotal_ngn         int not null check (subtotal_ngn >= 0),
  delivery_fee_ngn     int not null default 0 check (delivery_fee_ngn >= 0),
  discount_ngn         int not null default 0 check (discount_ngn >= 0),
  total_ngn            int generated always as (subtotal_ngn + delivery_fee_ngn - discount_ngn) stored,
  payment_confirmed_at timestamptz,
  payment_confirmed_by uuid references auth.users(id),
  payment_amount_ngn   int check (payment_amount_ngn is null or payment_amount_ngn >= 0),
  payment_reference    text,
  courier_name         text,
  tracking_number      text,
  internal_note        text,
  whatsapp_opened_at   timestamptz,
  utm                  jsonb,
  ip_hash              text,
  created_at           timestamptz not null default now(),
  confirmed_at         timestamptz,
  shipped_at           timestamptz,
  delivered_at         timestamptz,
  cancelled_at         timestamptz,
  cancel_reason        text,
  updated_at           timestamptz not null default now(),
  check ((subtotal_ngn + delivery_fee_ngn - discount_ngn) >= 0),
  check (fulfilment = 'pickup' or (delivery_state is not null and delivery_city is not null and delivery_address is not null))
);

create trigger trg_orders_updated_at
before update on orders
for each row execute function set_updated_at();

create table order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references orders(id) on delete cascade,
  variant_id            uuid references product_variants(id) on delete set null,
  product_name          text not null,           -- immutable snapshot
  variant_label         text not null,           -- "256GB · Natural Titanium · Brand New"
  sku                   text not null,
  listed_price_ngn      int not null,            -- snapshot of effective_price
  unit_price_ngn        int not null check (unit_price_ngn >= 0),
  qty                   int not null check (qty between 1 and 5),
  line_total_ngn        int generated always as (unit_price_ngn * qty) stored,
  imei                  text,
  stock_deducted        boolean not null default false
);

create table order_events (
  id                  bigserial primary key,
  order_id            uuid not null references orders(id) on delete cascade,
  type                text not null,
  from_status         order_status,
  to_status           order_status,
  actor_id            uuid references auth.users(id),   -- null = customer/system
  note                text,
  is_customer_visible boolean not null default false,
  meta                jsonb,
  created_at          timestamptz not null default now()
);

-- 7. ADMIN & AUDITING TABLES

create table admin_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         admin_role not null default 'staff',
  display_name text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references auth.users(id),
  action     text not null,
  entity     text not null,
  entity_id  text,
  before     jsonb,
  after      jsonb,
  ip_hash    text,
  created_at timestamptz not null default now()
);

-- 8. INDEXES (§7.3)

create index ix_products_status_published on products(status, published_at desc);
create index ix_products_brand            on products(brand_id) where status = 'published';
create index ix_products_category         on products(category_id) where status = 'published';
create index ix_products_featured         on products(featured_rank) where is_featured and status = 'published';
create index ix_products_search_trgm      on products using gin (search_key gin_trgm_ops);
create index ix_variants_product          on product_variants(product_id) where is_active;
create index ix_variants_sale             on product_variants(sale_ends_at) where sale_price_ngn is not null;
create index ix_images_product            on product_images(product_id, sort_order);
create index ix_orders_status_created     on orders(status, created_at desc);
create index ix_orders_phone              on orders(customer_phone);
create index ix_items_order               on order_items(order_id);
create index ix_events_order              on order_events(order_id, created_at);
create index ix_audit_created             on audit_log(created_at desc);

-- 9. READ VIEWS FOR THE STOREFRONT (§7.5)

create or replace view v_product_cards with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.name,
  p.badge,
  p.is_featured,
  p.featured_rank,
  p.published_at,
  b.name as brand_name,
  b.slug as brand_slug,
  c.name as category_name,
  c.slug as category_slug,
  min(effective_price(v))                                   as price_from_ngn,
  max(effective_price(v))                                   as price_to_ngn,
  bool_or(effective_price(v) < v.price_ngn)                 as on_sale,
  max(case when effective_price(v) < v.price_ngn
           then round(100.0 * (v.price_ngn - effective_price(v)) / v.price_ngn)
      end)                                                  as max_discount_pct,
  coalesce(sum(v.stock_qty), 0)::int                        as total_stock,
  (select path from product_images i where i.product_id = p.id and i.is_primary limit 1) as primary_image
from products p
join brands b on b.id = p.brand_id
join categories c on c.id = p.category_id
join product_variants v on v.product_id = p.id and v.is_active
where p.status = 'published'
group by p.id, b.id, c.id;

create or replace view v_product_variants_public with (security_invoker = true) as
select
  v.id,
  v.product_id,
  v.sku,
  v.storage_gb,
  v.ram_gb,
  v.color,
  v.color_hex,
  v.condition,
  v.price_ngn,
  v.compare_at_price_ngn,
  v.sale_price_ngn,
  v.sale_starts_at,
  v.sale_ends_at,
  effective_price(v) as current_price_ngn,
  v.stock_qty,
  v.low_stock_threshold,
  v.warranty_months,
  v.sort_order
from product_variants v
join products p on p.id = v.product_id
where v.is_active and p.status = 'published';

-- 10. ROW LEVEL SECURITY & HELPER FUNCTIONS (§7.6)

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users a
    where a.user_id = auth.uid() and a.is_active
  )
$$;

create or replace function is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users a
    where a.user_id = auth.uid() and a.is_active and a.role = 'owner'
  )
$$;

create or replace function has_mfa()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

-- RLS: Brands
alter table brands enable row level security;
create policy brands_public_read on brands for select to anon, authenticated
  using (is_active);
create policy brands_admin_all on brands for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Categories
alter table categories enable row level security;
create policy categories_public_read on categories for select to anon, authenticated
  using (is_active);
create policy categories_admin_all on categories for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Products
alter table products enable row level security;
create policy products_public_read on products for select to anon, authenticated
  using (status = 'published');
create policy products_admin_all on products for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Product Variants
alter table product_variants enable row level security;
create policy product_variants_public_read on product_variants for select to anon, authenticated
  using (is_active and exists (select 1 from products p where p.id = product_variants.product_id and p.status = 'published'));
create policy product_variants_admin_all on product_variants for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Product Images
alter table product_images enable row level security;
create policy product_images_public_read on product_images for select to anon, authenticated
  using (exists (select 1 from products p where p.id = product_images.product_id and p.status = 'published'));
create policy product_images_admin_all on product_images for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Banners
alter table banners enable row level security;
create policy banners_public_read on banners for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy banners_admin_all on banners for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Campaigns
alter table campaigns enable row level security;
create policy campaigns_public_read on campaigns for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and ends_at > now());
create policy campaigns_admin_all on campaigns for all to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Site Settings
alter table site_settings enable row level security;
create policy site_settings_public_read on site_settings for select to anon, authenticated
  using (is_public);
create policy site_settings_admin_read on site_settings for select to authenticated
  using (is_admin() and has_mfa());
create policy site_settings_owner_write on site_settings for all to authenticated
  using (is_owner() and has_mfa()) with check (is_owner() and has_mfa());

-- RLS: Orders (STRICT: Public can NEVER read orders directly)
alter table orders enable row level security;
create policy orders_admin_read on orders for select to authenticated
  using (is_admin() and has_mfa());
create policy orders_admin_update on orders for update to authenticated
  using (is_admin() and has_mfa()) with check (is_admin() and has_mfa());

-- RLS: Order Items
alter table order_items enable row level security;
create policy order_items_admin_read on order_items for select to authenticated
  using (is_admin() and has_mfa());

-- RLS: Order Events
alter table order_events enable row level security;
create policy order_events_admin_read on order_events for select to authenticated
  using (is_admin() and has_mfa());

-- RLS: Admin Users
alter table admin_users enable row level security;
create policy admin_users_read on admin_users for select to authenticated
  using (user_id = auth.uid() or (is_admin() and has_mfa()));
create policy admin_users_owner_all on admin_users for all to authenticated
  using (is_owner() and has_mfa()) with check (is_owner() and has_mfa());

-- RLS: Audit Log
alter table audit_log enable row level security;
create policy audit_log_owner_read on audit_log for select to authenticated
  using (is_owner() and has_mfa());

-- 11. DATABASE FUNCTIONS / RPCS (§7.7)

-- Function: create_order
create or replace function create_order(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_idempotency_key uuid;
  v_existing_order record;
  v_customer_name text;
  v_customer_phone text;
  v_fulfilment fulfilment_type;
  v_delivery_state text;
  v_delivery_city text;
  v_delivery_address text;
  v_customer_note text;
  v_expected_total int;
  v_subtotal int := 0;
  v_order_id uuid;
  v_public_id text;
  v_item jsonb;
  v_variant record;
  v_effective_price int;
  v_line_total int;
  v_order_disabled boolean := false;
  v_today_str text;
  v_rand_suffix text;
  v_attempts int := 0;
begin
  -- 1. Check orders_enabled kill switch
  select coalesce((value->>'enabled')::boolean, true) into v_order_disabled
  from site_settings where key = 'orders_enabled';
  if v_order_disabled is false then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'ORDERS_DISABLED', 'message', 'Ordering is currently paused. Please contact us on WhatsApp.'));
  end if;

  -- 2. Extract input fields
  v_idempotency_key := (payload->>'idempotency_key')::uuid;
  v_customer_name   := trim(payload->>'customer_name');
  v_customer_phone  := trim(payload->>'customer_phone');
  v_fulfilment      := (payload->>'fulfilment')::fulfilment_type;
  v_delivery_state  := payload->>'delivery_state';
  v_delivery_city   := payload->>'delivery_city';
  v_delivery_address:= payload->>'delivery_address';
  v_customer_note   := payload->>'customer_note';
  v_expected_total  := (payload->>'expected_total')::int;

  -- 3. Idempotency check
  select id, public_id, status, total_ngn into v_existing_order
  from orders where idempotency_key = v_idempotency_key;
  if found then
    return jsonb_build_object(
      'ok', true,
      'data', jsonb_build_object(
        'order_id', v_existing_order.id,
        'public_id', v_existing_order.public_id,
        'status', v_existing_order.status,
        'total_ngn', v_existing_order.total_ngn,
        'idempotent', true
      )
    );
  end if;

  -- 4. Validate lines count (1 to 10 lines)
  if jsonb_array_length(payload->'items') between 1 and 10 then
    null;
  else
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'VALIDATION_FAILED', 'message', 'Orders must contain between 1 and 10 items.'));
  end if;

  -- 5. Calculate subtotal and validate items
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select
      pv.id, pv.sku, pv.price_ngn, pv.stock_qty, pv.is_active,
      effective_price(pv) as current_eff_price,
      p.id as product_id, p.name as product_name, p.status as product_status,
      coalesce(pv.storage_gb::text || 'GB · ', '') || coalesce(pv.color, '') || ' · ' || pv.condition::text as variant_label
    into v_variant
    from product_variants pv
    join products p on p.id = pv.product_id
    where pv.id = (v_item->>'variant_id')::uuid;

    if not found or not v_variant.is_active or v_variant.product_status != 'published' then
      return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'ITEM_UNAVAILABLE', 'message', 'One or more selected items are no longer available.'));
    end if;

    if (v_item->>'qty')::int > v_variant.stock_qty then
      return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'OUT_OF_STOCK', 'message', 'Insufficient stock for ' || v_variant.product_name));
    end if;

    v_effective_price := v_variant.current_eff_price;
    v_line_total := v_effective_price * (v_item->>'qty')::int;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- 6. Verify client expected total (prevent price tampering or race with price changes)
  if v_subtotal != v_expected_total then
    return jsonb_build_object(
      'ok', false,
      'error', jsonb_build_object(
        'code', 'PRICE_CHANGED',
        'message', 'Prices have been updated since you viewed the items.',
        'details', jsonb_build_object('current_total', v_subtotal, 'expected_total', v_expected_total)
      )
    );
  end if;

  -- 7. Generate unique Public ID format KRN-YYMMDD-XXXXX
  v_today_str := to_char(now() at time zone 'Africa/Lagos', 'YYMMDD');
  loop
    v_attempts := v_attempts + 1;
    v_rand_suffix := upper(substr(md5(random()::text), 1, 5));
    v_public_id := 'KRN-' || v_today_str || '-' || v_rand_suffix;
    exit when not exists (select 1 from orders where public_id = v_public_id) or v_attempts > 10;
  end loop;

  -- 8. Insert Order
  insert into orders (
    public_id, idempotency_key, customer_name, customer_phone,
    fulfilment, delivery_state, delivery_city, delivery_address,
    customer_note, status, subtotal_ngn, delivery_fee_ngn, discount_ngn,
    utm, ip_hash
  ) values (
    v_public_id, v_idempotency_key, v_customer_name, v_customer_phone,
    v_fulfilment, v_delivery_state, v_delivery_city, v_delivery_address,
    v_customer_note, 'new', v_subtotal, 0, 0,
    payload->'utm', payload->>'ip_hash'
  )
  returning id into v_order_id;

  -- 9. Insert Order Items (with snapshots)
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select
      pv.id, pv.sku, effective_price(pv) as current_eff_price,
      p.name as product_name,
      coalesce(pv.storage_gb::text || 'GB · ', '') || coalesce(pv.color, '') || ' · ' || pv.condition::text as variant_label
    into v_variant
    from product_variants pv
    join products p on p.id = pv.product_id
    where pv.id = (v_item->>'variant_id')::uuid;

    insert into order_items (
      order_id, variant_id, product_name, variant_label, sku,
      listed_price_ngn, unit_price_ngn, qty
    ) values (
      v_order_id, v_variant.id, v_variant.product_name, v_variant.variant_label, v_variant.sku,
      v_variant.current_eff_price, v_variant.current_eff_price, (v_item->>'qty')::int
    );
  end loop;

  -- 10. Record Order Event
  insert into order_events (
    order_id, type, to_status, note, is_customer_visible
  ) values (
    v_order_id, 'created', 'new', 'Order created on website', true
  );

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'order_id', v_order_id,
      'public_id', v_public_id,
      'status', 'new',
      'total_ngn', v_subtotal
    )
  );
end;
$$;

-- Security: revoke public execution; only service_role executes create_order
revoke execute on function create_order(jsonb) from public, anon, authenticated;

-- Function: track_order (public tracking projection requiring BOTH public_id and phone)
create or replace function track_order(p_public_id text, p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_items jsonb;
  v_timeline jsonb;
begin
  select
    id, public_id, status, fulfilment, delivery_city, delivery_state,
    total_ngn, created_at, confirmed_at, shipped_at, delivered_at, cancelled_at
  into v_order
  from orders
  where public_id = p_public_id
    and customer_phone = p_phone;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'product_name', product_name,
      'variant_label', variant_label,
      'qty', qty,
      'unit_price_ngn', unit_price_ngn,
      'line_total_ngn', line_total_ngn
    )
  ), '[]'::jsonb)
  into v_items
  from order_items
  where order_id = v_order.id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'type', type,
      'to_status', to_status,
      'note', note,
      'created_at', created_at
    ) order by created_at asc
  ), '[]'::jsonb)
  into v_timeline
  from order_events
  where order_id = v_order.id and is_customer_visible = true;

  return jsonb_build_object(
    'public_id', v_order.public_id,
    'status', v_order.status,
    'fulfilment', v_order.fulfilment,
    'delivery_city', v_order.delivery_city,
    'delivery_state', v_order.delivery_state,
    'total_ngn', v_order.total_ngn,
    'created_at', v_order.created_at,
    'items', v_items,
    'timeline', v_timeline
  );
end;
$$;

revoke execute on function track_order(text, text) from public, anon, authenticated;

-- Function: transition_order
create or replace function transition_order(
  p_order_id uuid,
  p_to_status order_status,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_item record;
  v_actor_id uuid := auth.uid();
begin
  if not is_admin() or not has_mfa() then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Admin MFA verification required.'));
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Order not found.'));
  end if;

  -- State machine rules
  if (v_order.status = 'new' and p_to_status in ('confirmed', 'cancelled')) or
     (v_order.status = 'confirmed' and p_to_status in ('paid', 'cancelled')) or
     (v_order.status = 'paid' and p_to_status in ('processing', 'cancelled')) or
     (v_order.status = 'processing' and p_to_status in ('shipped', 'delivered', 'cancelled')) or
     (v_order.status = 'shipped' and p_to_status in ('delivered', 'cancelled'))
  then
    null;
  else
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'INVALID_TRANSITION', 'message', 'Cannot transition from ' || v_order.status || ' to ' || p_to_status));
  end if;

  -- Stock deduction on CONFIRMED
  if p_to_status = 'confirmed' then
    for v_item in select * from order_items where order_id = p_order_id and not stock_deducted loop
      update product_variants
      set stock_qty = stock_qty - v_item.qty
      where id = v_item.variant_id and stock_qty >= v_item.qty;

      if not found then
        raise exception 'INSUFFICIENT_STOCK: variant % has insufficient stock', v_item.variant_id;
      end if;

      update order_items set stock_deducted = true where id = v_item.id;
    end loop;
  end if;

  -- Stock restoration on CANCELLED
  if p_to_status = 'cancelled' then
    for v_item in select * from order_items where order_id = p_order_id and stock_deducted loop
      update product_variants
      set stock_qty = stock_qty + v_item.qty
      where id = v_item.variant_id;

      update order_items set stock_deducted = false where id = v_item.id;
    end loop;
  end if;

  -- Update order record
  update orders
  set status = p_to_status,
      confirmed_at = case when p_to_status = 'confirmed' then coalesce(confirmed_at, now()) else confirmed_at end,
      shipped_at = case when p_to_status = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
      delivered_at = case when p_to_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
      cancelled_at = case when p_to_status = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
      cancel_reason = case when p_to_status = 'cancelled' then coalesce(p_payload->>'reason', cancel_reason) else cancel_reason end
  where id = p_order_id;

  -- Add event log
  insert into order_events (
    order_id, type, from_status, to_status, actor_id, note, is_customer_visible
  ) values (
    p_order_id, 'status_changed', v_order.status, p_to_status, v_actor_id,
    p_payload->>'note', true
  );

  return jsonb_build_object('ok', true, 'data', jsonb_build_object('order_id', p_order_id, 'status', p_to_status));
end;
$$;
