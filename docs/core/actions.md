
# Actions

### `getBalance`

Gets the balance of a Bitcoin address.

```typescript
const balance = await getBalance(client, { address })
```

#### Parameters

- `client`: The client instance
- `address`: The Bitcoin address to check

#### Returns

The balance in satoshis.

### `getBlockCount`

Gets the current block count (height).

```typescript
const blockCount = await getBlockCount(client)
```

#### Parameters

- `client`: The client instance

#### Returns

The current block height.

### `getTransaction`

Gets a transaction by its ID.

```typescript
const tx = await getTransaction(client, { txId })
```

#### Parameters

- `client`: The client instance
- `txId`: The transaction ID

#### Returns

The transaction details.

## Transaction Methods

### `sendUTXOTransaction`

Sends a UTXO transaction to the network.

```typescript
const txId = await sendUTXOTransaction(client, { hex })
```

#### Parameters

- `client`: The client instance
- `hex`: The transaction hex string

#### Returns

The transaction ID.

### `waitForTransaction`

[⬅️ back](./index.md)
