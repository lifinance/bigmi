---
description: "Testing patterns for transport method handlers"
globs: ["**/transports/**/*.spec.ts"]
---

## Testing Transport Method Handlers

Every transport must have a corresponding `[provider].spec.ts` test file.

### Test File Structure

```
transports/
├── [provider]/
│   ├── [provider].spec.ts      # Test file
│   └── __mocks__/
│       ├── getBalance/
│       │   ├── valid.json      # Successful response mock
│       │   └── invalid.json    # Error response mock
│       ├── getUTXOs/
│       │   ├── valid.json
│       │   ├── empty.json
│       │   └── paginated.json
│       └── ...
```

### Test Setup

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance.js'
import { getUTXOs } from '../../actions/getUTXOs.js'
import { bitcoin } from '../../chains/bitcoin.js'
import { createClient, rpcSchema } from '../../factories/createClient.js'
import { createMockResponse } from '../../test/utils.js'
import type { UTXOSchema } from '../types.js'
import { provider } from './provider.js'

// Import mock responses
import getBalanceValidResponse from './__mocks__/getBalance/valid.json'
import getBalanceInvalidResponse from './__mocks__/getBalance/invalid.json'

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: provider({ apiKey: 'test-key' }),
})

describe('Provider Transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  
  // Test suites...
})
```

---

## Test Patterns

**Success case:**

```typescript
it('should fetch correct balance', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(getBalanceValidResponse)
  )
  
  const balance = await getBalance(publicClient, { address })
  expect(balance).toBeTypeOf('bigint')
})
```

**Error case:**

```typescript
it('should throw an error for invalid address', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(getBalanceInvalidResponse)
  )

  await expect(
    getBalance(publicClient, { address: invalidAddress })
  ).rejects.toThrow()
})
```

**Custom error type:**

```typescript
import { InsufficientUTXOBalanceError } from '../../errors/utxo.js'

it('should throw error when minValue exceeds balance', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(getUTXOsValidResponse)
  )
  
  await expect(
    getUTXOs(publicClient, { address, minValue: 999999999999 })
  ).rejects.toThrow(InsufficientUTXOBalanceError)
})
```

**Empty result:**

```typescript
it('should handle empty UTXOs', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(getUTXOsEmptyResponse)
  )
  
  const utxos = await getUTXOs(publicClient, { address })
  expect(utxos.length).toBe(0)
})
```

**Pagination:**

```typescript
it('should handle pagination correctly', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(getUTXOsPaginatedResponse)
  )

  const utxos = await getUTXOs(publicClient, { address, minValue })
  
  expect(utxos.length).toBeGreaterThan(0)
  expect(new Set(utxos.map((u) => u.txId)).size).toBe(utxos.length) // No duplicates
  expect(global.fetch).toHaveBeenCalled()
})
```

**Response structure validation:**

```typescript
it('should return UTXOs with correct structure', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(getUTXOsValidResponse)
  )
  
  const utxos = await getUTXOs(publicClient, { address })
  
  expect(utxos.length).toBeGreaterThan(0)
  expect(utxos[0]).toMatchObject({
    blockHeight: expect.any(Number),
    scriptHex: expect.any(String),
    txId: expect.any(String),
    value: expect.any(Number),
    vout: expect.any(Number),
  })
})
```

---

## Required Test Cases

Each method handler should test:

1. **Success case** - Valid response returns expected data
2. **Error case** - Invalid input throws appropriate error
3. **Empty result** - Handles empty/no data gracefully
4. **Edge cases** - Pagination, rate limits, timeouts (if applicable)
5. **Response structure** - Output matches expected type shape

---

## Testing Fallback Transport

The fallback transport allows chaining multiple providers with automatic failover. Test it separately in `fallback.spec.ts`.

### Fallback Test Setup

```typescript
import { fallback } from './fallback.js'
import { blockcypher } from './blockcypher/blockcypher.js'
import { blockchair } from './blockchair/blockchair.js'
import { AllTransportsFailedError } from '../errors/transport.js'

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: fallback([
    blockcypher({ apiKey }),
    blockchair({ apiKey }),
  ]),
})
```

### Fallback Test Patterns

**Primary transport succeeds:**

```typescript
it('should use primary transport when it succeeds', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    createMockResponse(blockcypherValidResponse)
  )

  const utxos = await getUTXOs(publicClient, { address })
  expect(utxos.length).toBeGreaterThan(0)
})
```

**Fallback to secondary transport:**

```typescript
it('should fallback to secondary when primary fails', async () => {
  vi.spyOn(global, 'fetch').mockImplementation((request) => {
    const url = new URL(request.toString())
    
    // Primary transport fails (rate limited)
    if (url.hostname.includes('blockcypher')) {
      return Promise.resolve(
        createMockResponse(blockcypherLimitedResponse, { status: 429 })
      )
    }
    
    // Secondary transport succeeds
    return Promise.resolve(createMockResponse(blockchairValidResponse))
  })

  const utxos = await getUTXOs(publicClient, { address })
  expect(utxos.length).toBeGreaterThan(0)
})
```

**All transports fail:**

```typescript
it('should throw error when all transports fail', async () => {
  vi.spyOn(global, 'fetch').mockImplementation((request) => {
    const url = new URL(request.toString())
    
    if (url.hostname.includes('blockcypher')) {
      return Promise.resolve(
        createMockResponse(blockcypherLimitedResponse, { status: 429 })
      )
    }
    
    return Promise.resolve(
      createMockResponse(blockchairLimitedResponse, { status: 429 })
    )
  })

  await expect(getUTXOs(publicClient, { address })).rejects.toThrow(
    AllTransportsFailedError
  )
})
```

**Should NOT fallback on business errors:**

Some errors (like `InsufficientUTXOBalanceError`) should throw immediately without trying fallback:

```typescript
it('should not fallback on InsufficientUTXOBalanceError', async () => {
  const spy = vi.spyOn(global, 'fetch').mockImplementation((request) => {
    const url = new URL(request.toString())
    
    if (url.hostname.includes('blockcypher')) {
      return Promise.resolve(createMockResponse(blockcypherValidResponse))
    }
    
    return Promise.resolve(createMockResponse(blockchairValidResponse))
  })

  await expect(
    getUTXOs(publicClient, { address, minValue: 999999999999 })
  ).rejects.toThrow(InsufficientUTXOBalanceError)

  // Verify secondary transport was never called
  expect(spy).not.toHaveBeenCalledWith(
    expect.stringContaining('blockchair')
  )
})
```

---

## Fallback Required Test Cases

1. **Primary succeeds** - Uses first transport
2. **Fallback on failure** - Tries next transport when primary fails
3. **All fail** - Throws `AllTransportsFailedError` when all transports fail
4. **No fallback on business errors** - Certain errors should throw immediately
