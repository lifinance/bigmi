# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bigmi ("Bitcoin Is Gonna Make It") is a TypeScript library providing reactive primitives for Bitcoin apps. It's a pnpm monorepo with three packages:

- **`@bigmi/core`** — Core Bitcoin actions, transports (Ankr, Mempool, Blockcypher, Blockchair), chain definitions, utilities
- **`@bigmi/client`** — Wallet connectors (Binance, Unisat, OKX, Xverse, Phantom, Ctrl, etc.), state management via zustand
- **`@bigmi/react`** — React hooks (`useAccount`, `useConnect`, `useConnectors`), context provider, SSR hydration

Dependency chain: `core` ← `client` ← `react` (react also depends directly on core).

## Commands

```bash
pnpm build                    # Build all packages in parallel (tsdown)
pnpm check                    # Biome lint + format check
pnpm check:write              # Biome lint + format with auto-fix
pnpm check:types              # tsc --noEmit across all packages
pnpm check:circular-deps      # madge circular dependency check
pnpm test                     # vitest (only @bigmi/core has tests)
pnpm knip:check               # Check for unused deps/files

# Single package
cd packages/core && pnpm build
cd packages/core && pnpm test
cd packages/core && vitest run src/transports/ankr/ankr.spec.ts  # single test file
```

Pre-commit hook runs: `check` → `check:types` → `check:circular-deps` → `knip:check`
Pre-push hook runs: `test`

Run `pnpm check:write` before committing — the pre-commit hook runs `pnpm check` (read-only) and will reject unformatted code.

## Build System

Uses **tsdown** (powered by Rolldown/OXC) for all packages. Each package has a `tsdown.config.ts` producing dual ESM (`dist/esm/`) and CJS (`dist/cjs/`) outputs with source maps and `.d.ts` files.

`isolatedDeclarations: true` in root tsconfig — all exported functions, variables, and class overrides **must** have explicit type annotations. OXC's declaration emitter requires this.

`scripts/version.js` generates `src/version.ts` in each package at build time. `scripts/build.js` wraps tsdown with per-package timing.

## Code Style

- **Biome** for formatting and linting (not ESLint/Prettier)
- Single quotes, no semicolons, 2-space indent, trailing commas (es5)
- `console.log`/`console.info` are errors — use `console.warn`/`console.error` only
- Imports use `.js` extensions for all local imports (Node ESM convention)
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint

## Architecture Notes

- **Connectors** (`client/src/connectors/`) follow a factory pattern via `createConnector<Provider, Properties>()`. Each connector function has a `declare namespace` + `.type = 'UTXO'` pattern for `isolatedDeclarations` compatibility.
- **Transports** (`core/src/transports/`) wrap Bitcoin RPC endpoints. Each transport (ankr, mempool, etc.) uses the `utxo()` factory from `core/src/transports/utxo.ts`.
- **State management** uses zustand internally. `getAccount()` and `getConnectors()` use module-level caching with `deepEqual` for referential stability (critical for `useSyncExternalStore` SSR).
- **Publishing** uses `scripts/formatPackageJson.js` to rewrite `package.json` at publish time (injects `exports`, removes `scripts`/`devDependencies`), then restores after publish. The dev-time `main`/`types` fields point to `./src/index.ts`.
- **Dev-time package.json has no `exports` field** — pnpm resolves workspace packages via `main: ./src/index.ts` directly. The `exports` map only exists ephemerally during `npm publish`.
- **React package** has `'use client'` directives on hook files for Next.js App Router compatibility.
