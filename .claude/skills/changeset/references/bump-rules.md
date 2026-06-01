# Bump rules — bigmi

## Bump level

- **`feat:`** (new capability, backwards-compatible) → **minor**
- **`fix:`** (bug fix, backwards-compatible) → **patch**
- **breaking change** (removed/renamed export, changed signature, behavior break) → **major**

bigmi is on its **stable `0.x` line** (no pre-mode), so bumps publish straight to the
`latest` dist-tag. Note `0.x` semantics: a breaking change is conventionally a **minor**
(`0.8.x` → `0.9.0`) and a feature/fix a **patch** — but Changesets applies literal
major/minor/patch, so use **minor** for breaking and **patch** for feat/fix while in `0.x`,
unless the team decides to go `1.0.0`.

## Publishable packages (these need a changeset when changed)

- `@bigmi/core`
- `@bigmi/client`
- `@bigmi/react`

There are no private/ignored workspace packages (`.changeset/config.json` `ignore` is empty).

## Dependency graph — don't author cascade-only changesets

```
@bigmi/core
  ↑ @bigmi/client   (depends on core)
  ↑ @bigmi/react    (depends on client AND core)
```

Internal deps use `workspace:^`. With `updateInternalDependencies: patch`, bumping a
package **re-releases its dependents automatically**. So:

- Changed `@bigmi/core` only → declare a changeset for **just** `@bigmi/core`; `client` and
  `react` bump on their own.
- Changed `@bigmi/react` only → declare a changeset for **just** `@bigmi/react`.

Declare only the packages whose *source* you actually edited; never add changesets for
cascade-only dependents.

## Note: published shape is synthesized at publish time

bigmi package.jsons commit `main: ./src/index.ts` and **no `exports`** field. The real
published shape (incl. `@bigmi/core`'s dual CJS+ESM `exports`) is synthesized by
`scripts/formatPackageJson.js` during `changeset:prepublish` — this doesn't affect how you
write a changeset, but it's why you never see `exports`/`dist` paths in the committed files.
