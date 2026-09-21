# @bigmi/client

## 0.10.4

### Patch Changes

- [#80](https://github.com/lifinance/bigmi/pull/80) [`c3bff6a`](https://github.com/lifinance/bigmi/commit/c3bff6a26eefb41316f13fb9a6d52deace5bcb70) Thanks [@chybisov](https://github.com/chybisov)! - Detect Binance when `window.binancew3w` carries no bitcoin provider but `window.unisat` reports `isBinance`. The check returned early on `binancew3w` alone, so that build fell through and Binance was reported unavailable.

- [#80](https://github.com/lifinance/bigmi/pull/80) [`c3bff6a`](https://github.com/lifinance/bigmi/commit/c3bff6a26eefb41316f13fb9a6d52deace5bcb70) Thanks [@chybisov](https://github.com/chybisov)! - Clear a connection even when the connector's `disconnect()` throws. `xverse`, `oyl` and `leather` throw `ProviderNotFoundError` once their provider is gone, which skipped the delete and left the connection to be promoted to `current` — so the store still reported an account that could never sign, and the next disconnect failed too. The state is now consistent and the error still reaches the caller. The connector's own storage shim is cleared on that path too, so the store and storage cannot disagree and a later reconnect cannot silently restore what the user disconnected.

- [#80](https://github.com/lifinance/bigmi/pull/80) [`c3bff6a`](https://github.com/lifinance/bigmi/commit/c3bff6a26eefb41316f13fb9a6d52deace5bcb70) Thanks [@chybisov](https://github.com/chybisov)! - Stop MetaMask Bitcoin from opening the extension on page load. `connect()` ignored the `isReconnecting` flag and read accounts through the interactive `bitcoin:connect`, so `reconnect()` prompted a returning user whose wallet was locked. It now reads the session the wallet already restored, matching `unisat`, `okx`, `binance`, `bitget` and `onekey`.
  
  The wallet fills its `accounts` from a session lookup it does not await, so that read is polled briefly rather than taken as a first snapshot — otherwise a wallet that registers after the app mounts reports no session and never recovers. An absent session now rejects with `ConnectorNotConnectedError` instead of `UserRejectedRequestError`, since nothing was shown to the user.
  
  `isAuthorized()` deliberately gates on the storage shim and the wallet's presence, not on its accounts: the wallet fills its `accounts` from a lookup it does not await, so reading them there would race the restore, report false on every reload and skip reconnect entirely. `connect({ isReconnecting: true })` is what waits for the session and rejects when it never arrives. A failure while reconnecting keeps its own error type rather than becoming `UserRejectedRequestError`, and an account that cannot be parsed is skipped instead of ending the poll.
  
  A `change` event no longer throws out of MetaMask's emitter when one account cannot be parsed, and a batch where nothing parses is treated as the transient half-initialized state rather than a disconnect, and a selection that leaves no payment address now disconnects instead of reporting a connected wallet with no usable address. The connected shim is cleared when the wallet itself disconnects, so revoking the site inside MetaMask is not retried on every load.
  
  An empty selection — a user with no Bitcoin account — now rejects with `ConnectorNotConnectedError` on the interactive path too, rather than a `TypeError` relabelled as a rejection. A reconnect that finds no session keeps the connected shim, because the poll cannot tell an absent session from a wallet that has not answered yet and dropping it would permanently sign out a user whose session is valid; a genuine revoke still clears it through `onDisconnect`. Only the interactive `bitcoin:connect` maps to `UserRejectedRequestError`, so a blocked storage write no longer reports a successful connect as a rejection, and `onDisconnect` releases the events subscription so a later connect rebinds to the current wallet object.

## 0.10.3

### Patch Changes

- [#77](https://github.com/lifinance/bigmi/pull/77) [`381ec46`](https://github.com/lifinance/bigmi/commit/381ec46972111fa5614fff24127b34cce730dc0b) Thanks [@chybisov](https://github.com/chybisov)! - Detect BitKeep when it injects only as `window.unisat` with `isBitKeep`, not just as `window.bitkeep`.
- Updated dependencies [[`381ec46`](https://github.com/lifinance/bigmi/commit/381ec46972111fa5614fff24127b34cce730dc0b)]:
  - @bigmi/core@0.9.2

## 0.10.2

### Patch Changes

- [#75](https://github.com/lifinance/bigmi/pull/75) [`c9f3cd2`](https://github.com/lifinance/bigmi/commit/c9f3cd28fb5010277744c09857a4f4e1eaac6551) Thanks [@chybisov](https://github.com/chybisov)! - Bump runtime dependencies: `bitcoinjs-lib` 7.0.1 → 7.0.2 and `zustand` 5.0.14 → 5.0.15.
  
  `@noble/hashes` stays on `^1.8.0` on purpose. `bitcoinjs-lib@7.0.2` and `bs58check@4.0.0`
  both declare `@noble/hashes: ^1.2.0`, so moving `@bigmi/core` to v2 would put two copies of
  the library in every consumer's tree. v2 is also ESM-only and drops the `./sha256`,
  `./sha1` and `./ripemd160` subpaths that `bitcoinjs-lib` imports, so an `overrides` pin to
  v2 would break it at runtime. Revisit once `bitcoinjs-lib` widens its range.
- Updated dependencies [[`c9f3cd2`](https://github.com/lifinance/bigmi/commit/c9f3cd28fb5010277744c09857a4f4e1eaac6551)]:
  - @bigmi/core@0.9.1

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
