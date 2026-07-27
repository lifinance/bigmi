---
'@bigmi/client': patch
---

Fix `reconnect` leaving a stale connection stub after reload. On the first successful reconnection the connections map is now rebuilt from scratch instead of copying the map rehydrated from storage under the previous session's connector uid, and `current` points at the freshly reconnected connector. When no connector reconnects, `connections` and `current` are reset alongside `status: 'disconnected'`. Matches wagmi's behavior.
