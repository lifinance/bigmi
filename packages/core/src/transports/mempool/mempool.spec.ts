import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getTransactions } from '../../actions/getTransactions'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import { createMockResponse } from '../../test/utils'
import type { UTXOSchema } from '../types'

import { getTransactionFee } from '../../actions/getTransactionFee'
import { BaseError } from '../../errors/base'
import {
  INVALID_TX_ID,
  TX_FEE,
  VALID_TX_ID,
} from '../__mocks__/getTransactionFee'
import getBalanceInValidResponse from './__mocks__/getBalance/invalid.json'
import getBalanceValidResponse from './__mocks__/getBalance/valid.json'
import getTransactionFeeInvalidResponse from './__mocks__/getTransactionFee/invalid.json'
import getTransactionFeeValidResponse from './__mocks__/getTransactionFee/valid.json'
import getTransactionsValidResponse from './__mocks__/getTransactions/valid.json'
import { mempool } from './mempool'
import type {
  MempoolBalanceResponse,
  MempoolErrorResponse,
  MempoolUTXOTransactionsResponse,
} from './mempool.types'

const address = import.meta.env.VITE_TEST_ADDRESS

const USE_MOCK = true

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: mempool(),
})

describe('Mempool Transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  describe('getBalance action', async () => {
    it('should fetch correct balance', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getBalanceValidResponse as MempoolBalanceResponse)
      )
      const balance = await getBalance(publicClient, { address })
      expect(balance).toBeTypeOf('bigint')
    })

    it('should throw an error for invalid address response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getBalanceInValidResponse as MempoolErrorResponse)
      )

      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(publicClient, { address: nonExistentAddress })
      ).rejects.toThrow()
    })
  })

  describe('getTransactions action', async () => {
    it('should get transactions', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((request) => {
        const url = new URL(request.toString())

        if (url.pathname.endsWith(`/address/${address}`)) {
          return Promise.resolve(
            createMockResponse(
              getBalanceValidResponse as MempoolBalanceResponse
            )
          )
        }

        if (url.pathname.includes(`/address/${address}/txs`)) {
          return Promise.resolve(
            createMockResponse(
              getTransactionsValidResponse as MempoolUTXOTransactionsResponse
            )
          )
        }

        throw new BaseError(`Unexpected URL: ${url.pathname}`)
      })

      const results = await getTransactions(publicClient, { address })
      const { transactions } = results
      expect(transactions.length > 0)
      expect(transactions[0]).toHaveProperty('hash')
      expect(transactions[0]).toHaveProperty('vout')
      expect(transactions[0]).toHaveProperty('vin')
    })
  })

  describe('getTransactionFee action', async () => {
    it('should get transaction fee', async () => {
      if (USE_MOCK) {
        getTransactionFeeValidResponse.txid = VALID_TX_ID
        getTransactionFeeValidResponse.fee = TX_FEE

        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(getTransactionFeeValidResponse)
        )
      }

      const result = await getTransactionFee(publicClient, {
        txId: VALID_TX_ID,
      })
      expect(result).toBeDefined()
      expect(result).toBe(BigInt(TX_FEE))
    })

    it('should throw an error for invalid transaction ID', async () => {
      if (USE_MOCK) {
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(getTransactionFeeInvalidResponse)
        )
      }

      await expect(
        getTransactionFee(publicClient, { txId: INVALID_TX_ID })
      ).rejects.toThrow()
    })
  })
})
