## Utility Functions

### `estimateFee`

Estimates the fee for a transaction.

```typescript
const fee = await estimateFee(client, {
  inputs,
  outputs,
  feeRate,
})
```

#### Parameters

- `client`: The client instance
- `inputs`: The transaction inputs
- `outputs`: The transaction outputs
- `feeRate?`: The fee rate in sat/byte

#### Returns

The estimated fee in satoshis.

### `validateAddress`

Validates a Bitcoin address.

```typescript
const isValid = await validateAddress(client, { address })
```

#### Parameters

- `client`: The client instance
- `address`: The address to validate

#### Returns

Whether the address is valid.
