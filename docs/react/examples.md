# Examples

Here are examples on how to use the `@bigmi/react` library in your project.

## Wallet Connection

### Basic Connection

```typescript
import { useAccount } from '@bigmi/react'

function WalletConnect() {
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

### Multiple Wallets

```typescript
import { useConnectors } from '@bigmi/react'

function WalletSelector() {
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
