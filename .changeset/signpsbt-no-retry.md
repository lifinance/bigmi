---
"@bigmi/core": patch
---

`signPsbt` now asks the wallet only once. Before, a client with the default `retryCount` retried the request after a wallet error that bigmi does not know, for example a cancel without a code. Each retry opened the wallet prompt again, up to 4 times.
