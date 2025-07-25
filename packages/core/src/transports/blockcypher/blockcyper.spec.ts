import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance.js'
import { getTransactionFee } from '../../actions/getTransactionFee.js'
import { getUTXOs } from '../../actions/getUTXOs.js'
import { bitcoin } from '../../chains/bitcoin.js'
import { InsufficientUTXOBalanceError } from '../../errors/utxo.js'
import { createClient, rpcSchema } from '../../factories/createClient.js'
import { createMockResponse } from '../../test/utils.js'
import {
  INVALID_TX_ID,
  TX_FEE,
  VALID_TX_ID,
} from '../__mocks__/getTransactionFee'
import type { UTXOSchema } from '../types.js'
import getBalanceInValidResponse from './__mocks__/getBalance/invalid.json'
import getBalanceValidResponse from './__mocks__/getBalance/valid.json'
import getTransactionFeeInvalidResponse from './__mocks__/getTransactionFee/invalid.json'
import getTransactionFeeValidResponse from './__mocks__/getTransactionFee/valid.json'
import getUTXOsEmptyReponse from './__mocks__/getUTXOs/empty.json'
import getUTXOsPaginatedReponse from './__mocks__/getUTXOs/paginated.json'
import getUTXOsValidReponse from './__mocks__/getUTXOs/valid.json'
import { blockcypher } from './blockcypher.js'
import type {
  BlockcypherBalanceResponse,
  BlockcypherErrorResponse,
  BlockcypherUTXOsResponse,
} from './blockcypher.types.js'

const apiKey = import.meta.env.VITE_TEST_BLOCKCYPHER_API_KEY

const USE_MOCK = true

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: blockcypher({
    apiKey,
  }),
})

const address = import.meta.env.VITE_TEST_ADDRESS

describe('Blockcypher Transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getBalance action', () => {
    it('should fetch correct balance', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getBalanceValidResponse as BlockcypherBalanceResponse
        )
      )
      const balance = await getBalance(publicClient, { address })
      expect(balance).toBeTypeOf('bigint')
    })

    it('should throw an error for invalid address response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getBalanceInValidResponse as BlockcypherErrorResponse
        )
      )

      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(publicClient, { address: nonExistentAddress })
      ).rejects.toThrow()
    })
  })

  describe('getUTXOs action', async () => {
    it('should return utxos with correct structure', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getUTXOsValidReponse as BlockcypherUTXOsResponse)
      )
      const utxos = await getUTXOs(publicClient, { address })
      expect(utxos.length).toBeGreaterThan(0)
      expect(utxos[0]).toMatchObject({
        blockHeight: expect.any(Number),
        scriptHex: expect.any(String),
        txId: expect.any(String),
        value: expect.any(Number),
        vout: expect.any(Number),
      })
    })

    it('should throw error when minValue exceeds balance', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getUTXOsValidReponse as BlockcypherUTXOsResponse)
      )
      const hugeValue = 999999999999999999n
      await expect(
        getUTXOs(publicClient, {
          address,
          minValue: Number(hugeValue),
        })
      ).rejects.toThrow(InsufficientUTXOBalanceError)
    })

    it('should handle empty UTXO', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getUTXOsEmptyReponse as BlockcypherBalanceResponse)
      )
      const emptyAddress = '12LRT14SgNFFQ3hMRThAyXNao24BBy5cyU'
      const utxos = await getUTXOs(publicClient, { address: emptyAddress })
      expect(utxos.length).toBe(0)
    })

    it('should handle pagination correcly', async () => {
      const addressWithManyUTXOs = '1GrwDkr33gT6LuumniYjKEGjTLhsL5kmqC'
      const minValue = 5_610_592_350
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getUTXOsPaginatedReponse as BlockcypherUTXOsResponse)
      )

      const utxos = await getUTXOs(publicClient, {
        address: addressWithManyUTXOs,
        minValue,
      })

      expect(utxos.length).toBeGreaterThan(0)
      expect(new Set(utxos.map((utxo) => utxo.txId)).size).toBe(utxos.length)
      expect(global.fetch).toHaveBeenCalled()
      const totalValue = utxos.reduce((sum, utxo) => sum + utxo.value, 0)
      expect(totalValue).toBeGreaterThanOrEqual(minValue)
    })
  })

  describe('getTransactionFee', () => {
    it('should fetch correct transaction fee for valid transaction', async () => {
      if (USE_MOCK) {
        getTransactionFeeValidResponse.hash = VALID_TX_ID
        getTransactionFeeValidResponse.fees = TX_FEE
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

    it('should throw error for non-existent transaction', async () => {
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
