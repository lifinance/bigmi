---
'@bigmi/core': patch
---

Keep the shared block watcher alive when a `waitForTransaction` times out. When a wait reached its `retryCount` timeout and the same block callback then found the transaction confirmed or replaced, or failed to fetch the block, the wait settled a second time. That second pass ran the watcher's cleanup while another wait on the same client still listened, and could reject a newer wait on the same txId with a stale error, so those waits, and every later wait on the client, never settled. A wait now settles exactly once, and an observer's `unwatch` is a no-op once its own listener is gone.

Release the observers of a settled `waitForTransaction`. A wait that joined another wait on the same txId, such as a resumed run, stayed in the module-level `listenersCache` with its callbacks after both settled, and a third wait on that txId joined it and never settled. Every finished wait also left an empty `listenersCache` key behind, one per txId. The settling emit now removes every wait on its txId, and `observe` drops a key and its `cleanupCache` entry when the last listener leaves.

Make the `timeout` option of `waitForTransaction` end the wait. The timer only rejected the promise: it was never cleared and the block watcher kept polling, so a wait whose `getblockcount` never succeeded polled until the page or process ended. The timeout now stops the watcher and removes the wait, and every way a wait settles clears its timer. A wait that joined another wait on the same txId removes only itself when its own timeout expires; when the wait that drives the shared observer times out, every wait on that txId rejects with the timeout, as the `retryCount` timeout already does.
