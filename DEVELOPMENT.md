# HauntView Development Guide

A comprehensive guide for contributing to and developing HauntView — including the core testing engine, Victorian Parlour Web UI, Kiro Power, and the `haunt` CLI.

---

## 1. Getting Started

### Prerequisites

- **Node.js:** Node 22 LTS (recommended: `v22.11.0` or newer)
- **Package Manager:** `pnpm` 9+
- **Operating System:** Linux, macOS, or Windows

### Initial Setup

```bash
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview

# Install dependencies and initialize Git hooks
pnpm install
pnpm run setup:hooks

# Install Playwright browser engines (Chromium, Firefox, WebKit)
pnpm exec playwright install
```

---

## 2. Workspace Auto-Versioning

HauntView enforces automated, deterministic semantic versioning across all distribution carriers.

### Single Source of Truth

The version number is declared exclusively in the root [`VERSION`](file:///home/japheth/Desktop/hauntview/VERSION) file (e.g. `0.0.4`).

### Rollover Rules

HauntView uses custom rollover thresholds:

- **Patch Rollover:** Rolls over at 9:
  $$0.0.9 \longrightarrow 0.1.0$$
- **Minor Rollover:** Rolls over at 99:
  $$0.99.9 \longrightarrow 1.0.0$$

### Synchronized Carriers

When the version bumps, [`scripts/bump-version.mjs`](file:///home/japheth/Desktop/hauntview/scripts/bump-version.mjs) synchronizes the following files:

1. `VERSION`
2. `package.json` (`version` field)
3. `power/plugin.json` (`version` field)
4. `src/version.ts` (`HAUNTVIEW_VERSION` export)

The Web UI imports `HAUNTVIEW_VERSION` directly into its footer and headers.

### Pre-Commit Workflow

The Husky pre-commit hook runs linting and presubmit checks, and then executes `scripts/bump-version.mjs` before the commit is finalized:

- **Git Rebase / Merge / Amend Detection:** The script automatically inspects Git state (`rebase-merge`, `rebase-apply`, `MERGE_HEAD`, and commit message files) to skip bumping during rebases, cherry-picks, merges, or commit amends.
- **Verification:** Run `pnpm run version:check` anytime to verify all carriers match `VERSION`.

---

## 3. CLI Development & Packaging

The HauntView CLI (`haunt` and `hauntview`) is authored in TypeScript under [`src/cli/`](file:///home/japheth/Desktop/hauntview/src/cli/) and bundled with esbuild into a standalone Node 22 ESM executable.

### Building the CLI

```bash
pnpm run build:cli
```

This runs [`scripts/build-cli.mjs`](file:///home/japheth/Desktop/hauntview/scripts/build-cli.mjs), compiling `src/cli/index.ts` to `dist/cli.js`.

### Testing the Built Binary Locally

```bash
# Display help
node dist/cli.js --help

# Run system doctor
node dist/cli.js doctor

# Run against a local test server
node dist/cli.js http://localhost:3000 --yes
```

### Packaging Guardrails

The npm package distribution is configured in [`package.json`](file:///home/japheth/Desktop/hauntview/package.json) with strict whitelist entries in `files`:

- `dist/` (compiled CLI bundle)
- `src/` (core engine, types, profiles, MCP server)
- `power/` (Kiro Power definitions)
- `README.md`, `LICENSE`, `VERSION`
- **Excludes:** Next.js pages/components (`app/`), tests (`__tests__/`), SQLite databases (`.hauntview/`), and assets (`public/`).
- **Zero Web Bloat:** The CLI never imports `zustand`, `react`, or Next.js internals.

---

## 4. Development Workflow

### Running Web UI (Development)

```bash
pnpm dev
# Victorian Parlour interface at http://localhost:3000
```

### Running MCP Server (stdio)

```bash
pnpm mcp
```

### Formatting & Linting

```bash
pnpm run format         # Format with Prettier
pnpm run format:check   # Verify formatting
pnpm run lint           # ESLint analysis
pnpm run typecheck      # TypeScript compilation check
```

### Running Test Suites

HauntView maintains 34 test suites with 169 tests covering profiles, contracts, engine concurrency, CLI runners, system heuristics, and versioning:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run with test coverage
pnpm run test:coverage
```

### Comprehensive Presubmit Gate

Before submitting PRs or commits, run the full verification gate:

```bash
pnpm run presubmit
```

The presubmit gate executes:

1. `version:check` (verifies carrier synchronization)
2. `format:check` (verifies Prettier style)
3. `lint` (ESLint verification)
4. `typecheck` (TypeScript compiler)
5. `test` (all 33 Jest test suites)

---

## 5. Storage Model

HauntView partitions storage between browser clients and headless engines:

### Web UI (Client Storage)

- Handled via Zustand's `persist` middleware in [`app/lib/crypt-store.ts`](file:///home/japheth/Desktop/hauntview/app/lib/crypt-store.ts).
- Stored exclusively in the user's browser `localStorage`.
- No server-side report sharing or cross-tenant data leaks on public deployments.
- Reports rehydrate automatically when the user reconnects to the server.

### Headless (CLI / MCP / REST)

- Stored in SQLite via `better-sqlite3` at `.hauntview/data/hauntview.db`.
- CLI exports standalone reports (HTML, Markdown, Zip bundles) to the user's chosen output directory.

---

## 6. Concurrency Architecture

The engine supports bounded concurrent profile execution:

- Master resolver: [`src/core/concurrency-resolver.ts`](file:///home/japheth/Desktop/hauntview/src/core/concurrency-resolver.ts)
- System capability heuristic: [`src/core/system-capability.ts`](file:///home/japheth/Desktop/hauntview/src/core/system-capability.ts)
- Bounded settled pool in [`src/engine.ts`](file:///home/japheth/Desktop/hauntview/src/engine.ts)
- Hosted guard: rejects concurrency on Render containers (`RENDER=true` or `HAUNT_HOSTED=1`).

See [`docs/CONCURRENCY.md`](file:///home/japheth/Desktop/hauntview/docs/CONCURRENCY.md) for detailed formulas and performance data.

---

## 7. Adding a New Profile

To introduce a new testing profile:

1. **Define contract:** Ensure your profile fits within the canonical rite types in `src/types/contracts.ts` and `src/types/profiles.ts`.
2. **Implement profile:** Create `src/profiles/<profile-id>.ts` implementing the `execute` contract with verified evidence collection.
3. **Register in ProfileManager:** Add profile metadata and duration estimates in `src/core/profile-manager.ts`.
4. **Wire into Engine:** Register instantiation logic in `src/engine.ts`.
5. **Add Unit Tests:** Create `src/profiles/__tests__/<profile-id>.test.ts` testing DOM inspection, fault simulation, and evidence requirements.
6. **Verify:** Run `pnpm test` and `pnpm run presubmit`.
