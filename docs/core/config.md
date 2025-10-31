# Configuration

This guide covers all configuration options available in Bigmi. Learn how to set up your client, choose the right transport, and configure your application for different environments.

## Client Configuration

The client is the core of Bigmi. Here's how to configure it:

```typescript
import { createClient, bitcoin, blockchair, ankr } from '@bigmi/core'

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

## Transport Configuration

Bigmi supports multiple transport layers. It is recommended to use the fallback transport that wraps many transports for better reliability.

Most https transports are free to use with API limits, they can be configured with an `apiKey` and `baseUrl` for production ready use cases.

### Base Transports

#### `http`

This option

#### `utxo`

This is a transport that extends the http transport but is customized to consume common bitcoin http APIs:

There are four included transports that extend the `utxo` base transport

  1. blockchair
  2. ankr
  3. blockcypher
  4. mempool
  
##### Usage

```typescript
import { blockchair, ankr, blockcypher, mempool } from '@bigmi/core'

const clientWithBlockChair = createClient({
  chain: bitcoin,
  transport: blockchair(),
})

```

### Fallback Transport (recommended)

This transport takes an array of transports, and falls back to another if any of them fails.

```typescript

import { createClient, bitcoin, blockchair, ankr, fallback } from '@bigmi/core'

const client = createClient({
  chain: bitcoin,
  transport: fallback([
    blockchair(),
    ankr({apiKey: 'YOUR_ANKR_API_KEY'}),
    mempool()
  ]),
})

```

## Chain Configuration

We only have a chain definition for bitcoin mainnet, custom chains can be created using the `defineChain` util.

```typescript
import { defineChain, ChainId } from '@bigmi/core'

const testnet4 = defineChain({
  id: ChainId.BITCOIN_TESTNET4,
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
