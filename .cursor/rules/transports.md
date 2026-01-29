---
description: "Patterns for creating transport method handlers (provider-specific RPC implementations)"
globs: ["**/transports/**/*.ts"]
---

## Transport Method Handlers Overview

Transport method handlers are provider-specific implementations of RPC methods. Each transport (blockcypher, mempool, ankr, etc.) implements handlers that transform provider responses to standard formats.

---

## File Structure

Each transport provider has this structure:

```
transports/
├── [provider]/
│   ├── [provider].ts         # Transport factory
│   ├── [provider].types.ts   # Provider-specific types
│   ├── methods.ts            # Exports all method handlers
│   ├── getBalance.ts         # Method handler
│   ├── getUTXOs.ts           # Method handler
│   └── ...
```

---

## Method Handler Pattern

### Type Signature

All handlers use the `RpcMethodHandler` type:

```typescript
import type { RpcMethodHandler } from '../types.js'

export const getBalance: RpcMethodHandler<'getBalance'> = async (
  client,
  { baseUrl, apiKey },
  { address }
) => {
  // Implementation
}
```

### Parameters

1. `client: HttpRpcClient` - HTTP client for making requests
2. `config: { baseUrl: string; apiKey?: string }` - Provider configuration
3. `params` - Method-specific parameters (typed from schema)

### Return Type

Always return `RpcResponse` with `result` property:

```typescript
return {
  result: transformedData,
}
```

---

## Implementation Pattern

### Basic Method Handler

```typescript
import type { RpcMethodHandler } from '../types.js'
import type { ProviderBalanceResponse } from './provider.types.js'

export const getBalance: RpcMethodHandler<'getBalance'> = async (
  client,
  { baseUrl, apiKey },
  { address }
) => {
  // 1. Build API URL
  const apiUrl = `${baseUrl}/address/${address}`
  
  // 2. Make request
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as ProviderBalanceResponse
  
  // 3. Transform to standard format
  const balance = response.chain_stats.funded_txo_sum - response.chain_stats.spent_txo_sum
  
  // 4. Return with result wrapper
  return {
    result: BigInt(balance),
  }
}
```

### Handler with Error Handling

```typescript
import { RpcRequestError } from '../../errors/request.js'
import { InsufficientUTXOBalanceError } from '../../errors/utxo.js'

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl, apiKey },
  { address, minValue }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/addrs/${address}`, {
    token: apiKey,
    unspentOnly: 'true',
  })
  
  const response = await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  }) as ProviderResponse
  
  // Handle provider errors
  if (response.error) {
    throw new RpcRequestError({
      url: apiUrl,
      body: { method: 'getUTXOs', params: { address, minValue } },
      error: {
        code: getRpcErrorCode(response.error),
        message: response.error,
      },
    })
  }
  
  // Handle business logic errors
  if (minValue && minValue > response.balance) {
    throw new InsufficientUTXOBalanceError({
      minValue,
      address,
      balance: response.balance,
    })
  }
  
  return { result: transformedUtxos }
}
```

### Handler with Pagination

For APIs that return paginated results:

```typescript
export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  config,
  params
) => {
  // Use async generator for pagination
  async function* fetchPages() {
    let hasMore = true
    let cursor: string | undefined
    
    while (hasMore) {
      const response = await client.request({ ... })
      hasMore = response.hasMore
      cursor = response.nextCursor
      yield response.items
    }
  }
  
  const allItems: Item[] = []
  for await (const batch of fetchPages()) {
    allItems.push(...batch.map(transformer))
  }
  
  return { result: allItems }
}
```

---

## Methods Registry

Export all handlers in `methods.ts`:

```typescript
import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransactionFee } from './getTransactionFee.js'
import { getUTXOs } from './getUTXOs.js'

export const providerMethods: RpcMethods = {
  getBalance,
  getUTXOs,
  getTransactionFee,
}
```

---

## Provider Types

Define provider-specific response types in `[provider].types.ts`:

```typescript
export interface ProviderBalanceResponse {
  address: string
  chain_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
  }
}

export interface ProviderUTXO {
  tx_hash: string
  tx_output_n: number
  value: number
  confirmations: number
  // ... provider-specific fields
}
```

---

## Data Transformation

Always transform provider data to standard types:

```typescript
import type { UTXO } from '../../types/transaction.js'

// Transformer function for provider UTXO → standard UTXO
const providerUtxoTransformer = (utxo: ProviderUTXO): UTXO => ({
  txId: utxo.tx_hash,
  vout: utxo.tx_output_n,
  value: utxo.value,
  confirmations: utxo.confirmations,
  isConfirmed: utxo.confirmations > 0,
  blockHeight: utxo.block_height,
  scriptHex: utxo.script,
})
```

---

## URL Helpers

Use `urlWithParams` for building URLs with query parameters:

```typescript
import { urlWithParams } from '../../utils/url.js'

const apiUrl = urlWithParams(`${baseUrl}/endpoint`, {
  token: apiKey,
  limit: 100,
  includeDetails: 'true',
})
```
