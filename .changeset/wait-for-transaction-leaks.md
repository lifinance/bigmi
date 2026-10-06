---
'@bigmi/core': patch
---

Keep the shared block watcher alive when a `waitForTransaction` times out. When a wait reached its `retryCount` timeout and the same block callback then found the transaction confirmed or replaced, or failed to fetch the block, the wait settled a second time. That second pass ran the watcher's cleanup while another wait on the same client still listened, and could reject a newer wait on the same txId with a stale error, so those waits, and every later wait on the client, never settled. A wait now settles exactly once, and an observer's `unwatch` is a no-op once its own listener is gone.
