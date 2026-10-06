# Keraunous: Antigravity Master Prompt and Implementation Plan

How to get Google Antigravity to build the Keraunous store **unit by unit**, with guardrails so the result is correct, secure and connected.

**Companion file:** `Keraunous_Build_Blueprint.md` (the full spec). Everything below assumes that file is saved in your repo as `docs/BLUEPRINT.md`.

---

## Part 1. Why a plan like this is needed

AI coding agents are fast but fail in predictable ways. Each one has a counter-measure built into this plan.

| Typical failure | What it looks like | Counter-measure in this plan |
| --- | --- | --- |
| **Context drift** | Agent forgets earlier decisions, invents new patterns | One unit per conversation; `AGENTS.md` (always loaded) + `docs/PROGRESS.md` as memory |
| **Scope creep** | Agent "improves" unrelated files, breaks finished units | Branch per unit, explicit scope, "follow-ups" list instead of silent changes |
| **Plausible but wrong code** | Compiles, but price logic or RLS is wrong | Tests first for money, stock, RLS; hostile review of critical units |
| **Hallucinated packages / APIs** | Imports that don't exist, outdated Next.js or Supabase usage | Rule: verify every dependency, read the installed version's docs, pin versions |
| **Security shortcuts** | "Temporarily" disabling RLS, hard-coded keys, service key in the browser | Non-negotiable rules + deny list + security review prompt |
| **Test gaming** | Agent edits tests to make them pass | Rule: never weaken tests; after 3 failed attempts, stop and report |
| **Schema drift** | DB and TypeScript types disagree | Migrations only, regenerated types committed with every migration |
| **Running against production** | Destructive commands on real data | Local/staging only; production commands on the deny list |
| **Unreviewable big-bang changes** | 4,000-line change nobody can check | Small commits, one unit per branch, human review gates |
| **"Works on my machine"** | Passes locally, fails in CI/preview | `pnpm check` gate, CI on every branch, preview deployments |

---

## Part 2. Before you start (human tasks)

### 2.1 Tools on your computer

- Node.js (current LTS), pnpm, Git, a code editor (Antigravity itself).
- **Docker Desktop** if you want a local Supabase database (large download). **If your internet or computer makes Docker impractical, use a hosted Supabase "dev" project instead.** Tell the agent which one in the pre-flight step so it adapts the DB test commands.
- Supabase CLI (the agent can install it as a project dev dependency).

### 2.2 Accounts (create when the unit needs them, not all at once)

| Account | Needed at | Notes |
| --- | --- | --- |
| GitHub (private repo) | U00 | Protect `main`; require CI |
| Vercel (or chosen host) | U00 | Preview deployments. Check current terms for commercial use. |
| Supabase: **dev/staging** project | U02 | Separate project from production |
| Supabase: **production** project | U17 | Created late; never used during development |
| Cloudflare (DNS + Turnstile) | U10 (Turnstile), U17 (DNS) | Turnstile test keys work in development |
| Upstash Redis | U10 | Rate limits |
| Sentry | U00 stub, U17 full |  |
| Telegram bot (or Resend email) | U16 | Create via BotFather |
| Domain name | U17 | `.com` or `.ng` |

### 2.3 Things only you can provide (collect now; the agent will ask)

- Business legal name, address, opening hours, official bank account **name** (never put account numbers in code or prompts).
- The WhatsApp business number in international format.
- Brands and categories you stock; 20+ real products with photos (clean background, WebP/JPG), prices in ₦, storage/colour/condition options, warranty terms.
- Policy decisions: return window, warranty by condition (Brand New / UK Used / Open Box), pickup available or not, delivery states, `hold_hours` (default 24).
- Your Stitch design images, saved to `docs/design/`.

### 2.4 Secrets discipline (important)

- **Never paste real API keys, passwords or bank details into Antigravity prompts or chat.** Put them only in `.env.local` yourself.
- Add `.env*` (except `.env.example`) to `.gitignore` **and** to `.antigravityignore` so the agent does not read them. Check Antigravity's current docs for the exact ignore-file name if it differs.
- The agent works with `.env.example` (variable names, no values).

---

## Part 3. Antigravity setup

### 3.1 Project folder

Open the **project folder itself** in Antigravity (not a parent directory), so rules and instruction files are picked up.

```
keraunous/
├─ AGENTS.md                  ← the master prompt (Part 5). Always loaded.
├─ docs/
│  ├─ BLUEPRINT.md            ← the full spec (your companion file)
│  ├─ PROGRESS.md             ← living log the agent updates after every unit
│  ├─ PREFLIGHT.md            ← written by the agent in step P0
│  └─ design/                 ← Stitch images (reference only)
├─ .agent/                    ← some Antigravity versions use .agents/ ; check the Rules panel
│  ├─ rules/                  ← optional extra rules
│  └─ workflows/              ← slash commands (Part 4)
└─ .antigravityignore
```

Antigravity reads project instructions from `AGENTS.md` and from its Rules/Workflows folders; the exact folder name has varied between guides (`.agent/` and `.agents/`), so **create workflows from Antigravity's own Rules/Workflows panel** if in doubt and let it place the files.

### 3.2 Recommended settings

| Setting | Recommendation | Why |
| --- | --- | --- |
| Mode | **Planning** for units; **Fast** only for tiny fixes | You want an implementation plan to review before code |
| Review policy | Ask for review on plans and before large changes | Keeps you in control of design |
| Terminal execution policy | Allow routine commands (install, test, lint, build) automatically; require approval for anything touching git remotes, deployments or databases | Speed with safety |
| Deny list | `rm -rf`, `git push --force`, `git push` to `main`, `supabase db reset --linked`, `supabase db push` (production), `vercel --prod`, `curl ... \| sh`, `chmod -R 777` | Prevents irreversible mistakes |
| JavaScript / browser | Allow the integrated browser for **localhost and preview URLs only** | The browser agent can verify the UI without roaming |
| Model | Use the strongest reasoning model your plan offers for **U02, U03, U10, U11, U12, U15**; a faster model is fine for UI units | Money, auth and RLS deserve the best model |
| Conversations | **One new conversation per unit**; never carry a unit into the next | Prevents context bloat and drift |

### 3.3 Working agreement (human side)

1. You approve every unit's **Implementation Plan** before code is written.
2. The agent works only on branch `unit/uXX-name`.
3. After each unit you read the **Walkthrough** artifact, run the app yourself, check the unit's Definition of done, then merge.
4. Tag each checkpoint in Git (`cp1`, `cp2`...) so you can roll back.
5. Quota: keep each task small. If you hit limits, stop at a clean commit and resume later using the Resume prompt (Part 8).

---

## Part 4. Reusable slash-command workflows

Create these three workflows (Antigravity lets you trigger them with `/`). They make every unit follow the same loop.

**`/start-unit`**

```
---
description: Begin a Keraunous build unit safely
---
1. Ask me for the unit ID (for example U05). If I already gave it, use that.
2. Read AGENTS.md, docs/PROGRESS.md, and the matching unit section plus every blueprint section it references in docs/BLUEPRINT.md.
3. Confirm the previous units this one depends on are marked DONE in docs/PROGRESS.md. If not, stop and tell me.
4. Create and switch to the branch unit/<id>-<short-name> from an up-to-date main.
5. Produce an Implementation Plan artifact: files to create or change, database or contract changes, step order, test plan, risks, assumptions, and questions for me.
6. Stop and wait for my approval. Do not write code yet.
```

**`/finish-unit`**

```
---
description: Verify, document and close a Keraunous build unit
---
1. Run the full gate: lint, typecheck, unit tests, database tests, build (pnpm check). Fix failures at the root cause without weakening tests.
2. For UI units, verify in the browser at 390px and 1280px widths and capture screenshots.
3. Walk through the unit's Definition of done in docs/BLUEPRINT.md line by line and mark each item PASS or FAIL with evidence.
4. Update docs/PROGRESS.md: status, decisions made, deviations from the blueprint, follow-ups found, manual steps I must do.
5. If any shared contract in lib/contracts changed, add a CHANGELOG entry and confirm every consumer was updated.
6. Produce a Walkthrough artifact. List what I should test by hand.
7. Commit on the unit branch. Do not merge, push to main, or start another unit.
```

**`/checkpoint`**

```
---
description: Run an integration checkpoint
---
1. Ask which checkpoint (CP1 to CP5) or use the one I named.
2. Run the integration scenarios listed for that checkpoint in docs/BLUEPRINT.md section 11.5 and the checkpoint prompt in docs/PROGRESS.md.
3. Use the browser for end-to-end flows. Record each scenario as PASS or FAIL with evidence.
4. Do not fix anything silently. Report failures first, then propose fixes and wait for approval.
```

---

## Part 5. THE MASTER PROMPT (`AGENTS.md`)

Save this exactly as `AGENTS.md` in the project root. It is loaded for every agent conversation.

```
# Keraunous Tech Store: Agent Operating Manual

## 1. Mission
You are building Keraunous, a phone and gadget SHOWCASE website for the Nigerian market (prices in Naira, symbol ₦). Customers browse, choose a variant, and send a structured order to the seller on WhatsApp. The website saves the order first, hands the customer to WhatsApp with a prefilled message, and lets them track the order. Owner and staff manage products, content and orders in a protected admin panel.
There are NO online payments, NO customer accounts, NO installments, NO reviews/ratings, NO coupon codes in v1.

## 2. Source of truth
- docs/BLUEPRINT.md is the full specification: flows, architecture, schema, API contracts, business rules, build units, security, tests. Follow it exactly.
- docs/PROGRESS.md is your memory between conversations. Read it first, update it last.
- docs/design/ holds visual references from Stitch. They are REFERENCE ONLY: match layout, spacing, colours and feel, but do NOT copy their content. The design shows $ prices, EMI, "Secure Payment", ratings, review counts, a coupon and "2M+ customers". Those are wrong for this project. Section 2 of the blueprint lists the required corrections.
- If this file, the blueprint and a user message conflict, STOP and ask. Do not guess.

## 3. Non-negotiable rules
Money and orders
1. Prices, totals, stock and order status are decided ONLY on the server. The browser sends variant IDs and quantities, never trusted prices. A mismatch with the client's expected total returns 409 PRICE_CHANGED.
2. Money is an integer number of Naira. Never use floating point for money. Format only at the UI edge: Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).
3. Every order change goes through the database functions (create_order, transition_order, etc.). No direct table writes for orders from application code.
4. Stock is deducted when an order becomes CONFIRMED and restored on cancellation, exactly once, inside a transaction.
5. The WhatsApp URL is built on the server from the saved business number. Never from client input.

Security
6. Row Level Security is enabled on EVERY table. Never disable it, not even temporarily. Anonymous users must never be able to read orders.
7. The Supabase service-role key exists only in server-only modules (import 'server-only') and server environment variables. Never in client code, logs, comments, tests or prompts.
8. Admin access requires: valid session + active admin_users row + MFA (AAL2) + role check, enforced inside every server action and data function, not only in the UI or middleware.
9. Validate every input with Zod on the server. Treat all client data as hostile.
10. Never log secrets, tokens, full phone numbers or addresses. Mask phones (+23480****4567). Hash IPs.
11. No dangerouslySetInnerHTML. Descriptions and notes are plain text.
12. Public tracking requires BOTH order ID and phone, returns a generic message on any mismatch, and exposes only the minimal projection defined in the blueprint.
13. Never run destructive commands against any database other than local or the dev project I name. Never touch production.

Product integrity
14. No fake social proof anywhere: no invented customer counts, ratings, review counts, testimonials or urgency claims. Countdowns exist only for real scheduled sales.
15. Keep v1 scope. Do not add payments, accounts, coupons, reviews or EMI.

## 4. Stack and conventions
- Next.js (App Router) + TypeScript strict, Tailwind CSS, React Hook Form + Zod, Supabase (Postgres, Auth with TOTP MFA, Storage), Upstash Ratelimit, Cloudflare Turnstile, Sentry, Vitest, Playwright, pnpm.
- Use the latest STABLE versions. Before using any library API, read the documentation for the version actually installed in this repo. Do not rely on memory for APIs that change between major versions.
- Before adding any dependency: confirm it exists and is maintained (pnpm view <pkg>), prefer the packages named above, pin the version, and note it in docs/PROGRESS.md with a one-line reason.
- Structure: follow the repository layout in blueprint section 6.6. Modules in modules/<name>/ are used only through their index.ts. Only repo.ts files talk to Supabase. Shared types and Zod schemas live in lib/contracts.
- API envelope: success { ok: true, data }, failure { ok: false, error: { code, message, details? } } with the error codes in blueprint section 8.1.
- Database: snake_case. TypeScript: camelCase. Time stored as UTC timestamptz, displayed in Africa/Lagos. Phones stored E.164 (+234...). Public order ID format KRN-YYMMDD-XXXXX.
- Schema changes ONLY through new migration files in db/migrations. Never edit a migration that has been applied elsewhere. Regenerate and commit TypeScript types in the same commit as the migration.
- UI: mobile-first (design at 390px, verify at 360px and 1280px), accessible (labels, focus rings, contrast AA, 44px tap targets, reduced motion), no layout shift (reserve image sizes).
- Code quality: small functions, explicit types (no any), no dead code, comments explain WHY. Errors are typed and handled; no empty catch blocks.

## 5. Working protocol (every unit, every time)
1. Read this file, docs/PROGRESS.md, and the unit's section and referenced sections in docs/BLUEPRINT.md.
2. Confirm all prerequisite units are DONE. If not, stop.
3. Work on branch unit/<id>-<name>. Never commit to main.
4. Produce an Implementation Plan (files, schema or contract changes, order of work, test plan, risks, assumptions, questions). WAIT for approval.
5. Write tests first for pure logic (money, phone, IDs, pricing, message builder, state machine) and for database behaviour (constraints, RPC, RLS).
6. Implement in small, reviewable commits. After each: typecheck, lint, run the affected tests.
7. For UI work, open the running app in the browser and verify at 390px and 1280px. Capture screenshots as evidence.
8. Run the full gate (pnpm check = lint + typecheck + tests + build) and fix the root cause of any failure.
9. Check every line of the unit's Definition of done. Report PASS or FAIL with evidence.
10. Update docs/PROGRESS.md. Produce a Walkthrough. Stop. Do NOT start the next unit.

## 6. Scope control
- Do only what the current unit asks. If you notice something else that needs fixing, add it to the Follow-ups list in docs/PROGRESS.md and keep going.
- Do not refactor, rename or reformat files outside the unit unless required, and say why.
- Before you finish, run git diff --stat against main and justify every file outside the unit's expected area.

## 7. Stop and ask me when
- The blueprint is ambiguous, contradictory or missing something that affects money, stock, security, privacy or data shape.
- You need a credential, account, DNS change, or any action only a human can do (list exactly what and why).
- A command would change anything other than local files or the dev database.
- A dependency not in the approved list seems necessary.
- The same test or build failure persists after 3 genuine fix attempts. Report your analysis instead of trying random changes.

## 8. Forbidden
- Weakening, deleting or skipping tests to get a green result. Fix the code or explain why the test is wrong.
- @ts-ignore, @ts-expect-error without a documented reason, eslint-disable for convenience, casting to any to silence errors.
- Hard-coding secrets, URLs, WhatsApp numbers, prices or bank details.
- git push --force, committing to main, deleting migrations, rewriting history.
- Calling production services, sending real WhatsApp messages or notifications from tests.
- Marking something DONE that you have not verified.

## 9. Global Definition of Done (applies to every unit)
- The unit's own Definition of done in the blueprint passes, with evidence.
- pnpm check passes. No new warnings.
- New logic has tests. Money, stock, state machine and RLS have exhaustive tests.
- No secret or personal data in code, logs, fixtures or screenshots.
- docs/PROGRESS.md updated. Contracts and CHANGELOG updated if shared shapes changed.
- A Walkthrough artifact lists what changed, what was verified, deviations, and manual steps for me.

## 10. How to report
End every task with: Summary (5 lines max) / Evidence (checks, screenshots) / Deviations from the blueprint / Follow-ups found / Manual steps for the human / Suggested next unit.
```

### Starter `docs/PROGRESS.md`

Create this file yourself (or ask the agent to) before starting:

```
# Keraunous progress log

## Status
| Unit | Name | Status | Branch | Merged | Notes |
|---|---|---|---|---|---|
| P0 | Pre-flight | TODO | | | |
| U00 | Foundation and tooling | TODO | | | |
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
| U11 | Order management (admin) | TODO | | | |
| U12 | Order tracking | TODO | | | |
| U13 | Trust and policy pages | TODO | | | |
| U14 | SEO, sharing and analytics | TODO | | | |
| U15 | Security hardening | TODO | | | |
| U16 | Notifications | TODO | | | |
| U17 | QA, observability, backups, launch | TODO | | | |

## Decisions
(date, decision, reason)

## Deviations from blueprint
(unit, what changed, why, approved by)

## Follow-ups
(found during unit X, description, priority)

## Dependencies added
(package, version, reason)

## Manual steps pending (human)
(item, needed by unit)
```

---

## Part 6. Implementation plan (the order of work)

### 6.1 Phases, gates and who does what

| Phase | Units | Human work | Gate before moving on |
| --- | --- | --- | --- |
| **0. Preparation** | P0 | Save blueprint and design images in repo; answer the pre-flight questions; create GitHub repo | `docs/PREFLIGHT.md` reviewed; questions answered |
| **1. Foundation** | U00, U01 ∥ U02 | Create Vercel + Supabase dev project; paste keys into `.env.local` | **CP1**: DB resets and seeds, `/dev/ui` renders, CI green |
| **2. Admin core** | U03, U04, then U05 ∥ U06 | Enrol your MFA; create first owner via bootstrap script; test uploads from your phone camera | **CP2**: log in with MFA, create product with images, edit banner |
| **3. Storefront** | U07, then U08 ∥ U09 ∥ U13 | Review design fidelity against Stitch; write policy text | **CP3**: admin product shows on site; search, filters, wishlist and list work |
| **4. Ordering** | U10, U11, U12 (U16 can start after U10) | Create Turnstile and Upstash keys; test WhatsApp links on real phones | **CP4**: full order loop works end to end |
| **5. Release** | U14, U15, U16, U17 | Real products and photos; domain; production Supabase; backups | **CP5**: security audit, load test, restore drill, launch checklist |

### 6.2 Review intensity per unit

| Unit | Risk | Your review |
| --- | --- | --- |
| U00, U01, U13, U14 | Low | Skim the walkthrough; run the app |
| U04, U06, U08, U09 | Medium | Run the flows by hand on your phone |
| **U02, U03, U10, U11, U12, U15** | **High (money, auth, privacy)** | Read the plan carefully, read the SQL and security code, run the hostile-review prompt (Part 9) in a **fresh conversation** before merging |
| U05, U07 | Medium-high | Manual QA with real product data |
| U16, U17 | Medium | Verify alerts and restore drill yourself |

### 6.3 Rhythm for each unit (about 1 to 3 working sessions)

1. New conversation, run `/start-unit` (or paste the unit prompt from Part 7).
2. Read the plan, answer questions, approve (or ask for changes).
3. Let the agent implement. Check in at commit boundaries.
4. Run `/finish-unit`. Read the walkthrough.
5. Test by hand. For high-risk units run the hostile review.
6. Merge to `main` after CI passes; tag at checkpoints.
7. Update your own notes. Start the next unit in a **new** conversation.

### 6.4 Realistic schedule

The blueprint estimates about 55 developer-days by hand. An agent shortens implementation, but **your review, testing, real content, accounts and policy writing do not shrink**. Plan roughly 5 to 8 weeks working steadily, longer if you are part-time. Content (photos, product data, policy text) is the usual real bottleneck, so start collecting it during Phase 1.

### 6.5 Definition of "ready to launch"

All five checkpoints passed, the pre-launch security checklist (blueprint 12.3) and go-live checklist (16.1) fully ticked, a restore drill done, and one week of soft-launch monitoring planned.

---

## Part 7. Unit prompts (paste one per new conversation)

Each prompt assumes `AGENTS.md` is loaded and `docs/BLUEPRINT.md` is in the repo. They end by telling the agent to stop for plan approval. Replace nothing in them unless a `<placeholder>` appears.

### P0 · Pre-flight (no code)

```
PRE-FLIGHT. Do not write or change any code.
Read AGENTS.md and the entire docs/BLUEPRINT.md, and look at the images in docs/design/.
Produce docs/PREFLIGHT.md containing:
1. Your understanding of the product in at most 25 bullets (flows, roles, order lifecycle, what is out of scope).
2. Contradictions, gaps or risky assumptions you find in the blueprint (be specific, cite section numbers).
3. Differences between the Stitch design images and the blueprint that I must resolve (blueprint section 2 lists known ones; add any you find).
4. The exact bootstrap commands you propose for U00 and which versions you will use (verify the latest stable versions yourself).
5. Whether you recommend a local Docker Supabase or a hosted dev project for database tests, given I may have limited bandwidth, and why.
6. A list of questions I must answer before U00: legal business name, WhatsApp number format, official payment account name, delivery states, pickup yes/no, hold_hours, brands list, anything else.
Then create docs/PROGRESS.md from the template in AGENTS.md if it does not exist. Stop and wait for my answers.
```

### U00 · Foundation and tooling

```
UNIT U00: Foundation and tooling.
Read: BLUEPRINT section 6 (architecture, layout, conventions) and section 10 > U00. Run the /start-unit procedure: plan first, wait for approval.
Goal: a runnable, tested, CI-protected skeleton that every later unit builds on.
Scope:
- Create the Next.js app (App Router, TypeScript strict, Tailwind) in the repo root with pnpm, ESLint, Prettier, Husky + lint-staged, path aliases.
- Create the folder layout from BLUEPRINT 6.6 with placeholder index files only where needed.
- lib/env.ts: validate environment variables with Zod at startup, separate server and public schemas, fail fast with clear messages. Provide .env.example with names only.
- lib/result.ts: API envelope helpers and typed error classes for every code in BLUEPRINT 8.1.
- lib/money.ts, lib/phone.ts, lib/ids.ts, lib/dates.ts, lib/constants.ts (36 states + FCT, order statuses, customer-facing labels), lib/logger.ts (structured, with redaction and phone masking).
- GET /api/health returning { ok: true } and app version.
- Scripts: dev, build, lint, typecheck, test, and "check" that runs lint + typecheck + test + build.
- GitHub Actions workflow running the check on pull requests. Sentry initialised but inert without a DSN.
- README: setup, scripts, branching and commit conventions.
Tests (Vitest, write first): money formatting (₦1,650,000), phone normalisation for 0803..., 803..., +234803..., with spaces and dashes, rejection of bad numbers, masking; public order ID format, character set, and no collisions across 100,000 generated IDs; Lagos date formatting.
Constraints: no UI beyond a placeholder home page; no Supabase code yet.
Definition of done: BLUEPRINT U00 DoD, plus pnpm check passes, CI green on a pull request.
Finish with the /finish-unit procedure. Do not start U01.
```

### U01 · Design system and layouts

```
UNIT U01: Design system and layouts.
Read: BLUEPRINT sections 2, 4.1 and 10 > U01, and study docs/design/ closely. Run /start-unit.
Goal: reusable components and layouts that reproduce the Stitch look (navy hero and promo panels, electric-blue primary, white rounded cards, Inter font) without any of the wrong content.
Scope:
- Design tokens in Tailwind config and CSS variables (colours, radii 12/16/24, shadows, spacing, typography). Extract approximate values from the images and list them in docs/PROGRESS.md for me to confirm.
- Components from BLUEPRINT U01 (Button variants including a WhatsApp-green variant, Badge, Chip, Input, Textarea, Select, PhoneInput with +234 handling, QuantityStepper, Skeleton, Toast, Modal, BottomSheet, Tabs, Accordion, accessible Carousel, Countdown driven by a server offset, PriceTag, StockBadge, Breadcrumbs, Pagination, EmptyState, Timeline, SectionHeader, TrustItem, BrandTile, ProductCard, Navbar, Footer, FloatingWhatsAppButton) and admin primitives (DataTable, FormField, ImageUploader shell, StatusPill, ConfirmDialog).
- PublicLayout and AdminLayout. Navbar shows Order List (not Cart), heart for wishlist, search; no user avatar.
- A /dev/ui showcase page rendering every component in every state, only available when an env flag is on.
Constraints: components are presentational: no data fetching, no business logic. Use only static sample props. Prices shown via lib/money. Keyboard and screen-reader accessible. Respect prefers-reduced-motion.
Verify: browser screenshots of /dev/ui at 360, 390 and 1280 widths; axe accessibility check; compare visually with docs/design and list differences.
Definition of done: BLUEPRINT U01 DoD. Then /finish-unit. Do not start U02.
```

### U02 · Database and data access

```
UNIT U02: Database and data access. HIGH RISK: be exhaustive.
Read: BLUEPRINT section 7 (all), section 9, section 11.3, and section 10 > U02. Run /start-unit.
Goal: the complete, tested data layer.
Scope:
- Migrations for all enums, tables, constraints, indexes exactly as BLUEPRINT 7.2 and 7.3 (improve only where you find a real bug, and record it as a deviation).
- effective_price(), search_key trigger (normalised brand + name + category), updated_at triggers.
- Views v_product_cards and a public variants view (security_invoker).
- RLS on EVERY table and the helper functions is_admin, is_owner, has_mfa per BLUEPRINT 7.6. Public can read only published catalogue, active content and is_public settings. Nothing about orders, audit_log, admin_users or blocklist is readable by anon.
- RPC functions as specified in BLUEPRINT 7.7. Implement create_order, transition_order, adjust_order_item_price, set_delivery_fee, track_order, mark_whatsapp_opened, apply_bulk_price and expire_stale_holds fully in SQL (not stubs), with typed errors. Revoke execute from public roles where specified.
- Seed script: categories, brands, settings, and 12 demo products with variants (include one on sale, one sold out, one with three storage options).
- Generated TypeScript types committed; repo pattern with one repo.ts per module; Supabase client helpers (server, browser, service-role with import 'server-only').
Tests (write first; SQL or Vitest against the database named in PREFLIGHT):
- Constraints: price > 0, sale price < price, stock >= 0, unique variant combination, phone format, total >= 0.
- effective_price at, before and after sale windows.
- create_order: snapshots server price, rejects inactive or unpublished items, rejects insufficient stock, returns same order for duplicate idempotency key, rejects qty out of range, mismatched expected total gives PRICE_CHANGED.
- transition_order: every allowed transition succeeds; every disallowed one fails; stock deducted exactly once on confirm and restored exactly once on cancel; concurrent confirmations of the last unit cannot oversell; staff cannot cancel a PAID order, owner can.
- RLS: anon cannot select from orders, order_items, order_events, audit_log, admin_users, blocklist or unpublished products; staff cannot read audit_log; a normal authenticated non-admin user has no access.
Constraints: never edit applied migrations; no application UI.
Definition of done: BLUEPRINT U02 DoD plus the tests above passing; database resets and seeds in under a minute. Then /finish-unit. Do not start U03.
```

### U03 · Admin authentication and roles

```
UNIT U03: Admin authentication and roles. HIGH RISK.
Read: BLUEPRINT sections 3, 7.6, 12 and 10 > U03. Run /start-unit.
Goal: only invited, MFA-verified staff can reach /admin; roles enforced everywhere.
Scope:
- Supabase Auth email + password, public sign-ups disabled (document the dashboard setting I must change), invite flow, password reset.
- Bootstrap script to create the first Owner (reads email from an argument; I set the password myself; never print secrets).
- Forced TOTP enrolment at first login, recovery-code handling, and AAL2 required for /admin.
- Middleware for /admin/* (session + active admin + AAL2), plus requireAdmin() and requireOwner() used inside EVERY server action and data function.
- Login rate limiting hook (use an in-memory stub now; real Upstash arrives in U10/U15), generic failure messages, session lifetime 8 h, logout.
- Staff management page for the Owner: invite, deactivate, reset MFA, change role. Audit entries for login events and role changes.
- /admin/login, a minimal admin dashboard shell using AdminLayout.
Tests: non-admin authenticated user gets 403 on every admin function; staff gets 403 on owner-only functions at server level AND at RLS level; a session without MFA cannot call server actions directly; deactivated admin loses access immediately.
Constraints: do not rely on hidden buttons for security. No customer accounts anywhere.
Verify in the browser: invite flow, MFA enrolment, login, forced logout. List the manual steps for me (Supabase settings).
Definition of done: BLUEPRINT U03 DoD. Then /finish-unit. Do not start U04.
```

### U04 · Media service

```
UNIT U04: Media service.
Read: BLUEPRINT section 10 > U04, section 7 (product_images) and image budgets. Run /start-unit.
Goal: fast, safe product images.
Scope:
- Storage bucket product-media (public read; writes only through signed upload URLs issued to authenticated admins with AAL2).
- Browser-side pipeline: validate type (JPEG, PNG, WebP), reject originals over 8 MB, resize longest edge to 1600px, convert to WebP, strip EXIF, target 250 KB or less; show progress and errors.
- Server action to issue signed URLs and to register product_images rows (path, alt text required, width, height). UUID file names only.
- next/image configuration and a helper that builds image URLs with correct sizes for card (400px), gallery (1000px), hero (1400px).
- Orphan clean-up function (files with no DB row after 24 hours), runnable by a scheduled endpoint protected by CRON_SECRET.
- A reusable ImageUploader component (multi-file, drag and drop, reorder, set primary, alt text) ready for U05.
Tests: type and size rejection; EXIF removed; output is WebP under target for a 6 MB sample; non-admin cannot obtain a signed URL; file names are never user-controlled.
Definition of done: BLUEPRINT U04 DoD. Then /finish-unit. Do not start U05.
```

### U05 · Catalogue management (admin)

```
UNIT U05: Catalogue management (admin).
Read: BLUEPRINT sections 5.5 (A and C), 7, 9.1, 9.2, 9.8 and 10 > U05. Run /start-unit.
Goal: staff create and maintain products without a developer.
Scope:
- Products list (search, filters, sorting, inline stock edit, bulk publish/unpublish/archive).
- Product editor with tabs: Basics, Variants and pricing (editable grid), Images (uses U04), Specs (validated against the Zod specs schema), Preview.
- Brands and Categories CRUD with logo upload, drag reorder, deactivate (never hard delete if referenced).
- Publish rules: needs at least one active variant, a primary image with alt text, valid slug, valid prices. Clear error messages.
- Duplicate product (variants and specs, not images). Slug auto-generation and uniqueness, redirect record when changed.
- Bulk price tool (OWNER ONLY to apply, staff may preview): scope, operation (percent up/down, CSV by SKU), rounding rule, preview table old to new, apply via apply_bulk_price in one transaction, audit logged.
- Every successful write: audit log (before/after) and revalidateTag for the affected pages using the shared CacheTags in lib/contracts.
Tests: publish blocked without required data; duplicate variant combination rejected; stock cannot go negative; bulk preview equals applied result and a single failing row rolls back everything; staff cannot apply bulk price; slug uniqueness.
Verify in the browser at 1280px and 390px (editor must be usable on a phone). Use the seed products and create one real-looking product end to end.
Definition of done: BLUEPRINT U05 DoD. Then /finish-unit. Do not start U06.
```

### U06 · Site content and settings

```
UNIT U06: Site content and settings.
Read: BLUEPRINT sections 4.1, 7 (banners, campaigns, site_settings) and 10 > U06. Run /start-unit.
Goal: the owner edits homepage content and business settings without code.
Scope:
- Banners admin (hero and promo): eyebrow, title, subtitle, CTA label and INTERNAL link only, image (U04), linked product for "Starting at ₦...", schedule, order, active.
- Flash sale campaign admin (only one active at a time).
- Trust bar editor (4 items, icon from a fixed list).
- Settings (OWNER ONLY): WhatsApp number (E.164 validated), business name, hours, address, delivery info, announcement text, WhatsApp channel link, social links, official account NAME for payments, hold_hours, orders_enabled, maintenance_mode, order message template with live preview. Per-key Zod validation.
- Changing the WhatsApp number must write an audit entry and create a notification record that U16 will deliver (store it now; delivery comes later).
- Public read function getSiteContent(): returns only is_public settings, active scheduled banners and the active campaign; cached with the shared tags.
Tests: external or malformed links rejected; invalid WhatsApp numbers rejected; staff cannot edit settings; non-public settings never appear in getSiteContent output; schedule windows respected.
Definition of done: BLUEPRINT U06 DoD. Then /finish-unit. Do not start U07.
```

### U07 · Public catalogue pages

```
UNIT U07: Public catalogue pages.
Read: BLUEPRINT sections 2, 4, 4.1, 6.4, 9.1, 9.2 and 10 > U07, and study docs/design/. Run /start-unit.
Goal: the storefront matching the Stitch design, driven by real data, with the corrections from blueprint section 2.
Scope:
- Home with every section in BLUEPRINT 4.1 (hero carousel from banners; trust bar; Popular Smartphones; promo banner; Shop by Brand; Best Deals; flash sale strip; WhatsApp channel panel instead of email newsletter; footer). Skeleton and empty states for each section.
- Listing pages: /shop, /category/[slug], /brand/[slug], /deals, /new-arrivals, /best-sellers (24 per page, pagination).
- Product detail: gallery with thumbnails, badge, "From ₦", variant selectors for storage, colour and condition (unavailable combinations disabled, shareable ?v= variant URL), spec chips, description, what's in the box, warranty line by condition, stock messages (Sold out, Only N left), buttons: Order on WhatsApp, Add to List, Ask a question (placeholders wired in U09 and U10; for now render them disabled or with TODO handlers), related products.
- ISR with the shared CacheTags; not-found and error pages.
- Images through next/image with reserved sizes; only the LCP hero image has priority.
Exposes: getHomeData(), getListing(params), getProductBySlug(), ProductCard usage.
Constraints: no ratings or review counts, no "$", no EMI, no coupon, no fake customer numbers.
Verify: browser at 390 and 1280; Lighthouse mobile performance 90 or higher and LCP 2.5 s or lower on throttled 4G for home and product pages; variant selection with 3 storage x 3 colours x 2 conditions.
Definition of done: BLUEPRINT U07 DoD. Then /finish-unit. Do not start U08.
```

### U08 · Search and filters

```
UNIT U08: Search and filters.
Read: BLUEPRINT sections 7.4, 9.7 and 10 > U08. Run /start-unit.
Scope:
- GET /api/search: normalise the query like search_key, trigram match, 8 suggestions, edge-cacheable for 60 s, validated input, limited length. (Rate limiting is added in U15; leave a clearly marked hook.)
- Navbar search UI: debounced 250 ms, keyboard navigation, recent searches (local only), "Can't find it? Ask us on WhatsApp" fallback.
- Filters (desktop sidebar, mobile bottom sheet): brand, category, price range (on effective price), storage, condition, in stock, on sale; sorting; active filter chips; clear all. URL parameters are the single source of truth.
- noindex on filtered URLs; clean canonical for category and brand pages.
Tests: "s25ultra", "S25 Ultra" and "galaxy s 25 ultra" resolve to the same product; combined filters correct; price filter uses sale price while a sale is active; empty state; p95 under 200 ms with 1,000 seeded products (generate them in a test script, not in the main seed).
Definition of done: BLUEPRINT U08 DoD. Then /finish-unit. Do not start U09.
```

### U09 · Wishlist and Order List (client)

```
UNIT U09: Wishlist and Order List (client side).
Read: BLUEPRINT sections 8.2 (list/resolve), 9.5 and 10 > U09. Run /start-unit.
Scope:
- Hooks useWishlist() and useOrderList() over localStorage with versioned keys (krn:wish:v1, krn:list:v1), in-memory fallback if storage is blocked, cross-tab sync. The list stores ONLY { variantId, qty }, never prices.
- POST /api/list/resolve (Zod validated, max 10 lines, qty 1 to 5) returning current name, label, price, stock, image and availability; client refreshes on open and on focus.
- Order List page: lines with image, name, variant label, quantity stepper, remove, fresh price, unavailable flag, price-changed banner, subtotal, and the note "Delivery fee and final price are confirmed on WhatsApp". The customer details form and submit button are added in U10; leave a clearly marked slot.
- Wishlist page. Navbar badges. "Added to list" toast with a View list action.
- Wire Add to List and the heart icon on product cards and detail pages (U07 placeholders).
Tests: persistence across reloads; limits (10 lines, qty 5); same variant increments quantity; admin price change shows after refresh; unpublished product shows as unavailable and is excluded from totals; blocked localStorage falls back gracefully.
Definition of done: BLUEPRINT U09 DoD. Then /finish-unit. Do not start U10.
```

### U10 · Order service and WhatsApp handoff

```
UNIT U10: Order service and WhatsApp handoff. HIGH RISK: money and privacy.
Read: BLUEPRINT sections 5.1 to 5.3, 8.1 to 8.3, 9.3, 9.4, 11.3 and 10 > U10. Run /start-unit.
Goal: a customer can submit an order that is stored safely and handed to WhatsApp.
Scope:
- lib/contracts/orders.ts with the CreateOrderRequest and response schemas (BLUEPRINT 11.3).
- POST /api/orders: validate; verify Cloudflare Turnstile server-side (fail closed; use test keys in development); rate limits with Upstash (5 per hour per IP; at most 5 open NEW orders per phone); blocklist check; call create_order with the service role; build WhatsApp URLs and the message server-side from the saved number and template; return the response with a signed handoffToken (HMAC with HANDOFF_TOKEN_SECRET).
- POST /api/orders/handoff: verifies the token and sets whatsapp_opened_at once.
- modules/whatsapp: buildOrderMessage, buildWaUrl, buildWaWebUrl, buildQuestionUrl with the 8-line cap, URL length guard (about 1,800 characters) that never drops the order ID or total.
- Customer form on the Order List page and a Quick Order bottom sheet on the product page: name, PhoneInput, delivery or pickup, state select, city, address, note, consent text linking to Privacy and Terms. Generate the idempotency key once per submit attempt.
- PRICE_CHANGED and OUT_OF_STOCK UX: show updated lines and require re-confirmation.
- /order/sent handoff page: order ID with copy button, summary from sessionStorage, Open WhatsApp button (one auto-attempt), fallbacks (Copy message, WhatsApp Web, QR code), "What happens next" steps, link to Track.
- orders_enabled kill switch shows "Ordering paused, message us on WhatsApp".
- Wire the "Ask a question" link (plain wa.me with product URL; no order record).
Tests: tampered expectedUnitPriceNgn or total gives 409 PRICE_CHANGED and creates no order; same idempotency key returns the same order; sixth order in an hour from one IP gets 429; invalid Turnstile token rejected; message builder with long names, 12 lines, emoji; URL always contains the order ID and total; the WhatsApp number can never come from the request body.
Verify in the browser at 390px. List manual steps for me (Turnstile and Upstash keys, test on real phones).
Definition of done: BLUEPRINT U10 DoD. Run the IT-3, IT-4 and IT-7 integration scenarios. Then /finish-unit. Do not start U11.
```

### U11 · Order management (admin)

```
UNIT U11: Order management (admin). HIGH RISK.
Read: BLUEPRINT sections 3, 5.5 B, 5.6, 7.7, 9.2 and 10 > U11. Run /start-unit.
Scope:
- Orders list: filters (status, date range, fulfilment, state), search by ID, name or phone, badges (Not yet contacted, Hold expiring, Awaiting payment, To ship).
- Order detail: customer block with "Open chat on WhatsApp", snapshot items, editable unit price (reason required, only while new or confirmed), delivery fee, totals, event timeline, internal notes, customer-visible notes.
- Status actions call transition_order and show only the actions allowed for the role and current status. Dialogs collect required data: payment amount and bank reference when marking PAID; IMEI for every phone line before SHIPPED; courier and tracking (or pickup note); cancel reason.
- Message templates (BLUEPRINT Appendix A): one-click copy or open-in-WhatsApp with placeholders filled.
- Dashboard: counts, low-stock and sold-out lists, expiring holds, recent activity. Realtime new-order badge.
- Block phone or IP hash from an order. CSV export (owner only).
Tests: confirm reduces stock exactly once, even on double-click; cancel restores exactly once; staff cannot cancel a PAID order, owner can; SHIPPED blocked without IMEI; every action creates an order_events row and an audit entry with the actor; direct table writes to orders are impossible for admins.
Verify in the browser using orders created via U10.
Definition of done: BLUEPRINT U11 DoD. Run IT-5, IT-6 and IT-9. Then /finish-unit. Do not start U12.
```

### U12 · Order tracking (public)

```
UNIT U12: Order tracking. HIGH RISK: privacy.
Read: BLUEPRINT sections 5.4, 8.2, 8.4, 12.1 (T3) and 10 > U12. Run /start-unit.
Scope:
- POST /api/track: Zod validation, Turnstile, rate limits (10 per 10 minutes per IP and 5 per 10 minutes per order ID), call track_order, return ONLY the projection in BLUEPRINT 8.4. Any mismatch returns the same generic NOT_FOUND message with a similar response time.
- /track page: ID and phone form (accept any case, trim spaces), timeline component for delivery and pickup variants, items summary, courier info, latest customer-visible note, "Message us about this order" button prefilled with the ID. /track?id=KRN-... pre-fills the ID only, never the phone.
Tests: right ID + wrong phone and unknown ID give identical responses; the response never contains the full phone, address, internal notes, IMEI, payment reference or admin names; rate limits engage; timeline correct for each status and both fulfilment types.
Definition of done: BLUEPRINT U12 DoD. Run IT-8. Then /finish-unit. Then run /checkpoint CP4. Do not start U13.
```

### U13 · Trust and policy pages

```
UNIT U13: Trust and policy pages.
Read: BLUEPRINT section 10 > U13 and Appendix B. Run /start-unit.
Scope: About, Contact, FAQ, How to order, Delivery, Returns and warranty, Privacy, Terms, Verify our accounts, branded 404 and error pages. Content comes from site_settings where possible (business name, address, hours, WhatsApp number, official account name). For legal text, write clear plain-English DRAFTS with TODO markers where I must decide (return window, warranty by condition, retention periods) and a visible note that a lawyer should review Privacy and Terms before launch. Do NOT invent facts about the business (years trading, customer counts, awards).
Link the pages in the footer and from the order form. Static rendering.
Definition of done: BLUEPRINT U13 DoD. Then /finish-unit. Do not start U14.
```

### U14 · SEO, sharing and analytics

```
UNIT U14: SEO, sharing and analytics.
Read: BLUEPRINT section 10 > U14, 6.4 and 9. Run /start-unit.
Scope: metadata per page type (title template, descriptions, canonical); Open Graph and Twitter tags; generated OG image for products (photo, name, "From ₦X") kept small for WhatsApp previews; JSON-LD Product (priceCurrency NGN, availability, itemCondition), Organization or LocalBusiness, BreadcrumbList; NO aggregateRating; sitemap.xml with published pages only; robots.txt (disallow /admin and /api and filter URLs); analytics events without personal data (view_product, add_to_list, wishlist_add, order_started, order_created, whatsapp_opened, question_clicked, track_lookup, search, filter_used); UTM capture saved on orders.
Tests: sitemap contains only published items; JSON-LD validates; /admin has noindex; no personal data in analytics payloads.
Definition of done: BLUEPRINT U14 DoD. Then /finish-unit. Do not start U15.
```

### U15 · Security hardening

```
UNIT U15: Security hardening. HIGH RISK.
Read: BLUEPRINT section 12 (all), 8.2 and 10 > U15. Run /start-unit.
Scope: security headers and a strict nonce-based CSP (frame-ancestors none, HSTS, nosniff, referrer policy, permissions policy); one central rate-limit policy file applied to search, list/resolve, orders, handoff, track and admin login (replace earlier stubs); Turnstile fail-closed everywhere it is used; blocklist enforcement; gitleaks and dependency audit in CI; guard that the service-role client can only be imported from server-only modules (lint rule or test); RLS and privilege-escalation test suite in CI; owner alerts for settings changes, new staff and repeated failed logins (write the alert records; delivery is U16); log-redaction tests; scripted abuse tests (1,000 order attempts, 500 track attempts) showing throttling without degrading normal requests.
Also run the checklist: IDOR, mass assignment, enumeration, stored XSS in names and notes, open redirect, upload abuse, CSRF on route handlers (Origin check), error messages leaking internals.
Deliver: a docs/SECURITY_REVIEW.md listing each BLUEPRINT 12.3 item as PASS or FAIL with evidence, and any findings with severity.
Definition of done: all 12.3 items PASS. Then /finish-unit. Do not start U16.
```

### U16 · Notifications (optional, recommended)

```
UNIT U16: Notifications.
Read: BLUEPRINT section 10 > U16 and 15.3. Run /start-unit.
Scope: a notification module with a Telegram sender (or email via Resend, as I choose in the plan), invoked outside the request path so failure never blocks an order. Events: new order (order ID, item count, total, state; NEVER phone or address), order created but WhatsApp not opened after 30 minutes, holds about to expire, low stock, settings changed, new staff user, repeated failed logins. Optional daily summary. Deliver the records U06 and U15 already create. Scheduled endpoints protected by CRON_SECRET.
Tests: failure to send is logged and does not fail the order; payloads contain no personal data; each event type fires once.
Definition of done: BLUEPRINT U16 DoD. Then /finish-unit. Do not start U17.
```

### U17 · QA, observability, backups and launch

```
UNIT U17: QA, observability, backups and launch readiness.
Read: BLUEPRINT sections 13, 14, 15, 16 and 10 > U17. Run /start-unit.
Scope: Playwright suites for scenarios E1 to E12 (mobile and desktop) running in CI against preview deployments; Lighthouse CI budgets; k6 load tests from BLUEPRINT 13.3 with a written results report; Sentry release tracking and alert rules; uptime checks; nightly pg_dump backup job to a private location plus a documented restore drill (you write the steps; I perform and time the drill); runbooks from BLUEPRINT 15.4 as docs/RUNBOOKS.md; production configuration checklist (environment variables, Turnstile production keys, Supabase production project, DNS, redirects); seed script for real product import from CSV.
Do not touch production yourself. Produce the exact manual steps for me.
Definition of done: BLUEPRINT 16.1 go-live checklist items that the agent can verify are PASS; the rest are listed for me. Run /checkpoint CP5. Then /finish-unit.
```

---

## Part 8. Checkpoint, resume and recovery prompts

### 8.1 Checkpoint prompts

```
CP1 (after U00, U01, U02): Verify: fresh clone runs with .env.example; database resets and seeds in under a minute; all database and RLS tests pass; /dev/ui renders every component at 390 and 1280 widths; CI green. Report PASS or FAIL per item. Do not change code.
```

```
CP2 (after U03 to U06): In the browser: invite and log in as owner with MFA; create a staff user and confirm owner-only pages return 403 for them; create a product with 4 uploaded photos, 3 variants and a sale; publish it; edit a hero banner; change a setting as owner. Confirm each write produced an audit entry. Report PASS or FAIL. Do not change code.
```

```
CP3 (after U07, U08, U09, U13): In the browser at 390px and 1280px: the product created in admin appears on home and /shop within 60 seconds; variant selection works; search "s25ultra" style queries work; filters and sorting work and persist in the URL; wishlist and Order List persist; changing a price in admin updates the Order List after refresh. Run Lighthouse mobile on home and a product page. Report PASS or FAIL. Do not change code.
```

```
CP4 (after U10, U11, U12): Run integration scenarios IT-1 to IT-10 from BLUEPRINT 11.5 and end-to-end scenarios E1 to E8 from section 14. Include: create an order, check the WhatsApp URL (number, order ID, total), confirm in admin (stock decreases), mark paid, processing, shipped with IMEI and courier, delivered, and track it at each step. Also test tampered price, duplicate submit and wrong-phone tracking. Report PASS or FAIL with evidence. Do not change code.
```

```
CP5 (before launch): Run the full security checklist (BLUEPRINT 12.3), the load tests (13.3), the E2E suite, Lighthouse budgets, and verify backup and restore documentation. Produce docs/LAUNCH_REPORT.md with PASS or FAIL for every item in BLUEPRINT 16.1 and list blockers first. Do not change code.
```

### 8.2 Resume prompt (new conversation, same unit)

```
RESUME. Read AGENTS.md, docs/PROGRESS.md and the section of docs/BLUEPRINT.md for unit <Uxx>. Run git status, git log --oneline -15 and git diff --stat main...HEAD. Tell me: what is already done, what remains against the unit's Definition of done, and any uncommitted or suspicious changes. Propose the next small step and wait for my approval. Do not redo finished work.
```

### 8.3 Agent went out of scope

```
STOP. You changed files outside the scope of unit <Uxx>. Run git diff --stat main...HEAD and list every file that is not part of this unit's expected area. For each, say why it changed. Revert any change that is not strictly required. Anything useful goes into the Follow-ups list in docs/PROGRESS.md instead. Then confirm the unit's tests still pass.
```

### 8.4 Stuck in a failing loop

```
STOP changing code. Summarise: the failing test or error, the three most likely root causes, the evidence for and against each, and what you already tried. Do not edit tests to make them pass unless you can show the test itself is wrong, and explain why. Propose one targeted experiment to isolate the cause and wait for my approval.
```

### 8.5 Dependency or API doubt

```
Before continuing, verify every third-party package and API you used in this unit. For each: confirm it exists in the registry and is maintained (pnpm view), confirm the installed version, and confirm each function or option you used against the documentation for THAT version. List any you could not verify. Replace anything you cannot verify. Record new dependencies in docs/PROGRESS.md.
```

### 8.6 Schema or type drift

```
Check for drift: regenerate database types, run all migrations from scratch on a clean database, run the seed, then run typecheck and all tests. Report any mismatch between migrations, generated types, Zod contracts and repo queries. Fix with a NEW migration or contract update, never by editing applied migrations.
```

---

## Part 9. Hostile review prompts (run in a fresh conversation)

Run these before merging **U02, U03, U10, U11, U12, U15**. A fresh conversation has no attachment to the code it is judging.

```
You are a skeptical senior security engineer reviewing branch unit/<id> of the Keraunous store. Do not modify code. Read AGENTS.md, docs/BLUEPRINT.md section 12 and the diff against main.
Try to break it. For this unit, look specifically for:
- Any way to get a lower price, a free order, a negative total, or a duplicate order.
- Any way to oversell stock or deduct or restore stock twice.
- Any way an anonymous user, a customer, or a staff member can read or change data they should not (IDOR, missing RLS, missing role check, privilege escalation, server action callable without MFA).
- Any place secrets, full phone numbers, addresses or tokens could leak (logs, responses, errors, client bundles, analytics).
- Injection or XSS through names, notes, search, URLs; open redirects; unsafe HTML.
- Race conditions and non-atomic multi-step writes.
- Tests that pass for the wrong reason or do not assert what they claim.
Report findings as a table: ID, severity (critical/high/medium/low), file and line, how to exploit it, and the recommended fix. End with a verdict: SAFE TO MERGE or BLOCKED, and the minimum fixes required.
```

```
You are a database reviewer. Do not modify code. Review all migrations and SQL functions in this branch. Check: every table has RLS enabled with least-privilege policies; SECURITY DEFINER functions set search_path and validate their inputs; execute is revoked from roles that should not call them; transactions and row locks prevent overselling under concurrency; constraints match BLUEPRINT section 7; indexes support the queries used; migrations are safe to apply to a database with data. Provide a table of findings with severity and fixes, and a verdict.
```

```
You are a QA lead. Do not modify code. Using only the BLUEPRINT's Definition of done and test scenarios for unit <Uxx>, design 25 additional edge-case tests the author probably missed (bad input, double clicks, slow network, expired sale, unpublished product, huge quantities, unusual Nigerian phone formats, emoji and long names, back button, two tabs). Run those you can, and report which pass, which fail, and which cannot be automated.
```

---

## Part 10. Pre-launch audit prompt

```
LAUNCH AUDIT. Do not modify code. Read AGENTS.md, docs/BLUEPRINT.md sections 12.3 and 16.1, docs/PROGRESS.md, docs/SECURITY_REVIEW.md and docs/RUNBOOKS.md.
For every checklist item: PASS, FAIL or NEEDS HUMAN, with evidence (command output, test name, screenshot, file path). Verify specifically:
1. A search of the whole repo and git history finds no secrets, API keys, bank details or personal data.
2. Anonymous API calls cannot read orders, audit log, admin users, blocklist or unpublished products.
3. Every admin server action calls requireAdmin or requireOwner and checks MFA; list any that do not.
4. No page, component or fixture contains $ prices, ratings, review counts, EMI, coupon codes or unverifiable claims.
5. The WhatsApp number used in generated links equals the saved business number and cannot be overridden by input.
6. Staging and production use different keys and projects; nothing in code points at production.
7. Backups run; restore instructions exist.
Produce docs/LAUNCH_REPORT.md with blockers first. Do not mark anything PASS without evidence.
```

---

## Part 11. Practical tips

- **Keep prompts short and the blueprint long.** The unit prompts point to the blueprint, which already holds the detail. If the agent seems to ignore something, ask it to quote the exact blueprint lines it is following.
- **Never let the agent "just quickly" skip the plan.** The plan review is where most expensive mistakes are caught cheaply.
- **Test with real phones.** WhatsApp links behave differently on Android, iPhone and desktop. The agent cannot fully verify this.
- **Own your content early.** Real photos and accurate prices make the site look professional; the code cannot fix weak content.
- **Rotate keys after development**, and keep a private note (outside the repo) of where each secret lives.
- **If Antigravity's interface differs** from the names used here (modes, policies, folder names), follow its current documentation; the prompts themselves do not depend on those names.
- **Ask the agent to explain, not just do.** For high-risk units, ask "explain how this prevents a free order" and check the answer against the code.