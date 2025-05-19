import { describe, expect, it } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import {
  type GetTransactionsReturnType,
  getTransactions,
} from '../../actions/getTransactions'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import type { UTXOSchema } from '../types'
import { utxo } from '../utxo'

const address = import.meta.env.VITE_TEST_ADDRESS

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: utxo('https://mempool.space/api', {
    key: 'mempool',
  }),
})

describe('Mempool Transport', () => {
  describe('getBalance action', async () => {
    const balance = await getBalance(publicClient, { address })
    it('should fetch correct balance', () => {
      expect(balance).toBeTypeOf('bigint')
    })
  })

  describe('getTransactions action', async () => {
    it('should get transactions', async () => {
      const resultGenerator = await getTransactions(publicClient, { address })
      const results = (await resultGenerator.next())
        .value as GetTransactionsReturnType
      const { transactions } = results
      expect(transactions.length > 0)
      expect(transactions[0]).toHaveProperty('hash')
      expect(transactions[0]).toHaveProperty('vout')
      expect(transactions[0]).toHaveProperty('vin')
    })
  }, 10_000)
})
