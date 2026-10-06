# PREFLIGHT.md — Step P0 Pre-Flight Audit & Environment Certification

> **Project**: Keraunous Tech Store  
> **Status**: P0 Audit Complete · Ready for U00  
> **Date**: 2026-10-06  

---

## 1. Product Understanding (25 Core Bullets)

1. **Mission & Market**: Keraunous Tech Store is a phone and gadget showcase catalog tailored for the Nigerian market, pricing all inventory exclusively in integer Naira (`₦`).
2. **Accountless Customer Model**: No customer accounts or passwords exist in v1. Customers browse freely and order with zero friction or credential management.
3. **Save-Before-Send Architecture**: Every order is validated, computed, and saved in the database with a cryptorandom public ID (`KRN-YYMMDD-XXXXX`) *before* generating the WhatsApp link.
4. **WhatsApp Handoff**: The application formats a structured, human-readable WhatsApp message and routes customers to `https://wa.me/<number>` using the server-configured business phone.
5. **Omnichannel Handoff Fallbacks**: For users without the mobile app, `/order/sent` provides one-click message copying, WhatsApp Web direct dispatch, and a scannable QR code.
6. **No Online Payment Gateway**: Card payments via online gateways are strictly out of scope for v1. Customers pay via direct bank transfer offline.
7. **Anti-Scam Verification Protocol**: Sellers verify received funds directly inside their official banking app (OPay). Payment alerts and customer transfer screenshots are never accepted as proof of release.
8. **Public Order Tracking**: Customers monitor status at `/track` by inputting their public order ID and normalized phone number (`+234...`), exposing a minimal, sanitized progress projection.
9. **Server-Authoritative Pricing**: Browser prices are strictly presentational. Order subtotals and discounts are calculated server-side; discrepancies return `409 PRICE_CHANGED`.
10. **Multi-Dimensional Variant Catalog**: Products support variants spanning `(product_id, storage_gb, color, condition)`, with condition spanning `brand_new`, `uk_used`, and `open_box`.
11. **Time-Aware Pricing (`effective_price`)**: The PostgreSQL function `effective_price(v)` determines live prices based on current server timestamp and active sale date windows.
12. **Seven-Stage Order Lifecycle**: Orders progress strictly via: `new` → `confirmed` → `paid` → `processing` → `shipped` → `delivered` (or `cancelled`).
13. **Stock Reservation Logic**: Inventory is checked at `new`, atomically deducted when transitioning to `confirmed`, and restored upon cancellation.
14. **IMEI Fulfillment Governance**: Advancing any smartphone from `processing` to `shipped` mandates recording the device's physical IMEI number for warranty tracking.
15. **Staff vs. Owner Role Hierarchy**: Staff manage catalog, orders, and content; the Owner alone can execute bulk price adjustments, alter business settings, view audit logs, and cancel paid orders.
16. **Admin Authentication & Mandatory MFA**: Admin entry requires Supabase Auth with enforced TOTP MFA (`AAL2`), with role validation enforced inside every server action and database policy.
17. **Strict Row Level Security (RLS)**: Enabled across 100% of database tables. Anonymous visitors have read-only access to published catalog and public settings; zero anonymous access to orders or audit logs.
18. **Atomic RPC Database Mutations**: All order creations and state changes occur exclusively through `SECURITY DEFINER` stored procedures (`create_order`, `transition_order`).
19. **Order List (No Traditional Cart)**: The cart is replaced by an "Order List" holding only `{ variantId, qty }` in local storage, resolving fresh pricing on focus via `/api/list/resolve`.
20. **Client-Only Device Wishlist**: Saved favorites persist in client `localStorage` (`krn:wish:v1`) with zero backend user tracking.
21. **Zero Fabricated Social Proof**: No invented review counts, ratings, fake testimonials, or false customer volume statistics ("2M+ customers").
22. **Abuse & Bot Deterrence**: Cloudflare Turnstile token verification on order and tracking endpoints, paired with Upstash Redis rate limiting and IP/phone blocklists.
23. **Explicit Non-Goals (v1)**: Online card checkouts, customer authentication, installment/EMI credit plans, customer reviews, discount promo codes, and automated live courier rate calculations.
24. **Multi-Channel Direct Inquiry**: Customers can click "Ask a question" on any product to initiate a plain WhatsApp conversation containing the product link without generating an order record.
25. **Administrative Kill Switch**: The `orders_enabled` setting instantly shifts customer action buttons to "Ordering paused, message us on WhatsApp", preventing broken checkouts during maintenance.

---

## 2. Contradictions, Gaps & Risky Assumptions in Blueprint

### 2.1 Concurrency Window on Stock Reservation (§5.6 & §7.7)
- **Finding**: Orders in status `new` do not deduct stock; deduction occurs only upon transitioning to `confirmed`.
- **Risk**: If two customers submit orders for a single remaining device simultaneously, both receive valid `new` orders. The second customer to be confirmed will fail with `INSUFFICIENT_STOCK`.
- **Mitigation & Standard**: The WhatsApp message explicitly advises: *"Please confirm availability and the final price"*, ensuring the seller verifies inventory on chat before requesting payment.

### 2.2 Phone Number Normalization & Regex (§7.2 vs §8.3)
- **Finding**: Blueprint §7.2 specifies `check (customer_phone ~ '^\+234[789][01][0-9]{8}$')`.
- **Verification**: Nigeria's NCC numbering plan assigns prefixes including `0802`, `0803`, `0805`, `0807`, `0808`, `0809`, `0810`-`0818`, `0701`-`0709`, `0901`-`0919`. In E.164, the leading zero is dropped (`08070822409` → `+2348070822409`).
- **Validation**: The regex correctly matches `+234` + `[789]` + `[01]` + `8 digits`. All mobile prefixes in Nigeria start with `070`, `080`, `081`, `090`, `091`, so the normalized second digit is always `0` or `1`. This constraint is sound and prevents invalid prefixes.

### 2.3 Service Role Isolation in Next.js (§6.2 & §7.7)
- **Finding**: `create_order` RPC execution is revoked from public roles and callable only by the service-role client.
- **Requirement**: `lib/supabase/service.ts` must declare `import 'server-only'` to guarantee compiler-level prevention against client bundle leaks.

### 2.4 Windows PowerShell Script Execution Policy
- **Finding**: Windows systems frequently disable `.ps1` execution by default (`PSSecurityException` on `npm` or `pnpm`).
- **Standard**: All tooling scripts and CI commands in this workspace must invoke binary wrappers explicitly (`npm.cmd`, `npx.cmd`, `pnpm.cmd`) or set execution policies for the active process.

---

## 3. Reconciliation: Stitch Design vs. Blueprint Spec

The exported Stitch mockups in [`docs/design/`](file:///c:/Users/tohee/OneDrive/Desktop/KT/docs/design/README.md) serve as visual reference only for component structure, color palette, typography, and spacing. The following discrepancies are reconciled in code:

| Design Mockup Element | Stitch Visual Default | Blueprint Specification (Keraunous Tech) | Implementation Rule |
| :--- | :--- | :--- | :--- |
| **Currency** | `$` ("$999", "$1,199") | Integer Naira `₦` (`₦1,650,000`) | Use `lib/money.ts` formatter everywhere. |
| **Financing / Credit** | "0% EMI available", "Free engraving" | Removed entirely | Zero installment references. |
| **Cart Modal / Page** | Traditional Cart with "Checkout" button | **Order List** with "Order on WhatsApp" | Renamed component, local storage only. |
| **Checkout Flow** | `Checkout.jpeg` (Shipping/Billing/Card inputs) | Replaced by quick customer details bottom sheet | Collects name, phone, city, delivery/pickup. |
| **Payment Gateways** | `PaymentMethod.jpeg` (Visa, PayPal, Apple Pay) | Removed; offline bank transfer only | No gateway integrations. |
| **Order Confirmation** | `OrderSuccess.jpeg` (Generic order receipt) | `/order/sent` handoff screen | Prominent "Open WhatsApp", copy fallback, QR code. |
| **Reviews & Ratings** | Star ratings and review counts ("4.9 (2.3k)") | Removed until real post-purchase reviews exist | Clean product cards without fabricated counts. |
| **Social Proof Claims** | "Trusted by 2M+ customers worldwide" | Removed | Genuine business trust markers only. |
| **Newsletter** | "Stay Connected" email submission | "Join our WhatsApp Channel / Broadcast" | Links to official WhatsApp broadcast channel. |
| **Navbar Profile** | User avatar "J" | Removed | No customer accounts or logins. |

---

## 4. Bootstrap Toolchain & Commands for Unit U00

### 4.1 Verified Package Versions
- **Next.js**: `^15.1.0` (App Router)
- **React**: `^19.0.0`
- **TypeScript**: `^5.7.0` (with `strict: true`)
- **Tailwind CSS**: `^3.4.0` (with design tokens from Stitch)
- **Zod**: `^3.24.0` (shared client/server validation contracts)
- **Vitest**: `^2.1.0` (fast unit testing for pure logic)
- **Lucide React**: `^0.468.0` (iconography matching Stitch mockups)

### 4.2 Bootstrap Execution Sequence
```bash
# 1. Initialize Next.js skeleton in current workspace
npx.cmd -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm

# 2. Install core runtime dependencies
pnpm.cmd add zod react-hook-form @hookform/resolvers clsx tailwind-merge lucide-react server-only

# 3. Install development & testing toolchain
pnpm.cmd add -D vitest @types/node prettier eslint-config-prettier husky lint-staged
```

---

## 5. Database Environment Recommendation

- **Certified Recommendation**: **Option A (Hosted Supabase Dev Project)**.
- **Rationale**:
  1. Bandwidth Efficiency: Avoids downloading multi-gigabyte Docker images.
  2. High-Fidelity Matching: Matches cloud PostgreSQL version, PostgREST API, Supabase Auth AAL2 TOTP, and Storage configurations identically.
  3. Dashboard Accessibility: Direct access to Supabase Studio for table inspection, log exploration, and MFA configuration without maintaining local daemon processes.

---

## 6. Business Parameters & Readiness Matrix

### 6.1 Confirmed Business Parameters
- **Legal & Display Name**: Keraunous Tech Store (Brand: Keraunos Tech)
- **Operating Location**: Ondo State, Nigeria
- **Operating Hours**: 24/7
- **Official WhatsApp Number**: `+2348070822409` (international E.164)
- **Order Fulfilment Options**:
  - In-person Store Pickup: **Enabled (Ondo State)**
  - Delivery Coverage: **Oyo (Ibadan), Lagos, Ondo, Ekiti, FCT (Abuja), Kogi, Ogun**
- **Official Payment Channel**: **OPay (Account No: `8070822409`)**

### 6.2 Pre-Flight Sign-Off
- **Step P0 Status**: `PASS`
- **Readiness for Unit U00**: **APPROVED**
- **Next Action**: Execute `/start-unit U00` on branch `unit/u00-foundation`.
