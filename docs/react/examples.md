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

### Transaction Status Tracking
```typescript
import { useTransaction } from '@bigmi/react'

function TransactionStatus({ txId }: { txId: string }) {
  const { status, confirmations } = useTransaction({ txId })

  return (
    <div>
      <p>Status: {status}</p>
      <p>Confirmations: {confirmations}</p>
    </div>
  )
}
```

### Balance Updates
```typescript
import { useBalance } from '@bigmi/react'

function BalanceDisplay({ address }: { address: string }) {
  const { balance, isLoading } = useBalance({ address })

  if (isLoading) return <p>Loading...</p>
  return <p>Balance: {balance} BTC</p>
}
```

## Best Practices

1. **Always handle errors**
   - Use try-catch blocks
   - Handle specific error types
   - Provide user feedback

2. **Use React hooks when possible**
   - They handle state management
   - They provide automatic updates
   - They handle cleanup

3. **Implement proper loading states**
   - Show loading indicators
   - Handle edge cases
   - Provide feedback

4. **Use TypeScript**
   - Get type safety
   - Better IDE support
   - Catch errors early