---
'@bigmi/core': patch
---

Report a declined confirmation as `UserRejectedRequestError` even when the wallet sends no rejection code. MetaMask's Bitcoin confirmation throws with no `code` at all and a generic `-32603` underneath, so it previously surfaced as `Unknown Error` and consumers could not tell a cancellation from a failure. Also recognise EIP-1193 `4001`, which the switch did not cover.
