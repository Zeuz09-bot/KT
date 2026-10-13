# Keraunous Tech Store — Load Testing Protocol & Benchmark Report

This document defines the load testing suites, performance thresholds, and execution protocols established for Keraunous Tech Store in accordance with **Blueprint §13.3 (Load and stress testing)**.

---

## 1. Test Scenarios & SLO Targets

| Scenario | Target Load | Duration | Latency SLO (P95) | Error Rate SLO | Script File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Storefront Browsing** | 300 concurrent VUs | 2m (ramp + steady) | `< 800ms` | `< 1.0%` | `scripts/k6/browse-storefront.js` |
| **Search Suggestions** | 100 requests / sec | 1m steady | `< 200ms` | `< 1.0%` | `scripts/k6/search-suggestions.js` |
| **Order Creation** | 20 orders / min | 2m steady | `< 1200ms` | `< 5.0%` | `scripts/k6/order-creation.js` |
| **Abuse Throttling** | 100 orders/min from 1 IP | 30s burst | Rate limit triggered (429) within 3-5 req | N/A (429 expected) | `scripts/k6/abuse-throttling.js` |
| **Order Tracking** | 50 lookups / min | 2m steady | `< 400ms` | `< 5.0%` | `scripts/k6/track-lookups.js` |

---

## 2. Prerequisites & Installation

To run these tests locally or against staging/preview environments:

1. Install **k6**:
   - **Windows** (winget / choco): `winget install k6` or `choco install k6`
   - **macOS** (Homebrew): `brew install k6`
   - **Linux** (apt): `sudo gpg -k && sudo apt-get install k6`
   - Alternatively run via Docker: `docker run --rm -i grafana/k6 run - < scripts/k6/browse-storefront.js`

2. Ensure your target application server is running:
   ```bash
   pnpm start
   # Serving on http://localhost:3000
   ```

---

## 3. Running the Test Suites

### 3.1 Storefront Browsing (300 VUs)
Simulates concurrent shoppers browsing the homepage, catalogue, and tracking pages:
```bash
k6 run -e BASE_URL=http://localhost:3000 scripts/k6/browse-storefront.js
```

### 3.2 Search Suggestions (100 req/s)
Simulates rapid debounce search querying:
```bash
k6 run -e BASE_URL=http://localhost:3000 scripts/k6/search-suggestions.js
```

### 3.3 Order Creation (20 orders/min)
Simulates high-velocity customer order submissions:
```bash
k6 run -e BASE_URL=http://localhost:3000 -e TEST_VARIANT_ID=<uuid> scripts/k6/order-creation.js
```

### 3.4 Abuse Throttling (Single-IP DDoS Burst)
Verifies that Upstash / sliding-window rate limiting drops excessive requests with HTTP 429:
```bash
k6 run -e BASE_URL=http://localhost:3000 scripts/k6/abuse-throttling.js
```

### 3.5 Order Tracking Lookups (50 lookups/min)
Verifies database index and RPC response time for order status queries:
```bash
k6 run -e BASE_URL=http://localhost:3000 scripts/k6/track-lookups.js
```

---

## 4. Bottleneck Analysis & Mitigation Strategies

1. **Database Connection Pool Exhaustion**:
   - *Symptom*: Latency spike on order creation (> 2000ms) or 500 errors with connection timeouts.
   - *Mitigation*: Ensure Supabase transaction pooler (port 6543) is used rather than session mode. Supabase functions (`create_order`, `track_order`) execute in single atomic roundtrips.

2. **Upstash Rate Limiting Latency**:
   - *Symptom*: High latency (> 300ms) before API route code executes.
   - *Mitigation*: Regional locality — ensure Upstash Redis instance is in the same primary region as Next.js hosting (e.g., `eu-west-1` or `iad1`).

3. **Catalogue Image Bandwidth**:
   - *Symptom*: Storefront page weight degradation under 300 VUs.
   - *Mitigation*: Supabase Storage images use Next.js `<Image />` optimization with remote patterns and WebP/AVIF compression.
