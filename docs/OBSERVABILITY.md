# Keraunous Tech Store: Observability & Monitoring Guide

## 1. Overview
This document specifies the observability architecture, monitoring signals, error budgets, and alerting rules for Keraunous Tech Store per Blueprint §13, §15.3, and §16.

---

## 2. Health Check Endpoint

### Endpoint: `GET /api/health`
- **Purpose**: High-frequency uptime ping verifying both Next.js edge runtime and Supabase PostgreSQL connectivity.
- **Cache**: `Cache-Control: no-store, no-cache, must-revalidate` (never cached).
- **Responses**:
  - `200 OK`: Server and database operational.
    ```json
    {
      "ok": true,
      "version": "0.1.0",
      "service": "keraunous-tech-store",
      "database": "healthy",
      "dbLatencyMs": 14,
      "timestamp": "2026-10-13T17:00:00.000Z"
    }
    ```
  - `503 Service Unavailable`: Database degraded or unreachable.

### External Uptime Pingers
Configure an external uptime monitor (e.g. BetterStack, UptimeRobot, Checkly):
1. **Target URL**: `https://keraunous.ng/api/health`
2. **Frequency**: Every 60 seconds.
3. **Timeout**: 5000 ms.
4. **Expected Status**: `200 OK`.
5. **Alert Policy**: Notify owner immediately on 2 consecutive failed pings (SMS/Email/Telegram).

---

## 3. Error Tracking (Sentry)

### Setup Instructions
1. Install Sentry Next.js SDK: `pnpm add @sentry/nextjs`.
2. Configure `SENTRY_DSN` in deployment environment variables.
3. Ensure PII sanitization in `sentry.client.config.ts` and `sentry.server.config.ts`:
   - Mask phone numbers matching `^\+?234[789][01]\d{8}$`.
   - Strip headers: `Authorization`, `Cookie`.
   - Strip body fields: `password`, `token`, `secret`, `delivery_address`.
4. Release tracking: Tag releases with git commit SHA (e.g. `keraunous@<git_sha>`).

### Alert Thresholds
| Alert | Condition | Destination |
|---|---|---|
| Critical Exception Spike | > 5 unhandled errors in 5 minutes | Owner Telegram / Phone |
| API Degradation | `/api/orders` error rate > 1% in 15 min | Owner Email / Slack |
| High Latency Regression | LCP p75 > 3.0s | Owner Dashboard |

---

## 4. Structured Logging & PII Redaction
All server actions and API handlers log structured JSON via [`lib/logger.ts`](file:///c:/Users/tohee/OneDrive/Desktop/KT/lib/logger.ts):
- Automatic Nigerian phone masking (`+23480****2409`).
- Deterministic 16-character SHA-256 IP hashing (`hashIp()`).
- Automated redaction of passwords, tokens, Turnstile response secrets, and street addresses.
- Zero secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`) ever emitted to logs.

---

## 5. Security & Operational Signals

| Signal | Source | Alert Action |
|---|---|---|
| Order Spam Flood | `RATE_LIMITED` on `/api/orders` (5/hr) | Blocklist entry + review Turnstile logs |
| Track ID Enumeration | `RATE_LIMITED` on `/api/track` (5/10min) | Logged + throttled with constant latency |
| Admin Brute Force | 5 failed logins in 15 min | `owner_alerts` recorded + Telegram alert fired |
| WhatsApp Number Change | `settings.whatsapp_changed` in admin | Critical alert dispatched to owner immediately |
| New Staff Invited | `auth.staff_invited` | Info alert dispatched to owner |
| Orders Without WhatsApp (>30m) | `/api/cron/notifications` | Warning alert dispatched to seller desk |
