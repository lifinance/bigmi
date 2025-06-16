import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getTransaction } from '../../actions/getTransaction'
import { getTransactions } from '../../actions/getTransactions'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import { createMockResponse } from '../../test/utils'
import type { UTXOSchema } from '../types'
import { utxo } from '../utxo'
import getBalanceResponse from './__mocks__/getBalance/valid.json'
import getInValidTransactionResponse from './__mocks__/getTransaction/invalid.json'
import getValidTransactionResponse from './__mocks__/getTransaction/valid.json'
import getTransactionsValidResponse from './__mocks__/getTransactions/valid.json'
import { ankr } from './ankr'
import type {
  AnkrAddressWithTxnsResponse,
  AnkrBalanceResponse,
  AnkrTxnResponse,
} from './ankr.types'

const ANKR_KEY = import.meta.env.VITE_TEST_ANKR_KEY
const address = import.meta.env.VITE_TEST_ADDRESS
const txId = import.meta.env.VITE_TEST_TXID

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

  describe('getTransaction action', async () => {
    it('should get a valid transaction', async () => {
      getValidTransactionResponse.txid = txId
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getValidTransactionResponse as unknown as AnkrTxnResponse
        )
      )

      const result = await getTransaction(publicClient, { txId })

      const { transaction } = result
      expect(transaction).toHaveProperty('hash')
      expect(transaction).toHaveProperty('vout')
      expect(transaction).toHaveProperty('vin')
    })

    it('should throw error when txid is invalid', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getInValidTransactionResponse as unknown as AnkrTxnResponse
        )
      )
      await expect(
        getTransaction(publicClient, { txId })
      ).rejects.toThrowError()
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
