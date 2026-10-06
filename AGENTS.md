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
