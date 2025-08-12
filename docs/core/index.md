# 🌞 Core API Reference

This document provides a comprehensive reference for the `@bigmi/core` package, which contains the fundamental functionality for interacting with the Bitcoin network.

## 🚀 Getting Started

## Client Creation

### `createClient`

Creates a new Bitcoin client instance.

```typescript
import { createClient, bitcoin } from '@bigmi/core'
import { mempool } from '@bigmi/core'

const client = createClient({
  chain: bitcoin,
  transport: mempool(),
})
```

#### Parameters

- `transport`: The transport layer to use _(required)_
- `chain`?: The Bitcoin chain configuration
- `pollingInterval?`: How often to poll for updates (default: 4000ms)
- `batchSize?`: Number of requests to batch (default: 10)
- `timeout?`: Request timeout in milliseconds (default: 30000ms)
- `rpcSchema`?: Typed JSON-RPC schema for the client.
- `account`?: An `address` or `Account` to be used with the client

#### Returns

A configured client instance.

### [⚙️ View Configuration detail ➡️](./config.md)

## Actions

After a client is created, it can be used to perform actions like getting an address balance or sending a transaction.

### `getBalance`

Gets the balance of a Bitcoin address.

```typescript
import { getBalance } from '@bigmi/core'

const balance = await getBalance(client, { address })
```

### [⚡️ View All Actions ➡️](./actions.md)

## Error Types

When performing actions, problems can occur such as wrong configuration, network problems, or a transaction not found.

There are many error types that match exceptions thrown from different stages of execution.

### `InsufficientUTXOBalanceError`

This error is thrown from the `getUTXOs` when an address doesn't have enough utxos for a specified amount.

```typescript
  import { getUTXOs } from '@bigmi/core'

  try {
    const value = 99999999n
    const utxos = getUTXOs(publicClient, { address, minValue: Number(value)})
  } catch(error) {
    if (error instanceof InsufficientUTXOBalanceError ) {
      console.log("Your address doesn't have enough UTXOs")
    } else {
      console.log("Some other error occurred")
    }
  } 

```

### [🐞 View All Errors ➡️](./errors.md)

## Type Definitions

You can import types used in the library to type your project.

### `Account`

The account is used to represent a wallet account

```typescript
interface Account {
  address: Address // address of the account
  addressType: 'p2tr' | 'p2wpkh' | 'p2wsh' | 'p2sh' | 'p2pkh' // the type of address of the current account
  publicKey: string // publick key of the account, can be used to derive various address
  purpose: 'payment' | 'ordinals' // the purpose of this account
}

```

### Usage Example

```typescript
import {type Account } from '@bigmi/core'
import { getAccount } from '@bigmi/client'

const account: Account =  getAccount(config) // already typed to return an Account type

```

### [📜 View All Type Definitions ➡️](./types.md)

## Examples

### Transaction Handling

How to send and wait for a bitcoin transaction using two actions.

```typescript
import { sendUTXOTransaction, waitForTransaction } from '@bigmi/core'

async function sendAndWait(txHex: string) {
  try {
    const txId = await sendUTXOTransaction(client, { hex: txHex })
    const tx = await waitForTransaction(client, {
      txId,
      txHex,
      onReplaced: (response) => {
        console.log('Transaction replaced:', response.reason)
      },
    })
    console.log('Transaction confirmed:', tx)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### [📚View More Examples ➡️](./examples.md)

## 🪜 Next Steps

- Explore the [Client API](../client.md)
- Learn about the [React API](../react.md)
- Check out the [Type Definitions](../types.md)
