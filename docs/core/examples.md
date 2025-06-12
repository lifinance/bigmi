## Examples

## Best Practices

1. **Error Handling**
   - Always wrap client calls in try-catch blocks
   - Handle specific error types appropriately
   - Provide meaningful error messages

2. **Performance**
   - Use batch requests when possible
   - Implement proper caching
   - Monitor request rates

3. **Security**
   - Validate all inputs
   - Handle sensitive data appropriately
   - Use secure transport layers

## Reading Blockchain Data

### Get Balance
```typescript
import { getBalance } from '@bigmi/core'

async function checkBalance(address: string) {
  const balance = await getBalance(client, { address })
  console.log('Balance:', balance)
}
```

### Get Transaction
```typescript
import { getTransaction } from '@bigmi/core'

async function getTx(txId: string) {
  const tx = await getTransaction(client, { txId })
  console.log('Transaction:', tx)
}
```

### Get Block Information
```typescript
import { getBlockCount } from '@bigmi/core'

async function getBlockInfo() {
  const blockCount = await getBlockCount(client)
  console.log('Current block:', blockCount)
}
```

## Sending Transactions

### Basic Transaction
```typescript
import { sendUTXOTransaction } from '@bigmi/core'

async function sendTx(hex: string) {
  try {
    const txId = await sendUTXOTransaction(client, { hex })
    console.log('Transaction sent:', txId)
  } catch (error) {
    console.error('Transaction failed:', error)
  }
}
```

### Wait for Confirmation
```typescript
import { waitForTransaction } from '@bigmi/core'

async function waitForTx(txId: string, txHex: string) {
  const tx = await waitForTransaction(client, {
    txId,
    txHex,
    onReplaced: (response) => {
      console.log('Transaction replaced:', response.reason)
    },
  })
  console.log('Transaction confirmed:', tx)
}
```

### Get Balance

```typescript
import { createClient, bitcoin, getBalance } from '@bigmi/core'
import { blockchair } from '@bigmi/core'

const client = createClient({
  chain: bitcoin,
  transport: blockchair(),
})

const address = 'sample_address'

async function main() {
  try {
    const balance = await getBalance(client, {
      address,
    })
    console.log('Balance:', balance)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### Transaction Handling

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

