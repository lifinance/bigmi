---
"@bigmi/core": patch
---

`signPsbt` now asks the wallet only once. Before, bigmi retried the request after an unknown wallet error, for example a cancel without a code. A client with the default `retryCount` then opened the wallet prompt up to 4 times.
