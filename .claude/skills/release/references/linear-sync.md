# Linear sync — bigmi

bigmi syncs a **single** Linear release pipeline. Because secret refs must be static YAML,
it's modeled as a static gated **`linear-meta`** job (derives version/channel) feeding a
**`linear`** reusable-workflow caller — not a dynamic matrix.

| Anchor package | Linear release | Secret |
|---|---|---|
| `@bigmi/react` | "Bigmi" | `LINEAR_RELEASE_ACCESS_KEY` |

## Why `@bigmi/react` is the anchor

`@bigmi/react` sits at the **top** of the dependency graph (`core ← client ← react`), so any
`core`/`client`/`react` source change cascades up into a react bump — it publishes on nearly
every cycle, giving maximum coverage. It's also the package consumers install.

## How it works

The `linear-meta` job is gated on the anchor actually publishing:

```yaml
if: contains(needs.release.outputs.publishedPackages, '"@bigmi/react"')
```

It derives via `jq` over `publishedPackages`:

- `full` — published version, e.g. `0.8.1`
- `version` — `full` with any prerelease suffix stripped (on the stable line they're equal)
- `channel` — `alpha` / `beta` / `stable` (normally `stable`)

The `linear` job calls the reusable `linear-release.yaml` with `release_name: Bigmi`,
`version`, `channel`, and `release_tag: '@bigmi/react@<full>'`. The reusable runs `sync`
(attach issues + link the GitHub Release), then `update`+`stage` for alpha/beta or
`complete` for stable.

## Skip behavior

A cycle that publishes only `@bigmi/core` and/or `@bigmi/client` **without** a `@bigmi/react`
bump leaves react out of `publishedPackages`, so `linear-meta` skips → no "Bigmi" Linear
release for that cycle. This is rare (react depends on both, so it usually bumps too) and
intentional — reconcile manually in Linear if it ever happens.
