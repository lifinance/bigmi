# @bigmi/client

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
