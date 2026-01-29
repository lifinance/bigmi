---
description: "Patterns for creating custom error classes"
globs: ["**/errors/*.ts"]
---

## Error Class Pattern

All custom errors must extend `BaseError` from `@bigmi/core`.

### Basic Error Structure

```typescript
import { BaseError } from '@bigmi/core'

export class CustomError extends BaseError {
  override name = 'CustomError'
  
  constructor() {
    super('Short error message.')
  }
}
```

### Error with Type Export

Always export a corresponding type alias:

```typescript
export type CustomErrorType = CustomError & {
  name: 'CustomError'
}

export class CustomError extends BaseError {
  override name = 'CustomError'
  constructor() {
    super('Error message.')
  }
}
```

### Error with Parameters

For errors that need context, accept parameters in constructor:

```typescript
export class ConnectorChainMismatchError extends BaseError {
  override name = 'ConnectorChainMismatchError'
  
  constructor({
    connectionChainId,
    connectorChainId,
  }: {
    connectionChainId: ChainId
    connectorChainId: ChainId
  }) {
    super(
      `The current chain of the connector (id: ${connectorChainId}) does not match the connection's chain (id: ${connectionChainId}).`,
      {
        metaMessages: [
          `Current Chain ID:  ${connectorChainId}`,
          `Expected Chain ID: ${connectionChainId}`,
        ],
      }
    )
  }
}
```

### Error with Code

For RPC-style errors, include a numeric code:

```typescript
export class ProviderNotFoundError extends BaseError {
  code: number
  message: string
  name = 'ProviderNotFoundError'
  
  constructor() {
    super('Provider not found.')
    this.message = 'Provider not found'
    this.code = 243
  }
}
```

### Using metaMessages

Use `metaMessages` for additional debugging context:

```typescript
super(`Chain ID detection failed for connector "${connector}".`, {
  metaMessages: [
    'The connector needs at least one account to analyze the address format.',
    'Please ensure the wallet is connected and has accounts available.',
    'Try reconnecting the wallet or checking if the extension is installed.',
  ],
})
```
