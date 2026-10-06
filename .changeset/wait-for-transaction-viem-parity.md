---
'@bigmi/core': patch
---

Stop `waitForTransaction` from reporting the awaited transaction as its own replacement. When `getrawtransaction` still reported the transaction unconfirmed but `getblock` already listed it, the replacement search matched the transaction itself, because it spends the same inputs, and called `onReplaced` with it. A replacement that `getrawtransaction` reported with no confirmations also resolved the wait at once, and a replacement that needed more confirmations resolved it in a later block without `onReplaced`. The search now skips the awaited txid, a replacement without confirmations keeps the wait polling, and `onReplaced` fires once, when the replacement has enough confirmations.

Settle `withRetry` when `shouldRetry` or the `delay` function throws. The throw rejected an internal attempt that nothing handled, so the returned promise stayed pending and the error surfaced only as an unhandled rejection. `withRetry` now rejects with that error.

Wait for every confirmation of a mined transaction in `waitForTransaction`. The `retryCount` block budget also counted the blocks after the transaction was mined, so a wait for more confirmations than the budget had left rejected with `WaitForTransactionReceiptTimeoutError` while the transaction was confirming: with the default `retryCount` of 10, a wait for 6 confirmations rejected if the transaction was mined 6 or more blocks after the wait started. The budget now counts only the blocks in which the transaction, or the replacement it tracks, is not mined. An unmined transaction still rejects on the same block as before.
