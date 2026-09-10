---
'@bigmi/core': patch
'@bigmi/client': patch
---

Bump runtime dependencies: `bitcoinjs-lib` 7.0.1 → 7.0.2 and `zustand` 5.0.14 → 5.0.15.

`@noble/hashes` stays on `^1.8.0` on purpose. `bitcoinjs-lib@7.0.2` and `bs58check@4.0.0`
both declare `@noble/hashes: ^1.2.0`, so moving `@bigmi/core` to v2 would put two copies of
the library in every consumer's tree. v2 is also ESM-only and drops the `./sha256`,
`./sha1` and `./ripemd160` subpaths that `bitcoinjs-lib` imports, so an `overrides` pin to
v2 would break it at runtime. Revisit once `bitcoinjs-lib` widens its range.
