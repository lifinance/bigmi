# @bigmi/core

## 0.9.3

### Patch Changes

- [#82](https://github.com/lifinance/bigmi/pull/82) [`5b52eb3`](https://github.com/lifinance/bigmi/commit/5b52eb318b03f31758f7a021a69265a4774f8602) Thanks [@chybisov](https://github.com/chybisov)! - Keep the shared block watcher alive when a `waitForTransaction` times out. When a wait reached its `retryCount` timeout and the same block callback then found the transaction confirmed or replaced, or failed to fetch the block, its internal `done` ran a second time. That second pass ran the watcher's cleanup while another wait on the same client still listened, so that wait and every later wait on the client never settled. It could also settle a newer wait on the same txId with the stale error of the first one. `done` now runs at most once, and an observer's `unwatch` is a no-op once its own listener is gone.
  
  Release the observers of a settled `waitForTransaction`. A wait that joined another wait on the same txId, such as a resumed run, stayed in the module-level `listenersCache` with its callbacks after both settled, and a third wait on that txId joined it and never settled. Every finished wait also left an empty `listenersCache` key behind, one per txId. Each wait now removes its own listener when it settles. When the last listener leaves, `observe` drops the key and its `cleanupCache` entry and runs the cleanup, which removes the observer from the shared block watcher. A wait now joins another wait on the same txId only when both use the same `confirmations`, `pollingInterval`, `retryCount`, numeric `retryDelay` and `senderAddress` (a `retryDelay` function is not compared), so it no longer runs with the options of the wait it joined, such as resolving at 1 confirmation when it asked for 3.
  
  Make the `timeout` option of `waitForTransaction` end the wait. The timer only rejected the promise: it was never cleared and the block watcher kept polling, so a wait whose `getblockcount` never succeeded polled until the page or process ended. The timeout now rejects and removes only its own wait, so another wait on the same txId with a longer timeout or none keeps waiting, and the shared block watcher stops once no wait listens to it. Every way a wait settles clears its timer.

- [#82](https://github.com/lifinance/bigmi/pull/82) [`5b52eb3`](https://github.com/lifinance/bigmi/commit/5b52eb318b03f31758f7a021a69265a4774f8602) Thanks [@chybisov](https://github.com/chybisov)! - Stop `waitForTransaction` from reporting the awaited transaction as its own replacement. When `getrawtransaction` still reported the transaction unconfirmed but `getblock` already listed it, the replacement search matched the transaction itself, because it spends the same inputs, and called `onReplaced` with it. A replacement that `getrawtransaction` reported with no confirmations also resolved the wait at once, and a replacement that needed more confirmations resolved it in a later block without `onReplaced`. The search now skips the awaited txid, a replacement without confirmations keeps the wait polling, and `onReplaced` fires once, when the replacement has enough confirmations. It reports the awaited transaction as `replacedTransaction` and finds the reason against it, also when the replacement replaced an earlier replacement that left the chain.
  
  Settle `withRetry` when `shouldRetry` or the `delay` function throws. The throw rejected an internal attempt that nothing handled, so the returned promise stayed pending and the error surfaced only as an unhandled rejection. `withRetry` now rejects with that error. A `retryDelay` function of `waitForTransaction` that threw hung the wait in the same way; the wait now rejects with that error.
  
  Wait for every confirmation of a mined transaction in `waitForTransaction`. The `retryCount` block budget also counted the blocks after the transaction was mined, so a wait for more confirmations than the budget had left rejected with `WaitForTransactionReceiptTimeoutError` while the transaction was confirming: with the default `retryCount` of 10, a wait for 6 confirmations rejected if the transaction was mined 6 or more blocks after the wait started. The budget now counts only the blocks in which the transaction, or the replacement it tracks, is not mined or the height of its block is unknown. An unmined transaction still rejects on the same block as before.
  
  Evict the least recently used key from the internal `LruMap` that holds the in-flight requests of request deduplication. A key that was set again kept its old place, a read moved a key to the newest place only when its value was not `undefined`, an empty-string key was never evicted, and the eviction read the keys through the subclass, which viem reports can give a stale iterator on iOS 18 JavaScriptCore. A key that is set again or read now becomes the newest, the oldest key is evicted also when it is an empty string, and the eviction reads the keys of the base `Map`. This matters only when more than 8192 deduplicated requests are in flight at once.

## 0.9.2

### Patch Changes

- [#77](https://github.com/lifinance/bigmi/pull/77) [`381ec46`](https://github.com/lifinance/bigmi/commit/381ec46972111fa5614fff24127b34cce730dc0b) Thanks [@chybisov](https://github.com/chybisov)! - Report a declined confirmation as `UserRejectedRequestError` even when the wallet sends no rejection code. MetaMask's Bitcoin confirmation throws with no `code` at all and a generic `-32603` underneath, so it previously surfaced as `Unknown Error` and consumers could not tell a cancellation from a failure. Also recognise EIP-1193 `4001`, which the switch did not cover.

## 0.9.1

### Patch Changes

- [#75](https://github.com/lifinance/bigmi/pull/75) [`c9f3cd2`](https://github.com/lifinance/bigmi/commit/c9f3cd28fb5010277744c09857a4f4e1eaac6551) Thanks [@chybisov](https://github.com/chybisov)! - Bump runtime dependencies: `bitcoinjs-lib` 7.0.1 → 7.0.2 and `zustand` 5.0.14 → 5.0.15.
  
  `@noble/hashes` stays on `^1.8.0` on purpose. `bitcoinjs-lib@7.0.2` and `bs58check@4.0.0`
  both declare `@noble/hashes: ^1.2.0`, so moving `@bigmi/core` to v2 would put two copies of
  the library in every consumer's tree. v2 is also ESM-only and drops the `./sha256`,
  `./sha1` and `./ripemd160` subpaths that `bitcoinjs-lib` imports, so an `overrides` pin to
  v2 would break it at runtime. Revisit once `bitcoinjs-lib` widens its range.

## 0.9.0

### Minor Changes

- [#62](https://github.com/lifinance/bigmi/pull/62) [`3569fc2`](https://github.com/lifinance/bigmi/commit/3569fc295a7877daf5b47989edecde85b2c38ea8) Thanks [@chybisov](https://github.com/chybisov)! - chore: migrate the toolchain to TypeScript 7

  Bump the `typescript` devDependency from `6.x` to `7.x` (the native compiler) across the workspace, and bump `tsdown` `0.22.3` → `0.22.7` so its peer range accepts `typescript@^7`.

  This is a build-time-only change with **no integration impact**: `typescript` is a devDependency (never a peer/runtime dependency), so consumers' own TypeScript version is untouched, and `.d.ts`/`.js` emit is handled by tsdown (Rolldown + OXC isolated declarations), not `tsc`. `tsc --noEmit` type-checks cleanly on TS 7 with zero source changes, and the public type surface is semantically identical (a rebuild only reformats declaration whitespace/comments via the newer `rolldown-plugin-dts` printer). Safe to ship as a minor.

## 0.8.1

### Patch Changes

- [#55](https://github.com/lifinance/bigmi/pull/55) [`767fb0c`](https://github.com/lifinance/bigmi/commit/767fb0cba233decea140daf1b562c104f027a261) Thanks [@chybisov](https://github.com/chybisov)! - Update the `zustand` runtime dependency to `^5.0.14`.
