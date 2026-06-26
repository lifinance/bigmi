---
'@bigmi/client': minor
---

feat(metamask): add a MetaMask Bitcoin connector via the Wallet Standard

Adds a `metamask()` connector for MetaMask's native Bitcoin account. MetaMask
exposes Bitcoin through the Bitcoin Wallet Standard (the Multichain API has no
`bip122` namespace), so the connector discovers it via `@wallet-standard/app`
`getWallets()` (the `MetaMask` wallet exposing the `bitcoin:connect` feature)
and uses `bitcoin:connect` / `bitcoin:signTransaction` / `bitcoin:events` for
connecting, signing PSBTs, and account-change events.

Unlike injected wallets, MetaMask's Wallet Standard wallet is registered by the
consuming app via `@metamask/bitcoin-wallet-standard`
(`registerBitcoinWalletStandard({ client })`) before it appears in the registry.
