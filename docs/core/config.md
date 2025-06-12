# Configuration

This guide covers all configuration options available in Bigmi. Learn how to set up your client, choose the right transport, and configure your application for different environments.

## Client Configuration

The client is the core of Bigmi. Here's how to configure it:

```typescript
import { createClient, bitcoin } from '@bigmi/core'
import { blockchair } from '@bigmi/core'

const client = createClient({
  chain: bitcoin,
  transport: fallback([
    blockchair(),
    ankr({apiKey: 'YOUR_ANKR_API_KEY'})
  ]),
  // Additional options
})
```

### Available Options

- `chain`: The Bitcoin chain configuration (mainnet/testnet)
- `transport`: The transport layer to use
- `pollingInterval`: How often to poll for updates
- `batchSize`: Number of requests to batch together
- `timeout`: Request timeout in milliseconds

## Transport Options

Bigmi supports multiple transport layers. It is recommended to use the fallback transport that wraps many transports for better reliability. 

Most https transports are free to use with API limits, they can be configured with an `apiKey` and `baseUrl` for production ready use cases.

### Blockchair (Recommended for Production)
```typescript
import { blockchair } from '@bigmi/core'

const transport = blockchair({
  apiKey: process.env.BLOCKCHAIR_API_KEY,
  timeout: 30000,
})
```

### Ankr
```typescript
import { ankr } from '@bigmi/core'

const transport = ankr({
  apiKey: YOUR_ANKR_API_KEY,
})
```

### Blockcypher
```typescript
import { blockcypher } from '@bigmi/core'

const transport = blockcypher({
  apiKey: YOUR_BLOCKCYPHER_API_KEY,
})
```

### Mempool
```typescript
import { mempool } from '@bigmi/core'

const transport = mempool({
    baseUrl: YOUR_MEMPOOL_SUBDOMAIN_URL
})
```

## Chain Configuration

We only have a chain definition for bitcoin mainnet, custom chains can be created using the `defineChain` util.

```typescript
import { defineChain } from '@bigmi/core'

const testnet4 = defineChain({
  id: 20000000000004,
  name: 'Bitcoin Testnet4',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: {
    default: {
      http: ['https://bitcoin-testnet-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mempool',
      url: 'https://mempool.space/testnet4/',
    },
  },
  testnet: true
})
```


[⬅️ back](./index.md)