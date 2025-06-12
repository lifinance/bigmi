## Error Handling

### Basic Error Handling
```typescript
try {
  await client.request({ method: 'getBalance', params: [address] })
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message)
  } else if (error instanceof TransactionError) {
    console.error('Transaction error:', error.message)
  }
}
```

### Custom Error Handler
```typescript
const client = createClient({
  chain: bitcoin,
  transport: blockchair(),
  onError: (error) => {
    // Custom error handling
    console.error('Client error:', error)
  },
})
```

## Error Types

### `BaseError`

Base error class for all Bigmi errors.

```typescript
class BaseError extends Error {
  code?: number
  details: string
  docsPath?: string
  metaMessages?: string[]
  shortMessage: string
  version: string
}
```

### `NetworkError`

Error thrown when network requests fail.

```typescript
class NetworkError extends BaseError {
  name: 'NetworkError'
}
```

### `TransactionError`

Error thrown when transaction operations fail.

```typescript
class TransactionError extends BaseError {
  name: 'TransactionError'
}
```