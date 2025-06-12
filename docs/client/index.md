# Client API Reference

This document provides a comprehensive reference for the `@bigmi/client` package, which contains wallet connectors and client-side utilities for Bitcoin applications.

## Wallet Connectors



Connector for Mempool wallet.

```typescript
import { mempool } from '@bigmi/client'

const connector = mempool()
```

## Connection Methods



```typescript
await connector.disconnect()
```

### `switchChain`

Switch to a different chain.

```typescript
await connector.switchChain(chainId)
```

#### Parameters

- `chainId`: The ID of the chain to switch to

## Event Handlers

### `onConnect`

Handler for wallet connection events.

```typescript
connector.onConnect(({ address }) => {
  console.log('Connected:', address)
})
```

### `onDisconnect`

Handler for wallet disconnection events.

```typescript
connector.onDisconnect(() => {
  console.log('Disconnected')
})
```

### `onChainChanged`

Handler for chain change events.

```typescript
connector.onChainChanged((chainId) => {
  console.log('Chain changed:', chainId)
})
```

## State Management

### `getAccount`

Get the current account information.

```typescript
const account = await connector.getAccount()
```

#### Returns

- `address`: The current Bitcoin address
- `chainId`: The current chain ID

### `getChainId`

Get the current chain ID.

```typescript
const chainId = await connector.getChainId()
```

#### Returns

The current chain ID.

### `getProvider`

Get the wallet provider.

```typescript
const provider = await connector.getProvider()
```

#### Returns

The wallet provider instance.

## Error Handling

### `ConnectorError`

Error thrown by wallet connectors.

```typescript
class ConnectorError extends Error {
  code: string
  message: string
  data?: unknown
}
```

### `UserRejectedError`

Error thrown when user rejects a request.

```typescript
class UserRejectedError extends ConnectorError {
  code: 'USER_REJECTED'
}
```

### `ChainNotConfiguredError`

Error thrown when chain is not configured.

```typescript
class ChainNotConfiguredError extends ConnectorError {
  code: 'CHAIN_NOT_CONFIGURED'
}
```

## Type Definitions

### `Connector`

The main connector type.


### `ConnectorConfig`

Configuration type for connectors.



## Examples

### Basic Wallet Integration



### Event Handling



## Next Steps

- Learn about the [Core API](../core.md)
- Explore the [React API](../react.md)
- Check out the [Type Definitions](../types.md) 