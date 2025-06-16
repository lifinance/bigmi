# Hooks

## `useConfig`

Hook to access the Bigmi configuration.

```typescript
import { useConfig } from '@bigmi/react'

function Component() {
  const config = useConfig()
  // Use config...
}
```

#### Returns

The current Bigmi configuration.

## `useAccount`

Hook to access the connected account information.

```typescript
import { useAccount } from '@bigmi/react'

function Component() {
  const { address, isConnected, connect, disconnect } = useAccount()
  
  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

#### Returns

- `address`: The connected Bitcoin address
- `isConnected`: Whether a wallet is connected
- `connect`: Function to connect to a wallet
- `disconnect`: Function to disconnect the wallet

## `useConnectors`

Hook to access available wallet connectors.

```typescript
import { useConnectors } from '@bigmi/react'

function Component() {
  const { connectors } = useConnectors()
  
  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connector.connect()}
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}
```

#### Returns

- `connectors`: Array of available wallet connectors

## `useConnect`

## `useReconnect`

## `useSyncExternalStoreWithTracked`
