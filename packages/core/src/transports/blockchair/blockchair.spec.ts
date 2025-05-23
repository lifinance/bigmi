import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getUTXOs } from '../../actions/getUTXOs'
import { bitcoin } from '../../chains/bitcoin'
import { BaseError } from '../../errors/base'
import { InsufficientUTXOBalanceError } from '../../errors/utxo'
import { createClient, rpcSchema } from '../../factories/createClient'
import { createMockResponse } from '../../test/utils'
import type { UTXOSchema } from '../types'
import getInvalidBalanceReponse from './__mocks__/getBalance/invalidAddress.json'
import getBalanceReponse from './__mocks__/getBalance/valid.json'
import getUTXOsInvalidResponse from './__mocks__/getUTXOs/invalidAddress.json'
import getUTXOsResponse from './__mocks__/getUTXOs/valid.json'
import getUTXOsPaginatedResponse from './__mocks__/getUTXOs/validPaginated.json'
import { blockchair } from './blockchair.js'
import type {
  BlockChairDashboardAddressResponse,
  BlockchairAddressBalanceData,
  BlockchairResponse,
} from './blockchair.types'

const address = import.meta.env.VITE_TEST_ADDRESS
const apiKey = import.meta.env.VITE_TEST_BLOCKCHAIR_KEY

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: blockchair({
    apiKey,
  }),
})

describe('Blockchair Transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getBalance', () => {
    it('should fetch correct balance for valid address', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getBalanceReponse as BlockchairAddressBalanceData)
      )

      const balance = await getBalance(publicClient, { address })
      expect(balance).toBeTypeOf('bigint')
    })

    it('should throw error for non-existent address', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getInvalidBalanceReponse as BlockchairAddressBalanceData
        )
      )

      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(publicClient, { address: nonExistentAddress })
      ).rejects.toThrow()
    })
  })

  describe('getUTXOs', () => {
    it('should return utxos with correct structure', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(
          getUTXOsResponse as BlockchairResponse<BlockChairDashboardAddressResponse>
        )
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
      vi.spyOn(global, 'fetch').mockImplementation((request) => {
        const url = new URL(request.toString())

        if (url.pathname.includes('/addresses/balances')) {
          return Promise.resolve(
            createMockResponse(
              getBalanceReponse as BlockchairAddressBalanceData
            )
          )
        }

        if (url.pathname.includes('/dashboards/addresses')) {
          return Promise.resolve(
            createMockResponse(
              getUTXOsResponse as BlockchairResponse<BlockChairDashboardAddressResponse>
            )
          )
        }

        throw new BaseError(`Unexpected URL: ${url.pathname}`)
      })

      const hugeValue = 999999999999999999n
      await expect(
        getUTXOs(publicClient, {
          address,
          minValue: Number(hugeValue),
        })
      ).rejects.toThrow(InsufficientUTXOBalanceError)
    })

    it('should handle empty UTXO response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(getUTXOsInvalidResponse as BlockchairResponse<null>)
      )

      const emptyAddress = '12LRT14SgNFFQ3hMRThAyXNao24BBy5cyU'
      const utxos = await getUTXOs(publicClient, { address: emptyAddress })

      expect(utxos.length).toBe(0)
    })

    describe('pagination', () => {
      const addressWithManyUTXOs = '1GrwDkr33gT6LuumniYjKEGjTLhsL5kmqC'
      const minValue = 5_610_592_350

      const createPaginatedMockResponse = (offset: number, limit: number) => ({
        ...getUTXOsPaginatedResponse,
        data: {
          ...getUTXOsPaginatedResponse.data,
          utxo: getUTXOsPaginatedResponse.data.utxo.slice(
            offset,
            offset + limit
          ),
          addresses: {
            [addressWithManyUTXOs]: {
              ...getUTXOsPaginatedResponse.data.addresses[addressWithManyUTXOs],
              unspent_output_count: getUTXOsPaginatedResponse.data.utxo.length,
            },
          },
        },
      })

      it('should handle pagination correctly', async () => {
        vi.spyOn(global, 'fetch').mockImplementation((request) => {
          const url = new URL(request.toString())

          if (url.pathname.includes('/addresses/balances')) {
            return Promise.resolve(
              createMockResponse({
                data: {
                  [addressWithManyUTXOs]: 1000000000000,
                },
                context: { code: 200 },
              } as BlockchairResponse<BlockchairAddressBalanceData>)
            )
          }

          if (url.pathname.includes('/dashboards/addresses')) {
            const offset = Number.parseInt(
              url.searchParams.get('offset')?.split(',')[1] || '0'
            )
            const limit = 100
            return Promise.resolve(
              createMockResponse(
                createPaginatedMockResponse(
                  offset,
                  limit
                ) as BlockchairResponse<BlockChairDashboardAddressResponse>
              )
            )
          }

          throw new BaseError(`Unexpected URL: ${url.pathname}`)
        })

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
  })
})
