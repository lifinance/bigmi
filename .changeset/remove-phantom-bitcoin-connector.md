---
'@bigmi/client': minor
---

Remove the Phantom Bitcoin connector. Phantom deprecated its Bitcoin wallet and removed the injected `window.phantom.bitcoin` provider, so the `phantom()` connector (and its `PhantomBitcoinEventMap` / `PhantomBitcoinEvents` types) no longer function and have been removed from `@bigmi/client`.
