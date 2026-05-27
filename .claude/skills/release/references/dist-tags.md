# dist-tag safety — bigmi

bigmi is on a single **stable `0.x` line**, so dist-tags are simple — there is **no
v3-style stable-vs-next hazard** like widget/sdk.

## Current npm dist-tags

| Package | `latest` |
|---|---|
| `@bigmi/core` | `0.8.0` |
| `@bigmi/client` | `0.8.0` |
| `@bigmi/react` | `0.8.0` |

`changeset publish` defaults to the **`latest`** dist-tag (the repo is **not** in pre mode),
so a normal release publishes `0.8.x` / `0.9.0` → `latest`. That is exactly correct here.

## Rules

1. **Stay out of pre mode for routine releases.** Do not create `.changeset/pre.json`. The
   correct target is `latest`.
2. **One-off prereleases:** if you `pre enter alpha|beta` for a specific prerelease,
   **`pre exit` immediately after** so subsequent releases return to `latest` (see
   `channels.md`). The risk here is the inverse of widget/sdk: getting *stuck* on `@beta`.
3. **After publish, verify** `latest` advanced as expected:
   ```bash
   npm view @bigmi/react dist-tags
   ```

## Reversibility

dist-tag mistakes are reversible (`npm dist-tag add <pkg>@<version> latest`). **Version
unpublish is generally NOT reversible** (npm's 72h/policy window) — so a post-publish
dist-tag check is the real safety net, not unpublish.
