---
'@bigmi/core': patch
'@bigmi/client': patch
---

Bump runtime dependencies: `bitcoinjs-lib` 7.0.2 → 7.0.5 and `zustand` 5.0.15 → 5.1.0.

`@noble/hashes` stays on `^1.8.0`. `bitcoinjs-lib@7.0.5` and `bs58check@4.0.0` still
declare `@noble/hashes: ^1.2.0`. If `@bigmi/core` moves to v2, every consumer gets two
copies of the library. Version 2 also removes the `./sha256`, `./sha1` and `./ripemd160`
subpaths that `bitcoinjs-lib` imports. Revisit when `bitcoinjs-lib` widens its range.
