# Keraunous Tech Store: Search Engine & Business Profile Guide

This guide details the operational steps for the business owner to register Keraunous Tech Store with Google Search Console, submit the dynamic XML sitemap, and establish a verified Google Business Profile in Ondo State.

---

## 1. Google Search Console Setup

### Step 1: Claim Domain Property
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain** property type and enter `keraunous.ng`.
3. Copy the `TXT` DNS verification record provided by Google (e.g. `google-site-verification=...`).
4. Sign in to your DNS provider (e.g., Cloudflare, Namecheap, or Whogohost) and add a TXT record to your root apex domain.
5. Click **Verify** in Search Console.

### Step 2: Submit Dynamic Sitemap
1. Once ownership is verified, go to **Index** &rarr; **Sitemaps** in the left sidebar.
2. In the "Add a new sitemap" input, enter:
   ```text
   sitemap.xml
   ```
3. Click **Submit**.
4. Verify that Google shows status **Success** and reports discovered URLs (core static pages + published products + categories + brands).

### Step 3: Monitor Rich Results (JSON-LD)
1. In Search Console, inspect a live product URL (e.g. `https://keraunous.ng/product/iphone-15-pro-max`).
2. Confirm that Google detects the **Product** schema with currency `NGN` and in-stock offers.
3. Test using Google's public [Rich Results Test](https://search.google.com/test/rich-results) tool to ensure zero syntax warnings.

---

## 2. Google Business Profile Setup (Ondo State Local SEO)

A verified local business listing gives Keraunous high visibility on Google Maps and Nigerian local search queries (e.g., "iPhone store Akure", "gadget store Ondo state").

### Step 1: Create Business Profile
1. Visit [Google Business Profile](https://www.google.com/business/).
2. Enter business name: **Keraunous Tech Store** (or Keraunos Tech).
3. Select primary category: **Electronics Store** or **Cell Phone Store**.
4. Secondary categories:
   - *Computer Store*
   - *Mobile Phone Repair Shop* (if repair services offered)

### Step 2: Set Location & Service Areas
1. Choose **Yes** to having a location customers can visit.
2. Enter your physical hub address in **Ondo State, Nigeria**.
3. Specify Service Areas for delivery:
   - Ondo State (Akure, Ondo Town, etc.)
   - Ekiti State
   - Oyo State (Ibadan)
   - Osun State
   - Ogun State
   - Lagos State
   - Federal Capital Territory (Abuja)
   - Kogi State

### Step 3: Contact Details & Website
1. Primary Phone Number: `+234 807 082 2409` (matches official website WhatsApp line).
2. Website URL: `https://keraunous.ng`
3. Opening Hours: Set to **Open 24 hours** for online ordering, or specify your daytime storefront visiting hours (e.g., Mon–Sat 9:00 AM – 6:00 PM).

### Step 4: Verification
1. Complete verification via Video Verification or SMS/Phone call to `0807 082 2409`.
2. Upload genuine storefront photos, product display showcases, and your branded sign board.

---

## 3. WhatsApp Social Link Preview Verification

When sharing links to `https://keraunous.ng/product/[slug]` on WhatsApp:
- WhatsApp scrapes the page and reads:
  - `<meta property="og:title" ...>`
  - `<meta property="og:description" ...>`
  - `<meta property="og:image" ...>` pointing to `/api/og/product?...`
- The dynamic OG image route produces a 1200x630 card showing:
  - Product name and Brand
  - Verified Naira price pill (`From ₦X`)
  - Direct WhatsApp handoff badge
  - Official WhatsApp number (+234 807 082 2409)
