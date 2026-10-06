# Keraunous progress log

## Status
| Unit | Name | Status | Branch | Merged | Notes |
|---|---|---|---|---|---|
| P0 | Pre-flight | DONE | main | 2026-10-06 | Pre-flight audit complete, certified in docs/PREFLIGHT.md |
| U00 | Foundation and tooling | DONE | unit/u00-foundation | 2026-10-06 | All 30 tests pass; build clean; health endpoint live |
| U01 | Design system and layouts | TODO | | | |
| U02 | Database and data access | TODO | | | |
| U03 | Admin authentication and roles | TODO | | | |
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
(found during unit X, description, priority)

## Dependencies added
- next@15.5.27 — App Router framework
- react@19.3.0, react-dom@19.3.0 — UI runtime
- zod@3.25.76 — Server and client validation
- tailwindcss@3.4.19 — Design token styling
- vitest@2.1.9 — Unit test framework
- server-only@0.0.1 — Compile-time guard for server-only imports
- lucide-react@0.468.0 — Iconography
- clsx@2.1.1 + tailwind-merge@2.6.1 — Conditional class utilities

## Manual steps pending (human)
- [ ] Create Supabase Dev project (for U02) and obtain project URL & keys.
- [ ] Provide specific pickup street address in Ondo State (when ready for U06/U13).
