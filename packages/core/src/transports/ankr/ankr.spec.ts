import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getTransactions } from '../../actions/getTransactions'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import { createMockResponse } from '../../test/utils'
import type { UTXOSchema } from '../types'
import { utxo } from '../utxo'
import getBalanceResponse from './__mocks__/getBalance/valid.json'
import getTransactionsValidResponse from './__mocks__/getTransactions/valid.json'
import { ankr } from './ankr'
import type {
  AnkrAddressWithTxnsResponse,
  AnkrBalanceResponse,
} from './ankr.types'

const ANKR_KEY = import.meta.env.VITE_TEST_ANKR_KEY
const address = import.meta.env.VITE_TEST_ADDRESS

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: ankr({ apiKey: ANKR_KEY }),
})

describe('Ankr Transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getBalance action', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      createMockResponse(getBalanceResponse as AnkrBalanceResponse)
    )
    const balance = await getBalance(publicClient, { address })
    it('should fetch correct balance', () => {
      expect(balance).toBeTypeOf('bigint')
    })
  })

  describe('getTransactions action', async () => {
    it('should get transactions', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getTransactionsValidResponse as unknown as AnkrAddressWithTxnsResponse
        )
      )
      const results = await getTransactions(publicClient, {
        address,
        limit: 100,
      })
      const { transactions } = results
      expect(transactions.length > 0)
      expect(transactions[0]).toHaveProperty('hash')
      expect(transactions[0]).toHaveProperty('vout')
      expect(transactions[0]).toHaveProperty('vin')
    })
  })
})
