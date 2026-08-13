---
---

Tooling-only change: dependency bumps, Changesets v2 → v3, and `changesets/action` v1 → v2.

No release. The two source touches are behaviour-preserving: an `useOptionalChain` lint
fix in `reconnect.ts`, and regenerating the `src/version.ts` files that had drifted in git
(the published packages were always correct — `build` regenerates them before publish).
