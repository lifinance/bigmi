# Channels — bigmi

Channels map to npm **dist-tags**, controlled by Changesets `pre` mode.

| Channel | dist-tag | How |
|---|---|---|
| stable | `latest` | normal (not in pre mode) — **current state** |
| beta | `beta` | `pre` mode with `tag: beta` (one-off; exit after) |
| alpha | `alpha` | `pre` mode with `tag: alpha` (one-off; exit after) |
| canary | `canary` | snapshot: `changeset version --snapshot canary` + `changeset publish --tag canary` (additive; not wired in CI today) |

## Current state: stable line (no pre-mode)

bigmi is **not** in pre mode — there is no `.changeset/pre.json`. `latest` is `0.8.0`, and a
normal changeset bumps to `0.8.1` / `0.9.0`, publishing to `latest`. This is correct: bigmi
has no v3-style stable-vs-next split, so `0.x` → `latest` is exactly what you want.

**Do not create `.changeset/pre.json`** for a routine release.

## One-off alpha/beta (only if you actually need a prerelease line)

```
pnpm changeset pre enter beta     # start a beta line
# ... add changesets, merge the version PR, publish to @beta ...
pnpm changeset pre exit           # IMPORTANT: exit so the next release returns to `latest`
```

Because `latest` is the normal target here, the danger is the **opposite** of widget/sdk:
forgetting to `pre exit` would keep subsequent releases stuck on `@beta` instead of
`latest`. Enter pre mode only for a deliberate prerelease, and exit as soon as you're done.

## Verify after publish

```bash
npm view @bigmi/react dist-tags
npm view @bigmi/core dist-tags
```

In normal operation `latest` should advance to the just-published `0.x`. See `dist-tags.md`.
