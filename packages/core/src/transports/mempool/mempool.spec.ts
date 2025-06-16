import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getTransaction } from '../../actions/getTransaction'
import { getTransactions } from '../../actions/getTransactions'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import { createMockResponse } from '../../test/utils'
import type { UTXOSchema } from '../types'

import { BaseError } from '../../errors/base'
import getBalanceInValidResponse from './__mocks__/getBalance/invalid.json'
import getBalanceValidResponse from './__mocks__/getBalance/valid.json'
import getTransactionInvalidResponse from './__mocks__/getTransaction/invalid.json'
import getTransactionValidResponse from './__mocks__/getTransaction/valid.json'
import getTransactionsValidResponse from './__mocks__/getTransactions/valid.json'
import { mempool } from './mempool'
import type {
  MempoolBalanceResponse,
  MempoolErrorResponse,
  MempoolUTXOTransactionsResponse,
} from './mempool.types'

const address = import.meta.env.VITE_TEST_ADDRESS

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

  describe('getTransaction action', async () => {
    it('should get transaction details', async () => {
      const txId =
        '4b6ee974f1dd179071d027562e1fd1c83965efa4a171ec84f00b6c638e36fa4e'
      getTransactionValidResponse.txid = txId
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getTransactionValidResponse)
      )

      const result = await getTransaction(publicClient, { txId })
      const { transaction } = result
      expect(transaction).toBeDefined()
      expect(transaction.hash).toBe(txId)
      expect(transaction.vout).toBeDefined()
      expect(transaction.vin).toBeDefined()
    })

    it('should throw an error for invalid transaction ID', async () => {
      const invalidTxId = 'invalid-tx-id'
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getTransactionInvalidResponse)
      )

      await expect(
        getTransaction(publicClient, { txId: invalidTxId })
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
})
