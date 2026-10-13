# Keraunous Tech Store — Go-Live Launch Checklist

This checklist verifies all criteria defined in **Blueprint §16.1 (Launch checklist)** prior to public go-live. Every item must be verified with documented evidence before directing public traffic to the store.

---

## 1. Content Readiness (Zero Placeholders)

- [ ] **Real Products Seeded**: Minimum 10 real phone and gadget products with genuine titles, descriptions, and specifications.
- [ ] **Real Prices in Naira**: All prices verified as integer Naira (`₦`) matching current Nigerian market rates. Zero `$`, zero decimals, zero dummy numbers.
- [ ] **Genuine Product Photos**: High-resolution WebP/AVIF images uploaded to Supabase Storage with clean transparent or studio backgrounds. No generic placeholder boxes.
- [ ] **Active Business WhatsApp**: Owner WhatsApp number configured in E.164 format (`+234...`) in `system_settings` and verified receiving messages.
- [ ] **Real Store Information**: Genuine pickup address in Lagos, store opening hours (Mon–Sat 9am–6pm), customer support contact email.
- [ ] **Zero Fabricated Social Proof**: Verified absence of fake customer counts ("2M+ customers"), fake reviews, fake star ratings, or manufactured countdown urgency.

---

## 2. Functional Readiness (End-to-End Verification)

- [ ] **Complete Order & WhatsApp Flow**: Order submitted via web checkout, saved to Supabase `orders` table as `PENDING`, customer redirected to `https://wa.me/234...` with pre-filled structured message.
- [ ] **Public Order Tracking**: Tracking lookup verified on `/track` using both order code (`KRN-YYMMDD-XXXXX`) and customer phone (`+234...`). Mismatched inputs yield generic security message.
- [ ] **Admin Order Lifecycle**: Admin transitions order `PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`. Stock deduction occurs upon `CONFIRMED`.
- [ ] **Stock Restoration on Cancellation**: Admin transitions order `CONFIRMED -> CANCELLED`. Variant `stock_quantity` restores automatically.
- [ ] **Out-of-Stock UX**: Variant with stock = 0 renders disabled "Out of Stock" button and prevents order submission.
- [ ] **Anti-Abuse Verification**: Rate limiter drops 6th order attempt from the same IP within an hour with HTTP 429 `RATE_LIMITED`.

---

## 3. Technical & Infrastructure Readiness

- [ ] **Custom Domain & SSL**: Custom domain (e.g. `keraunous.ng`) mapped via DNS with strict HTTPS enforcement (HSTS active).
- [ ] **Health Endpoint Operational**: `GET /api/health` returns HTTP 200 with `database: "healthy"`, latency reporting, and ISO timestamp.
- [ ] **Database RLS & Isolation**: Row Level Security verified active on all 14 tables. Anonymous role denied direct read access to `orders`.
- [ ] **Supabase Backups (PITR)**: Point-in-time-recovery enabled on Supabase dashboard. Snapshot script `node scripts/backup-db.mjs` executed and verified.
- [ ] **Upstash Redis Configuration**: Production `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set in environment.
- [ ] **Cloudflare Turnstile**: Production Turnstile sitekey and secret key configured; bot challenge active.
- [ ] **Sentry Error Tracking**: Production `SENTRY_DSN` configured; test unhandled exception captured in Sentry dashboard.
- [ ] **Telegram Notifications**: Telegram bot alerts active for `new_order` and daily summaries. Zero PII transmitted.
- [ ] **SEO & Metadata**: `robots.txt` and `sitemap.xml` validated with Google Search Console. OpenGraph and Twitter cards tested via Facebook Sharing Debugger.

---

## 4. Soft Launch Protocol (Controlled Group)

- [ ] **Trusted Contact Testing**: Share preview link with 5 trusted contacts across different devices (iOS Safari, Android Chrome, Desktop Chrome).
- [ ] **Real Test Orders**: Place 3 complete end-to-end test orders through the actual WhatsApp channel.
- [ ] **Admin Panel Real-time Update**: Verify that test orders appear immediately on `/admin/orders` with correct variant specifications and customer details.
- [ ] **Test Order Cancellation**: Transition 1 test order to `CANCELLED` and verify customer notification and inventory rollback.

---

## 5. Full Public Launch Day Execution

- [ ] **Switch DNS to Live Production**.
- [ ] **Verify `/api/health` Status**: Ensure latency < 250ms.
- [ ] **Announce on Official Channels**: Instagram, X (Twitter), WhatsApp Status, TikTok.
- [ ] **Active Sentry & Log Monitoring**: Monitor Sentry error streams and server access logs during the first 4 hours of peak traffic.
- [ ] **Periodic Health Ping**: Automated monitoring pinging `/api/health` every 5–15 minutes with instant alerts.
