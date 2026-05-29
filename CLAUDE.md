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

## Release

Releases use **[Changesets](https://github.com/changesets/changesets)** (independent versioning). Lerna and standard-version have been removed.

**Per-PR rule: every PR with a publishable change MUST include a changeset.** Run `pnpm changeset`, pick the affected packages (`@bigmi/core` / `@bigmi/client` / `@bigmi/react`) and bump level (patch/minor/major), and commit the generated `.changeset/*.md`. `changeset-bot` comments a reminder on any PR that touches publishable source without one (a nudge, not a hard block — the maintainer-reviewed Version PR is the real gate). Docs-only / chore-only PRs (markdown, `.github/`, dotfiles, lockfile) are exempt; for a deliberately release-less change use `pnpm changeset --empty`.

**Flow (all automated on push to `main` via `publish.yaml`):**
1. PRs land with changeset files.
2. Changesets opens/updates a **"chore: version packages"** PR that consumes the changesets, bumps versions, refreshes internal `workspace:^` ranges, and writes per-package `CHANGELOG.md`.
3. Merging that PR triggers `release`, which runs `pnpm changeset:publish` and creates GitHub Releases.
4. On a successful publish that includes `@bigmi/react`, the **Linear "Bigmi"** pipeline is synced (issues attached + release completed).

**Canary previews (per-PR, opt-in):** add the **`release-canary`** label to a PR to publish a throwaway `0.0.0-canary-<timestamp>` build of the changed packages to npm under the **`canary`** dist-tag, for sharing an unmerged build with other teams / externally. The `canary` job comments the exact install command and removes the label after publishing (one-shot — re-add to repeat). Install the exact version it prints (e.g. `npm i @bigmi/react@0.0.0-canary-…`); `0.0.0` can never become `latest`. bigmi is on a stable line, so it snapshots directly (no pre-mode exit needed). Guardrails: applying a label requires Triage+ on the repo (external people / fork-PR authors can't trigger it), the same-repo guard means the published code was pushed by someone with Write access (forks excluded), and the job is isolated (no extra secrets). This is GitHub's native label-permission gate — no in-workflow role check.

**Root scripts:**
- `pnpm changeset:version` — `changeset version` + lockfile refresh (`pnpm install --lockfile-only`) + `pnpm check:write`.
- `pnpm changeset:prepublish` — `pnpm build` then per-package `build:prerelease`. **This is where `scripts/formatPackageJson.js` runs** (via each package's `build:prerelease`), synthesizing the real publishable `package.json` (`main: ./dist/esm/index.js`, `exports` map; `@bigmi/core` gets a dual CJS+ESM `exports`). `changeset publish` does NOT run `build:prerelease`, so the transform MUST live here.
- `pnpm changeset:publish` — `pnpm changeset:prepublish && changeset publish`.

**Versioning / channels:** latest is stable (`0.8.0` → `0.8.x`/`0.9.0` published to the `latest` dist-tag). There is **no pre-mode** (`.changeset/pre.json` does not exist). For alpha/beta, enter pre-mode explicitly with `pnpm changeset pre enter alpha` (or `beta`), version/publish, then `pnpm changeset pre exit`.

**npm auth:** OIDC trusted publishing (no `NPM_TOKEN`); the trusted publisher on npmjs.com is bound to this repo **and** the `publish.yaml` filename (PR #52). Do not rename `publish.yaml`. `.npmrc` sets `provenance=true`.

**Linear anchor:** the release is synced when `@bigmi/react` is among the published packages — it sits atop the dependency graph (publishes nearly every cycle) and is what consumers install, giving maximum coverage. A cycle that publishes only `@bigmi/core`/`@bigmi/client` without a react bump is **skipped**; reconcile that release in Linear manually if it ever happens.

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
- **Publishing** uses `scripts/formatPackageJson.js` (run via each package's `build:prerelease`, invoked by `changeset:prepublish` — see **## Release**) to synthesize the published `package.json`: injects `exports`, rewrites `main`/`types` to `./dist/esm/...`, and removes `scripts`/`devDependencies`. `@bigmi/core` is special-cased to a **dual CJS+ESM `exports`** (`import` → `dist/esm`, `default` → `dist/cjs`) with `module` deleted; the other two packages get ESM-only exports. The dev-time `main`/`types` fields point to `./src/index.ts`.
- **Dev-time package.json has no `exports` field** — pnpm resolves workspace packages via `main: ./src/index.ts` directly. The `exports` map only exists ephemerally during publish (synthesized by `changeset:prepublish`, never committed).
- **React package** has `'use client'` directives on hook files for Next.js App Router compatibility.
