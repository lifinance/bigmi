---
'@bigmi/client': patch
---

Stop `reconnect` from clearing a connection established by a concurrent `connect()` call. Reconnect runs on mount and polls for a wallet provider for up to 5s, so a user can connect manually while it is still in flight; the no-connector-reconnected reset now only applies when the store is still in the `reconnecting`/`connecting` state reconnect put it in. Matches wagmi's behavior.
