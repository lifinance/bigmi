# @bigmi/core

## 0.9.0

### Minor Changes

- [#62](https://github.com/lifinance/bigmi/pull/62) [`3569fc2`](https://github.com/lifinance/bigmi/commit/3569fc295a7877daf5b47989edecde85b2c38ea8) Thanks [@chybisov](https://github.com/chybisov)! - chore: migrate the toolchain to TypeScript 7

  Bump the `typescript` devDependency from `6.x` to `7.x` (the native compiler) across the workspace, and bump `tsdown` `0.22.3` → `0.22.7` so its peer range accepts `typescript@^7`.

  This is a build-time-only change with **no integration impact**: `typescript` is a devDependency (never a peer/runtime dependency), so consumers' own TypeScript version is untouched, and `.d.ts`/`.js` emit is handled by tsdown (Rolldown + OXC isolated declarations), not `tsc`. `tsc --noEmit` type-checks cleanly on TS 7 with zero source changes, and the public type surface is semantically identical (a rebuild only reformats declaration whitespace/comments via the newer `rolldown-plugin-dts` printer). Safe to ship as a minor.

## 0.8.1

### Patch Changes

- [#55](https://github.com/lifinance/bigmi/pull/55) [`767fb0c`](https://github.com/lifinance/bigmi/commit/767fb0cba233decea140daf1b562c104f027a261) Thanks [@chybisov](https://github.com/chybisov)! - Update the `zustand` runtime dependency to `^5.0.14`.
