---
'@bigmi/client': patch
---

Clear a connection even when the connector's `disconnect()` throws. `xverse`, `oyl` and `leather` throw `ProviderNotFoundError` once their provider is gone, which skipped the delete and left the connection to be promoted to `current` — so the store still reported an account that could never sign, and the next disconnect failed too. The state is now consistent and the error still reaches the caller.
