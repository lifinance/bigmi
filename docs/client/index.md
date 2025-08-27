# @bigmi/client

The `@bigmi/client` package provides wallet connectors and tools to integrate Bitcoin wallet extensions with your web applications. This package is essential for building Bitcoin applications that need to interact with various wallet providers.

## Quick Start

```typescript
import { bitcoin, http, createClient } from '@bigmi/core'
import { binance, xverse, phantom, createConfig } from '@bigmi/client'

// Create wallet connectors
const connectors = [
  binance(),
  xverse(),
  phantom()
]

// Create configuration
const config = createConfig({
  chains: [bitcoin],
  connectors,
  client: ({ chain }) => createClient({ chain, transport: http() }),
  ssr: true // if using Next.js or SSR
})

// Connect to a wallet
const { accounts, chainId } =  await connect(config)

// Get client and use it
const client = config.getClient()

// Sign a PSBT (Partially Signed Bitcoin Transaction)
// Requires a PSBT and account
const signedPsbt = await client.signPsbt({
  psbt: 'base64_encoded_psbt',
  account: accounts[0]
})

// Disconnect from the current wallet
await disconnect(config)
```

## Next steps

- [Understand connectors](./connectors.md)
- [View the core API](../core/index.md)
- [View the React package](../react/index.md)
