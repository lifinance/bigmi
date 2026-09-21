---
'@bigmi/client': patch
---

Stop MetaMask Bitcoin from opening the extension on page load. `connect()` ignored the `isReconnecting` flag and read accounts through the interactive `bitcoin:connect`, so `reconnect()` prompted a returning user whose wallet was locked. It now reads the session the wallet already restored, matching `unisat`, `okx`, `binance`, `bitget` and `onekey`.

The wallet fills its `accounts` from a session lookup it does not await, so that read is polled for up to a second rather than taken as a first snapshot — otherwise a wallet that registers after the app mounts reports no session and never recovers. An absent session now rejects with `ConnectorNotConnectedError` instead of `UserRejectedRequestError`, since nothing was shown to the user.

`isAuthorized()` now also requires a restored account, as `unisat`, `okx`, `binance`, `bitget` and `onekey` do, so a user who revoked the site or locked the wallet is not reconnected and does not pay for the poll. A failure while reconnecting keeps its own error type rather than becoming `UserRejectedRequestError`, and an account that cannot be parsed is skipped instead of ending the poll.
