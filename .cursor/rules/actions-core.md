---
description: "Patterns for creating core actions (blockchain data & RPC)"
globs: ["**/core/src/actions/*.ts"]
---

## Core Actions Overview

Core actions interact with blockchain data via RPC. They work with `Client` and make requests through transports.

| Category | Pattern | Examples |
|----------|---------|----------|
| **Async actions** | `async function` | `getBalance`, `getUTXOs`
| **Watch actions** | `function` returning unsubscribe | `watchBlockNumber` |

---

## 1. Async Actions

For fetching or sending blockchain data:

### Type Exports

Export Parameters and ReturnType:

```typescript
export type GetBalanceParameters = {
  /** The address of the account. */
  address: string
}

export type GetBalanceReturnType = bigint
```

### Function Signature

Client is always the first parameter with typed schema:

```typescript
export async function getBalance<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  params: GetBalanceParameters
): Promise<GetBalanceReturnType> {
  const data = await client.request(
    {
      method: 'getBalance',
      params,
    },
    { dedupe: true }
  )
  return data
}
```

### Key Patterns

**Client request with deduplication:**

```typescript
const data = await client.request(
  {
    method: 'methodName',
    params,
  },
  { dedupe: true }  // Prevent duplicate concurrent requests
)
```

**Typed RPC schema:**

```typescript
// Use the appropriate schema type for the action
Client<Transport, C, A, UTXOSchema>      // For UTXO operations
Client<Transport, C, A, UTXOWalletSchema> // For wallet operations
```

---

## 2. Watch Actions

For polling blockchain state:

### Type Exports

```typescript
export type OnBlockNumberFn = (
  blockNumber: OnBlockNumberParameter,
  prevBlockNumber: OnBlockNumberParameter | undefined
) => Promise<void>

export type WatchBlockNumberParameters = {
  /** The callback to call when a new block number is received. */
  onBlockNumber: OnBlockNumberFn
  /** The callback to call when an error occurred. */
  onError?: ((error: Error) => void) | undefined
  /** Whether or not to emit the latest value when the subscription opens. */
  emitOnBegin?: boolean | undefined
  /** Polling frequency (in ms). Defaults to Client's pollingInterval config. */
  pollingInterval?: number | undefined
}

export type WatchBlockNumberReturnType = () => void
```

### Function Pattern

Use `observe` and `poll` utilities:

```typescript
export function watchBlockNumber<
  chain extends Chain | undefined,
  transport extends Transport,
>(
  client: Client<transport, chain>,
  {
    emitOnBegin = false,
    onBlockNumber,
    onError,
    pollingInterval = client.pollingInterval,
  }: WatchBlockNumberParameters
): WatchBlockNumberReturnType {
  let prevValue: ReturnType | undefined

  const observerId = stringify([
    'watchBlockNumber',
    client.uid,
    pollingInterval,
  ])

  return observe(observerId, { onBlockNumber, onError }, (emit) =>
    poll(
      async () => {
        try {
          const value = await getAction(client, getBlockCount, 'getBlockCount')({
            cacheTime: 0,
          })

          if (!prevValue || value !== prevValue) {
            await emit.onBlockNumber(value, prevValue)
            prevValue = value
          }
        } catch (err) {
          emit.onError?.(err as Error)
        }
      },
      {
        emitOnBegin,
        interval: pollingInterval,
      }
    )
  )
}
```

---

## Common Requirements

### Client First

Client is always the first parameter:

```typescript
// ✅ Correct
export async function getBalance(client: Client, params: GetBalanceParameters)

// ❌ Wrong
export async function getBalance(params: { client: Client, address: string })
```

### Generic Type Parameters

Use standard generic parameter order:

```typescript
export async function actionName<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, Schema>,
  params: Parameters
): Promise<ReturnType>
```

### JSDoc Comments

Document parameters and return types:

```typescript
/**
 * Returns the balance for an address.
 * @param client - Client to use
 * @param params - {@link GetBalanceParameters}
 * @returns The balance in satoshis. {@link GetBalanceReturnType}
 */
export async function getBalance(...)
```

### Use getAction for Internal Calls

When calling other actions internally, use `getAction`:

```typescript
import { getAction } from '../utils/getAction.js'

const blockNumber = await getAction(
  client,
  getBlockCount,
  'getBlockCount'
)({ cacheTime: 0 })
```
