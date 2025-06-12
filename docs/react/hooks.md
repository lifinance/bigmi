## Hooks

### `useConfig`

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

### `useAccount`

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

### `useBalance`

Hook to track the balance of a Bitcoin address.

```typescript
import { useBalance } from '@bigmi/react'

function Component({ address }: { address: string }) {
  const { balance, isLoading, error } = useBalance({ address })
  
  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  return <p>Balance: {balance} BTC</p>
}
```

#### Parameters

- `address`: The Bitcoin address to track

#### Returns

- `balance`: The current balance
- `isLoading`: Whether the balance is being loaded
- `error`: Any error that occurred

### `useTransaction`

Hook to track a transaction's status.

```typescript
import { useTransaction } from '@bigmi/react'

function Component({ txId }: { txId: string }) {
  const { status, confirmations, error } = useTransaction({ txId })
  
  return (
    <div>
      <p>Status: {status}</p>
      <p>Confirmations: {confirmations}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

#### Parameters

- `txId`: The transaction ID to track

#### Returns

- `status`: The current transaction status
- `confirmations`: Number of confirmations
- `error`: Any error that occurred

### `useConnectors`

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

## Components

### `ConnectButton`

A pre-styled button component for connecting wallets.

```typescript
import { ConnectButton } from '@bigmi/react'

function Component() {
  return <ConnectButton />
}
```

#### Props

- `className?`: Additional CSS classes
- `style?`: Additional styles
- `onClick?`: Click handler

### `DisconnectButton`

A pre-styled button component for disconnecting wallets.

```typescript
import { DisconnectButton } from '@bigmi/react'

function Component() {
  return <DisconnectButton />
}
```

#### Props

- `className?`: Additional CSS classes
- `style?`: Additional styles
- `onClick?`: Click handler

## Best Practices

1. **Error Handling**
   - Always handle loading and error states
   - Provide meaningful error messages
   - Implement fallback UI

2. **Performance**
   - Use appropriate polling intervals
   - Implement proper cleanup
   - Avoid unnecessary re-renders

3. **User Experience**
   - Show loading states
   - Provide feedback for actions
   - Handle edge cases gracefully

## Examples

### Basic Wallet Integration

```typescript
import { useAccount, useBalance } from '@bigmi/react'

function WalletComponent() {
  const { address, isConnected } = useAccount()
  const { balance, isLoading } = useBalance({ address })
  
  if (!isConnected) return <p>Please connect your wallet</p>
  if (isLoading) return <p>Loading balance...</p>
  
  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance} BTC</p>
    </div>
  )
}
```

### Transaction Tracking

```typescript
import { useTransaction } from '@bigmi/react'

function TransactionComponent({ txId }: { txId: string }) {
  const { status, confirmations, error } = useTransaction({ txId })
  
  return (
    <div>
      <h3>Transaction Status</h3>
      <p>Status: {status}</p>
      <p>Confirmations: {confirmations}</p>
      {error && <p className="error">{error.message}</p>}
    </div>
  )
}
```