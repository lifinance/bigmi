---
'@bigmi/client': patch
---

Detect Binance when `window.binancew3w` carries no bitcoin provider but `window.unisat` reports `isBinance`. The check returned early on `binancew3w` alone, so that build fell through and Binance was reported unavailable.
