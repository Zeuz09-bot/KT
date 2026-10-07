# Keraunous progress log

## Status
| Unit | Name | Status | Branch | Merged | Notes |
|---|---|---|---|---|---|
| P0 | Pre-flight | DONE | main | 2026-10-06 | Pre-flight audit complete, certified in docs/PREFLIGHT.md |
| U00 | Foundation and tooling | DONE | unit/u00-foundation | 2026-10-06 | All 30 tests pass; build clean; health endpoint live |
| U01 | Design system and layouts | DONE | unit/u01-design-system | 2026-10-06 | 24 UI primitives, storefront & admin components, PublicLayout & AdminLayout, /dev/ui showcase live, all 46 tests pass |
| U02 | Database and data access | DONE | unit/u02-database | 2026-10-07 | 58 tests pass; schema+RLS live on Supabase; repos, seed, and types committed |
| U03 | Admin authentication and roles | DONE | unit/u03-admin-auth | | 83 tests pass; MFA & role guards enforced; login/step-machine UI live; owner staff management & audit pages built; Migration 003 applied; bootstrap script tested |
| U04 | Media service | TODO | | | |
| U05 | Catalogue management | TODO | | | |
| U06 | Site content and settings | TODO | | | |
| U07 | Public catalogue pages | TODO | | | |
| U08 | Search and filters | TODO | | | |
| U09 | Wishlist and Order List | TODO | | | |
| U10 | Order service and WhatsApp handoff | TODO | | | |
| U11 | Order management | TODO | | | |
| U12 | Order tracking | TODO | | | |
| U13 | Trust and policy pages | TODO | | | |
| U14 | SEO, sharing and analytics | TODO | | | |
| U15 | Security hardening | TODO | | | |
| U16 | Notifications | TODO | | | |
| U17 | QA, observability, backups, launch | TODO | | | |

## Decisions
- 2026-10-06: Store Name: "Keraunous Tech Store" (also referenced as Keraunos Tech).
- 2026-10-06: Database Strategy: Option A (Hosted Supabase Dev/Staging project).
- 2026-10-06: Location: Ondo State.
- 2026-10-06: Operating Hours: 24/7.
- 2026-10-06: WhatsApp Business Number: `+2348070822409` (normalised E.164).
- 2026-10-06: Fulfilment: Pickup = Yes (Ondo State); Delivery States = Oyo (Ibadan), Lagos, Ondo, Ekiti, FCT (Abuja), Kogi, Ogun.
- 2026-10-06: Payment Account: OPay (`8070822409`).

## Deviations from blueprint
(unit, what changed, why, approved by)

## Follow-ups
- U01: Browser subagent Playwright driver download 404 (playwright-1.57.0-win32_x64.zip CDN issue); manual browser inspection or local Playwright binary install needed for headless browser sessions. (Low priority)
- U02: vitest uses pool:forks + singleFork:true to work around child-process OOM on this host. If machine memory improves, this can be reverted to the default pool.
- U02: Supabase PAT (sbp_fc56e...) was used to apply migrations — revoke it at https://supabase.com/dashboard/account/tokens after confirming it's no longer needed.

## Dependencies added
- next@15.5.27 — App Router framework
- react@19.3.0, react-dom@19.3.0 — UI runtime
- zod@3.25.76 — Server and client validation
- tailwindcss@3.4.19 — Design token styling
- vitest@2.1.9 — Unit test framework
- server-only@0.0.1 — Compile-time guard for server-only imports
- lucide-react@0.468.0 — Iconography
- clsx@2.1.1 + tailwind-merge@2.6.1 — Conditional class utilities
- @radix-ui/react-dialog@1.2.0 — Accessible modal and bottom sheet primitive
- @radix-ui/react-accordion@1.2.21 — Accessible accordion primitive
- @radix-ui/react-select@2.3.8 — Accessible select dropdown primitive
- @radix-ui/react-slot@1.2.0 — Polymorphic component rendering (asChild)
- @radix-ui/react-tabs@1.1.12 — Accessible tabs primitive
- @radix-ui/react-toast@1.2.6 — Accessible toast notifications
- embla-carousel-react@8.6.0 — Accessible touch carousel
- @testing-library/react@16.3.3 (dev) — Component test utilities
- @testing-library/user-event@14.6.7 (dev) — User event simulator for testing
- @testing-library/jest-dom@7.0.1 (dev) — DOM assertions for vitest
- jsdom@30.1.2 (dev) — DOM environment for vitest

## Manual steps pending (human)
- [ ] Create Supabase Dev project (for U02) and obtain project URL & keys. ✅ DONE 2026-10-07
- [ ] Revoke the Supabase PAT used during migrations: https://supabase.com/dashboard/account/tokens
- [ ] Test owner login at `/admin/login` using `owner@keraunous.ng` and enroll TOTP MFA with your authenticator app.
- [ ] Provide specific pickup street address in Ondo State (when ready for U06/U13).
