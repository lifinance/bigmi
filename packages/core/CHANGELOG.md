# @bigmi/core

## 0.9.2

### Patch Changes

- [#77](https://github.com/lifinance/bigmi/pull/77) [`381ec46`](https://github.com/lifinance/bigmi/commit/381ec46972111fa5614fff24127b34cce730dc0b) Thanks [@chybisov](https://github.com/chybisov)! - Report a declined confirmation as `UserRejectedRequestError` even when the wallet sends no rejection code. MetaMask's Bitcoin confirmation throws with no `code` at all and a generic `-32603` underneath, so it previously surfaced as `Unknown Error` and consumers could not tell a cancellation from a failure. Also recognise EIP-1193 `4001`, which the switch did not cover.

## 0.9.1

### Patch Changes

- [#75](https://github.com/lifinance/bigmi/pull/75) [`c9f3cd2`](https://github.com/lifinance/bigmi/commit/c9f3cd28fb5010277744c09857a4f4e1eaac6551) Thanks [@chybisov](https://github.com/chybisov)! - Bump runtime dependencies: `bitcoinjs-lib` 7.0.1 → 7.0.2 and `zustand` 5.0.14 → 5.0.15.
  
  `@noble/hashes` stays on `^1.8.0` on purpose. `bitcoinjs-lib@7.0.2` and `bs58check@4.0.0`
  both declare `@noble/hashes: ^1.2.0`, so moving `@bigmi/core` to v2 would put two copies of
  the library in every consumer's tree. v2 is also ESM-only and drops the `./sha256`,
  `./sha1` and `./ripemd160` subpaths that `bitcoinjs-lib` imports, so an `overrides` pin to
  v2 would break it at runtime. Revisit once `bitcoinjs-lib` widens its range.

## 0.9.0

### Minor Changes

- [#62](https://github.com/lifinance/bigmi/pull/62) [`3569fc2`](https://github.com/lifinance/bigmi/commit/3569fc295a7877daf5b47989edecde85b2c38ea8) Thanks [@chybisov](https://github.com/chybisov)! - chore: migrate the toolchain to TypeScript 7

  Bump the `typescript` devDependency from `6.x` to `7.x` (the native compiler) across the workspace, and bump `tsdown` `0.22.3` → `0.22.7` so its peer range accepts `typescript@^7`.

  This is a build-time-only change with **no integration impact**: `typescript` is a devDependency (never a peer/runtime dependency), so consumers' own TypeScript version is untouched, and `.d.ts`/`.js` emit is handled by tsdown (Rolldown + OXC isolated declarations), not `tsc`. `tsc --noEmit` type-checks cleanly on TS 7 with zero source changes, and the public type surface is semantically identical (a rebuild only reformats declaration whitespace/comments via the newer `rolldown-plugin-dts` printer). Safe to ship as a minor.

## 0.8.1

### Patch Changes

- [#55](https://github.com/lifinance/bigmi/pull/55) [`767fb0c`](https://github.com/lifinance/bigmi/commit/767fb0cba233decea140daf1b562c104f027a261) Thanks [@chybisov](https://github.com/chybisov)! - Update the `zustand` runtime dependency to `^5.0.14`.
