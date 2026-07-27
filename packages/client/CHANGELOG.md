# @bigmi/client

## 0.10.1

### Patch Changes

- [#67](https://github.com/lifinance/bigmi/pull/67) [`3532b51`](https://github.com/lifinance/bigmi/commit/3532b51ae6844bc71bebb0699432c34272505535) Thanks [@arentant](https://github.com/arentant)! - Prevent UniSat reconnect from opening the extension popup on page load.

- [#70](https://github.com/lifinance/bigmi/pull/70) [`f427391`](https://github.com/lifinance/bigmi/commit/f4273913c922b3324da8c1910cb5fd4bd08439bc) Thanks [@chybisov](https://github.com/chybisov)! - Stop the Binance, Bitget, OKX and OneKey connectors from opening their wallet extension on page load. `connect()` now honours `isReconnecting` and verifies authorization through passive `getAccounts()` access, matching the UniSat, Xverse and Unhosted connectors. Bitget and OKX additionally confirm the extension still exposes an account instead of trusting the `connected` storage shim alone, and `getAccounts()` returns an empty list rather than throwing when no account is exposed. All five connectors now report an account-less extension as `ConnectorNotConnectedError` instead of mislabelling it a user rejection: the `try` wraps only `requestAccounts()`, the one step a user can actually reject. This also fixes OKX persisting a `disconnected` shim — and so silently disabling its own auto-reconnect for good — when a reconnect found no accounts.

- [#66](https://github.com/lifinance/bigmi/pull/66) [`8da5d88`](https://github.com/lifinance/bigmi/commit/8da5d88115f4fdeebeb3444da88c81f10511f301) Thanks [@yasha-meursault](https://github.com/yasha-meursault)! - Fix `reconnect` leaving a stale connection stub after reload. On the first successful reconnection the connections map is now rebuilt from scratch instead of copying the map rehydrated from storage under the previous session's connector uid, and `current` points at the freshly reconnected connector. When no connector reconnects, `connections` and `current` are reset alongside `status: 'disconnected'`. Matches wagmi's behavior.

- [#69](https://github.com/lifinance/bigmi/pull/69) [`7ff01b5`](https://github.com/lifinance/bigmi/commit/7ff01b51849df1bcb8c8017109de5db72524a235) Thanks [@chybisov](https://github.com/chybisov)! - Stop `reconnect` from clearing a connection established by a concurrent `connect()` call. Reconnect runs on mount and polls for a wallet provider for up to 5s, so a user can connect manually while it is still in flight; the no-connector-reconnected reset now only applies when the store is still in the `reconnecting`/`connecting` state reconnect put it in. Matches wagmi's behavior.

## 0.10.0

### Minor Changes

- [#62](https://github.com/lifinance/bigmi/pull/62) [`3569fc2`](https://github.com/lifinance/bigmi/commit/3569fc295a7877daf5b47989edecde85b2c38ea8) Thanks [@chybisov](https://github.com/chybisov)! - chore: migrate the toolchain to TypeScript 7

  Bump the `typescript` devDependency from `6.x` to `7.x` (the native compiler) across the workspace, and bump `tsdown` `0.22.3` → `0.22.7` so its peer range accepts `typescript@^7`.

  This is a build-time-only change with **no integration impact**: `typescript` is a devDependency (never a peer/runtime dependency), so consumers' own TypeScript version is untouched, and `.d.ts`/`.js` emit is handled by tsdown (Rolldown + OXC isolated declarations), not `tsc`. `tsc --noEmit` type-checks cleanly on TS 7 with zero source changes, and the public type surface is semantically identical (a rebuild only reformats declaration whitespace/comments via the newer `rolldown-plugin-dts` printer). Safe to ship as a minor.

### Patch Changes

- Updated dependencies [[`3569fc2`](https://github.com/lifinance/bigmi/commit/3569fc295a7877daf5b47989edecde85b2c38ea8)]:
  - @bigmi/core@0.9.0

## 0.9.0

### Minor Changes

- [#60](https://github.com/lifinance/bigmi/pull/60) [`d16c7bf`](https://github.com/lifinance/bigmi/commit/d16c7bf4b420185a6de05739b34fea14e76fb1ff) Thanks [@chybisov](https://github.com/chybisov)! - feat(metamask): add a MetaMask Bitcoin connector via the Wallet Standard

  Adds a `metamask()` connector for MetaMask's native Bitcoin account. MetaMask
  exposes Bitcoin through the Bitcoin Wallet Standard (the Multichain API has no
  `bip122` namespace), so the connector discovers it via `@wallet-standard/app`
  `getWallets()` (the `MetaMask` wallet exposing the `bitcoin:connect` feature)
  and uses `bitcoin:connect` / `bitcoin:signTransaction` / `bitcoin:events` for
  connecting, signing PSBTs, and account-change events.

  Unlike injected wallets, MetaMask's Wallet Standard wallet is registered by the
  consuming app via `@metamask/bitcoin-wallet-standard`
  (`registerBitcoinWalletStandard({ client })`) before it appears in the registry.

- [#59](https://github.com/lifinance/bigmi/pull/59) [`3300f33`](https://github.com/lifinance/bigmi/commit/3300f33d2ac7b903e712a35bad29b1c31701c7a4) Thanks [@chybisov](https://github.com/chybisov)! - Remove the Phantom Bitcoin connector. Phantom deprecated its Bitcoin wallet and removed the injected `window.phantom.bitcoin` provider, so the `phantom()` connector (and its `PhantomBitcoinEventMap` / `PhantomBitcoinEvents` types) no longer function and have been removed from `@bigmi/client`.

## 0.8.1

### Patch Changes

- [#55](https://github.com/lifinance/bigmi/pull/55) [`767fb0c`](https://github.com/lifinance/bigmi/commit/767fb0cba233decea140daf1b562c104f027a261) Thanks [@chybisov](https://github.com/chybisov)! - Update the `zustand` runtime dependency to `^5.0.14`.

- Updated dependencies [[`767fb0c`](https://github.com/lifinance/bigmi/commit/767fb0cba233decea140daf1b562c104f027a261)]:
  - @bigmi/core@0.8.1
