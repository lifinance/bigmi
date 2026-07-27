---
'@bigmi/client': patch
---

Stop the Binance, Bitget, OKX and OneKey connectors from opening their wallet extension on page load. `connect()` now honours `isReconnecting` and verifies authorization through passive `getAccounts()` access, matching the UniSat, Xverse and Unhosted connectors. Bitget and OKX additionally confirm the extension still exposes an account instead of trusting the `connected` storage shim alone, and `getAccounts()` returns an empty list rather than throwing when no account is exposed. All five connectors now report an account-less extension as `ConnectorNotConnectedError` instead of mislabelling it a user rejection: the `try` wraps only `requestAccounts()`, the one step a user can actually reject. This also fixes OKX persisting a `disconnected` shim — and so silently disabling its own auto-reconnect for good — when a reconnect found no accounts.
