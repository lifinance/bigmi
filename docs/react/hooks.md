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
import { useAccount, useConnect } from '@bigmi/react'

function Component() {
  // Property 'address' does not exist on type 'UseAccountReturnType<Config>'.ts(2339)
  const { account , isConnected, connector: activeWallet } = useAccount()
  const { connect, connectors } = useConnect()
  
  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {account.address}</p>
          <button onClick={() => activeWallet.disconnect()}>Disconnect</button>
        </>
      ) : (
        <button onClick={() => connect({connector: connectors[0]})}>Connect Wallet</button>
      )}
    </div>
  )
}
```

#### Returns

- `address`: The connected Bitcoin address
- `isConnected`: Whether a wallet is connected

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

Hook to create a connection between a client and a connector, authorizing the client to send requests to a wallet via the connector.

#### Returns

- `connect()`: A function to run the connect logic synchronously
- `connectAsync()`: A async connect function
- `connectors`: Array of available wallet connectors

## `useReconnect`

This hook reconnects to a wallet connector if a connection already exists or the client is already authorized to use the connector.
