---
'@bigmi/client': patch
---

Stop MetaMask Bitcoin from opening the extension on page load. `connect()` ignored the `isReconnecting` flag and read accounts through the interactive `bitcoin:connect`, so `reconnect()` prompted a returning user whose wallet was locked. It now reads the session the wallet already restored, matching `unisat`, `okx`, `binance`, `bitget` and `onekey`.

The wallet fills its `accounts` from a session lookup it does not await, so that read is polled briefly rather than taken as a first snapshot — otherwise a wallet that registers after the app mounts reports no session and never recovers. An absent session now rejects with `ConnectorNotConnectedError` instead of `UserRejectedRequestError`, since nothing was shown to the user.

`isAuthorized()` deliberately gates on the storage shim and the wallet's presence, not on its accounts: the wallet fills its `accounts` from a lookup it does not await, so reading them there would race the restore, report false on every reload and skip reconnect entirely. `connect({ isReconnecting: true })` is what waits for the session and rejects when it never arrives. A failure while reconnecting keeps its own error type rather than becoming `UserRejectedRequestError`, and an account that cannot be parsed is skipped instead of ending the poll.

A `change` event no longer throws out of MetaMask's emitter when one account cannot be parsed, and a batch where nothing parses is treated as the transient half-initialized state rather than a disconnect, and a selection that leaves no payment address now disconnects instead of reporting a connected wallet with no usable address. The connected shim is cleared when the wallet itself disconnects, so revoking the site inside MetaMask is not retried on every load.

An empty selection — a user with no Bitcoin account — now rejects with `ConnectorNotConnectedError` on the interactive path too, rather than a `TypeError` relabelled as a rejection. A reconnect that finds no session keeps the connected shim, because the poll cannot tell an absent session from a wallet that has not answered yet and dropping it would permanently sign out a user whose session is valid; a genuine revoke still clears it through `onDisconnect`. Only the interactive `bitcoin:connect` maps to `UserRejectedRequestError`, so a blocked storage write no longer reports a successful connect as a rejection, and `onDisconnect` releases the events subscription so a later connect rebinds to the current wallet object.
