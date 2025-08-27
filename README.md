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

### Node.js

How to setup Bigmi on the backend with Node.js:

```typescript
// main.ts
import {
  createClient,
  bitcoin,
  blockchair,
  sendUTXOTransaction,
  waitForTransaction,
  getBalance,
} from '@bigmi/core'

// Create a client for Bitcoin mainnet
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
 
```

### React

Simple bigmi setup with a react app:

```typescript
// App.tsx

import { bitcoin, http, createClient } from '@bigmi/core'
import { BigmiProvider, createConfig } from '@bigmi/react'
import { binance, xverse, phantom } from '@bigmi/client'

// Create bigmi config object
const config = createConfig({
    chains: [bitcoin],
    connectors: [binance(), xverse(), phantom()],
    client: ({ chain }) => createClient({ chain, transport: http() }),
    ssr: true // If using Next.js or SSR
})


function App() {
  return (
    // Wrap your application with the necessary providers:
    <BigmiProvider config={config}>
      <YourApp />
    </BigmiProvider>
  )
}
```

```typescript
// YourApp.tsx

// Import the hooks from bigmi/react library
import { useAccount, useBalance, useConnect } from '@bigmi/react'

const { address, isConnected } = useAccount()
const { balance } = useBalance()
const { connect } = useConnect()

function YourApp() {
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}: {balance}BTC</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

## Creating Bitcoin Transactions

While Bigmi excels at blockchain data retrieval and transaction broadcasting, it doesn't include transaction creation functions. For generating valid transaction hex, we recommend using **bitcoinjs-lib** (which Bigmi already depends on).

### Basic Transaction Creation

Here's how to create a Bitcoin transaction using bitcoinjs-lib with Bigmi:

```typescript
import * as bitcoin from 'bitcoinjs-lib';
import { 
  createClient, 
  getUTXOs, 
  sendUTXOTransaction, 
  waitForTransaction,
  getBlockStats,
  getBlockCount
} from '@bigmi/core';

async function createAndSendTransaction(
  client: Client,
  fromAddress: string,
  toAddress: string,
  amount: number, // in satoshis
  privateKey: Buffer
) {
  // 1. Get UTXOs for the address using Bigmi
  const utxos = await getUTXOs(client, { address: fromAddress });
  
  // 2. Create a new transaction using bitcoinjs-lib
  const psbt = new bitcoin.Psbt();
  
  // 3. Add inputs from UTXOs
  let inputValue = 0;
  const estimatedFee = 1000; // You should calculate this properly
  
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txId,
      index: utxo.vout,
      witnessUtxo: {
        script: Buffer.from(utxo.scriptHex, 'hex'),
        value: utxo.value,
      },
    });
    inputValue += utxo.value;
    if (inputValue >= amount + estimatedFee) break;
  }
  
  // 4. Add recipient output
  psbt.addOutput({
    address: toAddress,
    value: amount,
  });
  
  // 5. Add change output if needed
  const change = inputValue - amount - estimatedFee;
  if (change > 546) { // Dust threshold
    psbt.addOutput({
      address: fromAddress,
      value: change,
    });
  }
  
  // 6. Sign the transaction
  const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey);
  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();
  
  // 7. Get the raw transaction hex
  const rawTx = psbt.extractTransaction().toHex();
  
  // 8. Broadcast using Bigmi
  const txId = await sendUTXOTransaction(client, { hex: rawTx });
  
  // 9. Wait for confirmation using Bigmi
  const confirmedTx = await waitForTransaction(client, {
    txId,
    txHex: rawTx,
    senderAddress: fromAddress,
    confirmations: 1,
  });
  
  return confirmedTx;
}
```

### Fee Estimation

Proper fee estimation is crucial for transaction confirmation:

```typescript
async function estimateFee(
  client: Client,
  numInputs: number,
  numOutputs: number
): Promise<number> {
  // Get recent block stats for fee estimation
  const blockHeight = await getBlockCount(client);
  const blockStats = await getBlockStats(client, {
    blockNumber: blockHeight,
    stats: ['avgfeerate']
  });
  
  // Estimate transaction size
  // P2WPKH: ~68 bytes per input, ~31 bytes per output, ~10 bytes overhead
  const estimatedSize = (numInputs * 68) + (numOutputs * 31) + 10;
  
  // Calculate fee (satoshis per byte * size)
  const feeRate = blockStats.avgfeerate || 1; // fallback to 1 sat/byte
  return Math.ceil(feeRate * estimatedSize);
}
```

### Complete Example with Error Handling

```typescript
import * as bitcoin from 'bitcoinjs-lib';
import { createClient, getBalance, getUTXOs, sendUTXOTransaction, waitForTransaction } from '@bigmi/core';

async function safeSendBitcoin(
  client: Client,
  fromAddress: string,
  toAddress: string,
  amount: number,
  privateKey: Buffer
) {
  try {
    // Check balance
    const balance = await getBalance(client, { address: fromAddress });
    if (balance < amount + 1000) {
      throw new Error('Insufficient balance');
    }
    
    // Get UTXOs
    const utxos = await getUTXOs(client, {
      address: fromAddress,
      minValue: amount + 1000,
    });
    
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }
    
    // Create transaction
    const psbt = new bitcoin.Psbt();
    
    let totalInput = 0;
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txId,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(utxo.scriptHex, 'hex'),
          value: utxo.value,
        },
      });
      totalInput += utxo.value;
    }
    
    // Add outputs
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });
    
    // Calculate fee and change
    const fee = await estimateFee(client, utxos.length, 2);
    const change = totalInput - amount - fee;
    
    if (change < 0) {
      throw new Error('Insufficient funds for fee');
    }
    
    if (change > 546) { // Dust threshold
      psbt.addOutput({
        address: fromAddress,
        value: change,
      });
    }
    
    // Sign and finalize
    const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey);
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();
    
    // Get transaction hex
    const txHex = psbt.extractTransaction().toHex();
    
    // Broadcast with Bigmi
    const txId = await sendUTXOTransaction(client, { hex: txHex });
    
    // Wait for confirmation
    const confirmed = await waitForTransaction(client, {
      txId,
      txHex,
      senderAddress: fromAddress,
      confirmations: 1,
    });
    
    return {
      txId,
      fee,
      confirmed,
    };
    
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

### Working with Different Address Types

```typescript
import { getAddressInfo } from '@bigmi/core';

function createInputForUTXO(utxo: UTXO, addressInfo: AddressInfo) {
  const input: any = {
    hash: utxo.txId,
    index: utxo.vout,
  };
  
  switch (addressInfo.type) {
    case 'p2wpkh':
    case 'p2wsh':
      // Witness UTXOs for SegWit
      input.witnessUtxo = {
        script: Buffer.from(utxo.scriptHex, 'hex'),
        value: utxo.value,
      };
      break;
    case 'p2pkh':
    case 'p2sh':
      // Need full transaction for legacy
      input.nonWitnessUtxo = Buffer.from(fullTransactionHex, 'hex');
      break;
  }
  
  return input;
}
```

### RBF (Replace-By-Fee) Support

Create transactions with RBF enabled for fee bumping:

```typescript
const psbt = new bitcoin.Psbt();

// Add inputs with RBF sequence
for (const utxo of utxos) {
  psbt.addInput({
    hash: utxo.txId,
    index: utxo.vout,
    sequence: 0xfffffffd, // RBF enabled
    witnessUtxo: {
      script: Buffer.from(utxo.scriptHex, 'hex'),
      value: utxo.value,
    },
  });
}
```

### Alternative Libraries

While we recommend bitcoinjs-lib, you can also use:
- **@scure/btc-signer** - Modern, audited Bitcoin transaction library
- **bitcore-lib** - Alternative to bitcoinjs-lib
- **bcoin** - Full Bitcoin implementation

### Security Best Practices

1. **Never expose private keys** in client-side code
2. **Use hardware wallets** for production applications
3. **Validate all inputs** before creating transactions
4. **Test on testnet** before mainnet deployment
5. **Implement proper error handling** for all edge cases

## Examples

- [See Node.js examples](./docs/core/examples.md)
- [See React examples](./docs/react/examples.md)

You can explore the [LI.FI Widget](https://github.com/lifinance/widget) and [LI.FI SDK](https://github.com/lifinance/sdk) for detailed production examples.

## Documentation

- [Learn more about Configuration](./docs/core/config.md)
- [See Core Docs](./docs/core/index.md)
- [See Client Docs](./docs/client/index.md)
- [See React Docs](./docs/react/index.md)

- [Want to add support for your wallet?](./docs/client/connectors.md)

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
