---
name: release
description: >-
  Cut and manage releases for the bigmi monorepo (Changesets + wagmi model).
  Use this when the user wants to release/publish @bigmi packages, asks about
  the "version packages" PR, dist-tags, alpha/beta channels, the npm publish
  pipeline, the Linear "Bigmi" release sync, or how a merge becomes published
  npm packages + GitHub Releases. Covers the maintainer flow, the stable-line
  channel state, and the dual CJS/ESM publish transform specific to this repo.
---

# Releasing bigmi

bigmi publishes with **Changesets** on the wagmi model: releases are driven by `push:
main`, not by tags. There is **no single repo version tag** — each package gets its own
`@bigmi/<pkg>@x.y.z` tag and GitHub Release, all created in one publish run.

## The flow at a glance

1. PRs land on `main`, each carrying a changeset (see the `changeset` skill).
2. `publish.yaml` `changesets` job opens/updates a **"chore: version packages"** PR.
3. Merging it → the `release` job runs `pnpm changeset:publish` (build → per-package
   transform → `changeset publish`), publishes to npm with provenance, creates per-package
   GitHub Releases.
4. The `linear-meta` + `linear` jobs sync the "Bigmi" Linear release.

Read the reference for the part you're working on:

- **`references/pipeline.md`** — workflow jobs, triggers, and the **blocker-class** transform
  wrap that keeps `@bigmi/core`'s dual CJS/ESM map correct. Rerun idempotency.
- **`references/channels.md`** — the stable-line state and how to do a one-off alpha/beta.
- **`references/dist-tags.md`** — npm dist-tag behavior (stable `0.x` → `latest`).
- **`references/linear-sync.md`** — the single "Bigmi" anchor (`@bigmi/react`).

## This repo's release state

- **Stable line, no pre-mode.** `latest` on npm is `0.8.0`; publishing `0.8.x`/`0.9.0` to
  `latest` is correct. There is **no `.changeset/pre.json`**. For a one-off alpha/beta,
  enter pre mode explicitly (see `channels.md`) and exit afterward.
- **One Linear anchor:** `@bigmi/react` → "Bigmi", secret `LINEAR_RELEASE_ACCESS_KEY`. react
  sits atop the graph (publishes nearly every cycle) and is what consumers install.
- **Dual CJS/ESM `@bigmi/core` is synthesized at publish.** The transform MUST run in
  `changeset:publish` or `@bigmi/core` ships pointing at TS source — see
  `references/pipeline.md`.
- **OIDC trusted publishing** (no npm token, PR #52); the trusted publisher is bound to the
  `publish.yaml` filename — keep that filename.
