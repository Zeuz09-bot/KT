-- =====================================================================
-- Keraunous Tech Store — Seed Data
-- Blueprint: Section 7.8 & Project Decisions
-- =====================================================================

-- 1. SITE SETTINGS
insert into site_settings (key, value, is_public) values
('business_profile', jsonb_build_object(
  'name', 'Keraunous Tech Store',
  'brand_name', 'Keraunos Tech',
  'location', 'Ondo State, Nigeria',
  'hours', '24/7',
  'whatsapp_number', '+2348070822409',
  'phone_display', '0807 082 2409',
  'pickup_available', true,
  'pickup_state', 'Akure, Lagos'
), true),
('payment_info', jsonb_build_object(
  'bank_name', 'OPay',
  'account_number', '8070822409',
  'account_name', 'Keraunous Tech Store',
  'verification_policy', 'All payments are verified via in-app credit check before releasing items. We never release on bank alert screenshots alone.'
), true),
('delivery_coverage', jsonb_build_object(
  'states', jsonb_build_array('Ondo', 'Lagos', 'Oyo', 'Ekiti', 'FCT', 'Kogi', 'Ogun'),
  'default_delivery_fee_ngn', 4500,
  'pickup_fee_ngn', 0
), true),
('orders_enabled', jsonb_build_object('enabled', true), true),
('hold_hours', jsonb_build_object('hours', 24), false),
('auto_cancel_stale', jsonb_build_object('enabled', false), false)
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public;

-- 2. CATEGORIES
insert into categories (id, name, slug, sort_order, is_active) values
('10000000-0000-0000-0000-000000000001', 'Smartphones', 'smartphones', 1, true),
('10000000-0000-0000-0000-000000000002', 'Tablets', 'tablets', 2, true),
('10000000-0000-0000-0000-000000000003', 'Smartwatches', 'smartwatches', 3, true),
('10000000-0000-0000-0000-000000000004', 'Earbuds & Audio', 'earbuds-audio', 4, true),
('10000000-0000-0000-0000-000000000005', 'Original Accessories', 'accessories', 5, true)
on conflict (slug) do nothing;

-- 3. BRANDS
insert into brands (id, name, slug, sort_order, is_active) values
('20000000-0000-0000-0000-000000000001', 'Apple', 'apple', 1, true),
('20000000-0000-0000-0000-000000000002', 'Samsung', 'samsung', 2, true),
('20000000-0000-0000-0000-000000000003', 'Google', 'google', 3, true),
('20000000-0000-0000-0000-000000000004', 'OnePlus', 'oneplus', 4, true),
('20000000-0000-0000-0000-000000000005', 'Xiaomi', 'xiaomi', 5, true),
('20000000-0000-0000-0000-000000000006', 'Infinix', 'infinix', 6, true)
on conflict (slug) do nothing;

-- 4. PRODUCTS & VARIANTS
-- P1: iPhone 15 Pro Max
insert into products (id, slug, name, brand_id, category_id, short_description, description, specs, badge, is_featured, featured_rank, status, published_at) values
('30000000-0000-0000-0000-000000000001', 'iphone-15-pro-max', 'iPhone 15 Pro Max',
 '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'Titanium design with A17 Pro chip, 5x telephoto camera, and USB-C.',
 'The ultimate iPhone featuring a lightweight titanium aerospace-grade frame, Action button, and 48MP main camera with 5x optical zoom. Includes original charger and warranty.',
 jsonb_build_object('processor', 'Apple A17 Pro (3nm)', 'screen', '6.7 inch Super Retina XDR OLED', 'battery', '4441 mAh', 'camera', '48MP + 12MP + 12MP'),
 'best_seller', true, 1, 'published', now())
on conflict (slug) do nothing;

insert into product_variants (product_id, sku, storage_gb, ram_gb, color, color_hex, condition, price_ngn, compare_at_price_ngn, sale_price_ngn, stock_qty) values
('30000000-0000-0000-0000-000000000001', 'IP15PM-256-NAT-BN', 256, 8, 'Natural Titanium', '#9C958A', 'brand_new', 1450000, 1550000, 1420000, 6),
('30000000-0000-0000-0000-000000000001', 'IP15PM-512-BLU-BN', 512, 8, 'Blue Titanium', '#3B444B', 'brand_new', 1650000, null, null, 4),
('30000000-0000-0000-0000-000000000001', 'IP15PM-256-BLK-UK', 256, 8, 'Black Titanium', '#1C1C1E', 'uk_used', 1280000, 1350000, null, 3)
on conflict (sku) do nothing;

insert into product_images (product_id, path, alt, is_primary, sort_order) values
('30000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', 'iPhone 15 Pro Max Natural Titanium front and back', true, 1)
on conflict do nothing;

-- P2: Samsung Galaxy S24 Ultra
insert into products (id, slug, name, brand_id, category_id, short_description, description, specs, badge, is_featured, featured_rank, status, published_at) values
('30000000-0000-0000-0000-000000000002', 'galaxy-s24-ultra', 'Samsung Galaxy S24 Ultra',
 '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 'Galaxy AI flagship with built-in S Pen, 200MP camera, and titanium frame.',
 'Samsung flagship with anti-reflective flat display, Snapdragon 8 Gen 3 for Galaxy, and full suite of Galaxy AI features. Tested, verified and ready for delivery.',
 jsonb_build_object('processor', 'Snapdragon 8 Gen 3', 'screen', '6.8 inch Dynamic LTPO AMOLED 2X', 'battery', '5000 mAh', 'camera', '200MP Quad Camera'),
 'new', true, 2, 'published', now())
on conflict (slug) do nothing;

insert into product_variants (product_id, sku, storage_gb, ram_gb, color, color_hex, condition, price_ngn, compare_at_price_ngn, sale_price_ngn, stock_qty) values
('30000000-0000-0000-0000-000000000002', 'S24U-256-GRY-BN', 256, 12, 'Titanium Gray', '#5A5B5D', 'brand_new', 1350000, 1420000, null, 5),
('30000000-0000-0000-0000-000000000002', 'S24U-512-BLK-BN', 512, 12, 'Titanium Black', '#2A2B2D', 'brand_new', 1520000, null, null, 2),
('30000000-0000-0000-0000-000000000002', 'S24U-256-VLT-UK', 256, 12, 'Titanium Violet', '#4B3F56', 'uk_used', 1180000, 1250000, null, 2)
on conflict (sku) do nothing;

insert into product_images (product_id, path, alt, is_primary, sort_order) values
('30000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80', 'Samsung Galaxy S24 Ultra Titanium', true, 1)
on conflict do nothing;

-- P3: Google Pixel 8 Pro
insert into products (id, slug, name, brand_id, category_id, short_description, description, specs, badge, is_featured, featured_rank, status, published_at) values
('30000000-0000-0000-0000-000000000003', 'pixel-8-pro', 'Google Pixel 8 Pro',
 '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
 'Pure Android experience with Google Tensor G3 and pro camera controls.',
 'Super Actua display, thermometer sensor, and 7 years of promised OS updates. Outstanding portrait and night photography.',
 jsonb_build_object('processor', 'Google Tensor G3', 'screen', '6.7 inch LTPO OLED 120Hz', 'battery', '5050 mAh', 'camera', '50MP Triple Pro'),
 null, false, null, 'published', now())
on conflict (slug) do nothing;

insert into product_variants (product_id, sku, storage_gb, ram_gb, color, color_hex, condition, price_ngn, compare_at_price_ngn, sale_price_ngn, stock_qty) values
('30000000-0000-0000-0000-000000000003', 'P8P-128-BAY-BN', 128, 12, 'Bay Blue', '#6FA8DC', 'brand_new', 850000, 920000, 810000, 3),
('30000000-0000-0000-0000-000000000003', 'P8P-256-OBS-UK', 256, 12, 'Obsidian', '#1F2022', 'uk_used', 720000, 780000, null, 4)
on conflict (sku) do nothing;

insert into product_images (product_id, path, alt, is_primary, sort_order) values
('30000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', 'Google Pixel 8 Pro Bay Blue', true, 1)
on conflict do nothing;

-- P4: iPhone 14 Pro (Popular UK Used item)
insert into products (id, slug, name, brand_id, category_id, short_description, description, specs, badge, is_featured, featured_rank, status, published_at) values
('30000000-0000-0000-0000-000000000004', 'iphone-14-pro', 'iPhone 14 Pro',
 '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'Dynamic Island, Always-On display, 48MP camera in Deep Purple and Gold.',
 'Grade A++ UK Used with 90%+ battery health. Tested and verified hardware.',
 jsonb_build_object('processor', 'Apple A16 Bionic', 'screen', '6.1 inch Super Retina XDR OLED', 'battery', '3200 mAh', 'camera', '48MP + 12MP + 12MP'),
 'hot', true, 3, 'published', now())
on conflict (slug) do nothing;

insert into product_variants (product_id, sku, storage_gb, ram_gb, color, color_hex, condition, price_ngn, compare_at_price_ngn, sale_price_ngn, stock_qty) values
('30000000-0000-0000-0000-000000000004', 'IP14P-128-PUR-UK', 128, 6, 'Deep Purple', '#433D4C', 'uk_used', 890000, 950000, null, 5),
('30000000-0000-0000-0000-000000000004', 'IP14P-256-GLD-UK', 256, 6, 'Gold', '#FBE2B5', 'uk_used', 960000, 1020000, null, 2),
('30000000-0000-0000-0000-000000000004', 'IP14P-128-SPC-UK', 128, 6, 'Space Black', '#1D1D1F', 'uk_used', 890000, null, null, 0) -- Sold out variant for testing
on conflict (sku) do nothing;

insert into product_images (product_id, path, alt, is_primary, sort_order) values
('30000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80', 'iPhone 14 Pro Deep Purple', true, 1)
on conflict do nothing;

-- P5: iPad Pro 11-inch
insert into products (id, slug, name, brand_id, category_id, short_description, description, specs, badge, is_featured, featured_rank, status, published_at) values
('30000000-0000-0000-0000-000000000005', 'ipad-pro-11-m4', 'iPad Pro 11-inch (M4)',
 '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
 'Breakthrough Ultra Retina XDR OLED display powered by Apple M4 chip.',
 'Impossibly thin design with game-changing graphics performance and all-day battery life.',
 jsonb_build_object('processor', 'Apple M4', 'screen', '11 inch Ultra Retina XDR Tandem OLED', 'battery', '31.29 Wh', 'camera', '12MP Wide + LiDAR'),
 'new', false, null, 'published', now())
on conflict (slug) do nothing;

insert into product_variants (product_id, sku, storage_gb, ram_gb, color, color_hex, condition, price_ngn, compare_at_price_ngn, sale_price_ngn, stock_qty) values
('30000000-0000-0000-0000-000000000005', 'IPADM4-256-SPC-BN', 256, 8, 'Space Black', '#202124', 'brand_new', 1390000, 1490000, null, 3),
('30000000-0000-0000-0000-000000000005', 'IPADM4-512-SLV-BN', 512, 8, 'Silver', '#E3E4E5', 'brand_new', 1650000, null, null, 2)
on conflict (sku) do nothing;

insert into product_images (product_id, path, alt, is_primary, sort_order) values
('30000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80', 'iPad Pro 11 inch M4 Space Black', true, 1)
on conflict do nothing;

-- P6: AirPods Pro 2
insert into products (id, slug, name, brand_id, category_id, short_description, description, specs, badge, is_featured, featured_rank, status, published_at) values
('30000000-0000-0000-0000-000000000006', 'airpods-pro-2-usbc', 'Apple AirPods Pro 2 (USB-C)',
 '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
 'Up to 2x more Active Noise Cancellation with Transparency mode and USB-C MagSafe case.',
 'Original brand new sealed with Apple international warranty and serial verification.',
 jsonb_build_object('chip', 'Apple H2', 'battery', 'Up to 6 hours listening', 'case', 'MagSafe USB-C with speaker and lanyard loop'),
 null, false, null, 'published', now())
on conflict (slug) do nothing;

insert into product_variants (product_id, sku, storage_gb, ram_gb, color, color_hex, condition, price_ngn, compare_at_price_ngn, sale_price_ngn, stock_qty) values
('30000000-0000-0000-0000-000000000006', 'APP2-USBC-WHT-BN', null, null, 'White', '#FFFFFF', 'brand_new', 340000, 370000, 325000, 8)
on conflict (sku) do nothing;

insert into product_images (product_id, path, alt, is_primary, sort_order) values
('30000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80', 'Apple AirPods Pro 2 in Charging Case', true, 1)
on conflict do nothing;
