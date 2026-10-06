---
'@bigmi/core': patch
---

Stop `waitForTransaction` from reporting the awaited transaction as its own replacement. When `getrawtransaction` still reported the transaction unconfirmed but `getblock` already listed it, the replacement search matched the transaction itself, because it spends the same inputs, and called `onReplaced` with it. A replacement that `getrawtransaction` reported with no confirmations also resolved the wait at once, and a replacement that needed more confirmations resolved it in a later block without `onReplaced`. The search now skips the awaited txid, a replacement without confirmations keeps the wait polling, and `onReplaced` fires once, when the replacement has enough confirmations.
