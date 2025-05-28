<div align="center">

<h1 align="center">Bigmi</h1>
<p align="center"><strong>TypeScript library and reactive primitives for Bitcoin apps.</strong></p>

[![license](https://img.shields.io/github/license/lifinance/bigmi)](/LICENSE.md)
[![npm latest package](https://img.shields.io/npm/v/@bigmi/core/latest.svg)](https://www.npmjs.com/package/@bigmi/core)
[![npm downloads](https://img.shields.io/npm/dm/@bigmi/core.svg)](https://www.npmjs.com/package/@bigmi/core)

</div>

**Bigmi** (short for *Bitcoin Is Gonna Make It*) is a TypeScript library that provides reactive primitives for building Bitcoin applications. Bigmi simplifies Bitcoin app development by offering:

- Abstractions over the [Bitcoin JSON-RPC API](https://developer.bitcoin.org/reference/rpc/)
- First-class APIs for interacting with the [Bitcoin](https://bitcoin.design/) network, including sending transactions and tracking with [Replace-By-Fee (RBF)](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki) support
- Connectors for popular Bitcoin wallet extensions
- TypeScript support
  
Whether you're building a Node.js application or a client-side app, Bigmi provides the tools you need to interact with the Bitcoin.

### Packages

Bigmi is modularized into several packages, each suited to different use cases:

- [@bigmi/core](https://www.npmjs.com/package/@bigmi/core) - Actions, transports, utilities, and other core primitives for Node.js or client-side applications.
- [@bigmi/react](https://www.npmjs.com/package/@bigmi/react) - Hooks, providers, and other useful primitives for React applications.
- [@bigmi/client](https://www.npmjs.com/package/@bigmi/client) - Wallet connectors and other tools to connect wallet extensions with Bitcoin applications.

## Installation

```sh
pnpm add @bigmi/react
```
```sh
pnpm add @bigmi/core
```
```sh
pnpm add @bigmi/client
```

## Getting Started

Here is an example of a basic usage:

```tsx
import { useConfig } from '@bigmi/react'
import {
  type UTXOSchema,
  bitcoin,
  getBalance,
  getBlockCount,
  sendUTXOTransaction,
  waitForTransaction,
  createClient, 
  fallback, 
  rpcSchema
  ankr,
  blockchair,
  blockcypher,
  mempool
} from '@bigmi/core'
import { useAccount } from '@bigmi/react'


// Create a public client for interactions with the Bitcoin
const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: fallback([
    blockchair(),
    ankr({apiKey: 'YOUR_ANKR_API_KEY'}),
    blockcypher(),
    mempool(),
  ]),
})

// Define the Bitcoin address you're working with
const address = 'BITCOIN_ADDRESS';

// Fetch the balance of the address
const balance = await getBalance(publicClient, { address });
console.log(`Balance for ${address}:`, balance);

// Fetch the current block count (height)
const blockCount = await getBlockCount(publicClient);
console.log('Current block count:', blockCount);

// Prepare the transaction hex (as a string)
const txHex = 'TRANSACTION_HEX';

// Send the transaction to the network
const txId = await sendUTXOTransaction(publicClient, { hex: txHex });
console.log('Transaction sent with ID:', txId);

// Wait for the transaction to be confirmed
const transaction = await waitForTransaction(publicClient, {
  txId,
  txHex,
  senderAddress: address,
  onReplaced: (response) => {
    console.log('Transaction replaced due to:', response.reason);
  },
});

console.log('Transaction confirmed:', transaction);

// Getting account information inside the React application
const bigmiConfig = useConfig()
const account = useAccount()

console.log('Bitcoin account address:', account.address);
```

## Examples

We are working on more examples to showcase Bigmi's capabilities. Stay tuned!

In the meantime, explore the [LI.FI Widget](https://github.com/lifinance/widget) and [LI.FI SDK](https://github.com/lifinance/sdk) for inspiration.

## Documentation

Detailed documentation is coming soon. For now, refer to the source code and type definitions for guidance.

## Support

If you encounter any issues or have questions, please open an issue.

## Contributing

We welcome contributions from the community!

## Changelog

The [changelog](/CHANGELOG.md) is regularly updated to reflect what's changed in each new release.

## License

This project is licensed under the terms of the [MIT License](/LICENSE.md).

## Acknowledgments

Bigmi is inspired by the [wevm](https://github.com/wevm) stack. We appreciate the open-source community's contributions to advancing blockchain development.
