---
'@bigmi/client': patch
---

Stop MetaMask Bitcoin from opening the extension on page load. `connect()` ignored the `isReconnecting` flag and read accounts through the interactive `bitcoin:connect`, so `reconnect()` prompted a returning user whose wallet was locked. It now reads the session the wallet already restored, matching `unisat`, `okx`, `binance`, `bitget` and `onekey`.
