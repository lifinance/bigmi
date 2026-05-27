# Pipeline — bigmi (`.github/workflows/publish.yaml`)

Trigger: **`push: main`** (not tags). `concurrency: release-${{ github.ref }}`,
`cancel-in-progress: false`.

## Jobs

1. **verify** — lint / types / circular-deps / knip / build / test as the release gate.
2. **changesets** — `changesets/action` with `version: pnpm changeset:version`. Opens/
   refreshes the **"chore: version packages"** PR (bumps versions, refreshes internal
   `workspace:^` ranges, regenerates per-package `CHANGELOG.md`). Outputs `hasChangesets`.
3. **release** — runs only when `hasChangesets == 'false'`. Runs `publish: pnpm
   changeset:publish` + `createGithubReleases: true`; holds `id-token: write` for npm
   provenance (OIDC). Outputs `publishedPackages`.
4. **linear-meta** + **linear** — gated on `@bigmi/react` in `publishedPackages`; see
   `linear-sync.md`.

Per-package npm publishes, per-package git tags (`@bigmi/core@x.y.z`, etc.), and per-package
GitHub Releases are all emitted by the single `release` run.

## BLOCKER-class: the transform MUST run in `changeset:publish`

bigmi commits `main: ./src/index.ts` and **no `exports`** in every package.json. The real
publishable shape — including **`@bigmi/core`'s dual CJS+ESM `exports`** (`import` →
`dist/esm`, `default` → `dist/cjs`, `module` deleted) — is synthesized **only** by
`scripts/formatPackageJson.js`, which runs via each package's `build:prerelease`.

`changeset publish` does a flat per-package `npm publish` and does **NOT** run
`build:prerelease`. So `changeset:prepublish` (called by `changeset:publish`) runs `pnpm
build` then per-package `build:prerelease` to synthesize the shape **before** publish.
Calling `changeset publish` bare would ship `@bigmi/core` with `main: ./src/index.ts` and no
dist exports — broken for every consumer. After a publish, sanity-check the `@bigmi/core`
tarball's `exports` if anything in the build/transform changed.

## Why push:main, not tags

`GITHUB_TOKEN`-created tags don't retrigger workflows, and one merge publishing N packages
must produce N tags in **one** run. Inverting to `push: main` + `createGithubReleases` is
the wagmi pattern.

## OIDC — keep the filename

npm trusted publishing (PR #52, no npm token; `.npmrc` `provenance=true`) binds to the
**`publish.yaml`** filename. Keep it. Publish runs in the `release` job.

## Rerun idempotency

Re-running `release` after a partial publish is safe: `changeset publish` skips
already-published versions (409); an existing tag/Release is tolerated (422). Confirm rather
than assume when recovering.
