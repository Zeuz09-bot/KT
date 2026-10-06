# Keraunous Tech Store

> Phone and gadget showcase website for the Nigerian market.
> Prices strictly in integer Naira (₦). Orders saved to database and submitted via WhatsApp.

---

## 1. Quick Start

### Prerequisites
- Node.js (v20+ or v22+ LTS)
- `pnpm` (v9+)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd KT

# Copy environment variables template
cp .env.example .env.local

# Install dependencies
pnpm install

# Start local development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 2. Available Scripts

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Starts Next.js development server at `localhost:3000` |
| `pnpm build` | Compiles production bundle |
| `pnpm start` | Runs the compiled production server |
| `pnpm lint` | Runs ESLint analysis |
| `pnpm typecheck` | Validates TypeScript types across the project |
| `pnpm test` | Runs unit test suites using Vitest |
| `pnpm check` | **Full Quality Gate**: executes lint, typecheck, test, and build |

---

## 3. Branching & Commit Conventions

- **Branch Naming**:
  - `unit/u<ID>-<name>` (e.g., `unit/u00-foundation`, `unit/u01-design-system`)
  - Never commit directly to `main`.
- **Commit Messages**: Conventional commits format:
  - `feat(unit-id): description`
  - `fix(unit-id): description`
  - `test(unit-id): description`
  - `chore(unit-id): description`

---

## 4. Architecture & Source of Truth

- [`AGENTS.md`](AGENTS.md): Master agent operating manual and non-negotiable rules.
- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md): Authoritative architectural specification and 18-unit build roadmap.
- [`docs/PROGRESS.md`](docs/PROGRESS.md): Living execution log and decision records.
- [`docs/PREFLIGHT.md`](docs/PREFLIGHT.md): Step P0 environment audit and business parameters.
- [`docs/design/`](docs/design/): Google Stitch UI mockups (reference only).
