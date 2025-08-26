import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance.js'
import { getTransactionFee } from '../../actions/getTransactionFee.js'
import { getTransactions } from '../../actions/getTransactions.js'
import { bitcoin } from '../../chains/bitcoin.js'
import { createClient, rpcSchema } from '../../factories/createClient.js'
import { createMockResponse } from '../../test/utils.js'
import {
  INVALID_TX_ID,
  TX_FEE,
  VALID_TX_ID,
} from '../__mocks__/getTransactionFee.js'
import type { UTXOSchema } from '../types.js'
import getBalanceResponse from './__mocks__/getBalance/valid.json'
import getInValidTransactionFeeResponse from './__mocks__/getTransactionFee/invalid.json'
import getValidTransactionFeeResponse from './__mocks__/getTransactionFee/valid.json'
import getTransactionsValidResponse from './__mocks__/getTransactions/valid.json'
import { ankr } from './ankr.js'
import type {
  AnkrAddressWithTxnsResponse,
  AnkrBalanceResponse,
  AnkrTxnResponse,
} from './ankr.types.js'

const ANKR_KEY = import.meta.env.VITE_TEST_ANKR_KEY
const address = import.meta.env.VITE_TEST_ADDRESS

const USE_MOCK = true

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

  describe('getTransactionFee action', async () => {
    it('should get transaction fee', async () => {
      if (USE_MOCK) {
        getValidTransactionFeeResponse.txid = VALID_TX_ID
        getValidTransactionFeeResponse.fees = TX_FEE

        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(
            getValidTransactionFeeResponse as unknown as AnkrTxnResponse
          )
        )
      }

      const result = await getTransactionFee(publicClient, {
        txId: VALID_TX_ID,
      })
      expect(result).toBeDefined()
      expect(result).toBe(BigInt(TX_FEE))
    })

    it('should throw error when txid is invalid', async () => {
      if (USE_MOCK) {
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(
            getInValidTransactionFeeResponse as unknown as AnkrTxnResponse
          )
        )
      }
      await expect(
        getTransactionFee(publicClient, { txId: INVALID_TX_ID })
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
