import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance.js'
import { getTransactionFee } from '../../actions/getTransactionFee.js'
import { getUTXOs } from '../../actions/getUTXOs.js'
import { bitcoin } from '../../chains/bitcoin.js'
import { BaseError } from '../../errors/base.js'
import { InsufficientUTXOBalanceError } from '../../errors/utxo.js'
import { createClient, rpcSchema } from '../../factories/createClient.js'
import { createMockResponse } from '../../test/utils.js'
import {
  INVALID_TX_ID,
  TX_FEE,
  VALID_TX_ID,
} from '../__mocks__/getTransactionFee.js'
import type { UTXOSchema } from '../types.js'
import getInvalidBalanceReponse from './__mocks__/getBalance/invalidAddress.json'
import getBalanceReponse from './__mocks__/getBalance/valid.json'
import getTransactionFeeInvalidResponse from './__mocks__/getTransactionFee/invalid.json'
import getTransactionFeeValidResponse from './__mocks__/getTransactionFee/valid.json'
import getUTXOsInvalidResponse from './__mocks__/getUTXOs/invalidAddress.json'
import getUTXOsResponse from './__mocks__/getUTXOs/valid.json'
import getUTXOsPaginatedResponse from './__mocks__/getUTXOs/validPaginated.json'
import { blockchair } from './blockchair.js'
import type {
  BlockChairDashboardAddressResponse,
  BlockchairAddressBalanceData,
  BlockchairResponse,
} from './blockchair.types.js'

const address = import.meta.env.VITE_TEST_ADDRESS
const apiKey = import.meta.env.VITE_TEST_BLOCKCHAIR_KEY

const USE_MOCK = true

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
      if (USE_MOCK) {
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(getBalanceReponse as BlockchairAddressBalanceData)
        )
      }

      const balance = await getBalance(publicClient, { address })
      expect(balance).toBeTypeOf('bigint')
    })

    it('should return 0n for a non-existent or a zero balance address', async () => {
      if (USE_MOCK) {
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(
            getInvalidBalanceReponse as BlockchairAddressBalanceData
          )
        )
      }

      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(publicClient, { address: nonExistentAddress })
      ).resolves.toEqual(0n)
    })
  })

  describe('getUTXOs', () => {
    it('should return utxos with correct structure', async () => {
      if (USE_MOCK) {
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(
            getUTXOsResponse as BlockchairResponse<BlockChairDashboardAddressResponse>
          )
        )
      }

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
      if (USE_MOCK) {
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
      }

      const hugeValue = 999999999999999999n
      await expect(
        getUTXOs(publicClient, {
          address,
          minValue: Number(hugeValue),
        })
      ).rejects.toThrow(InsufficientUTXOBalanceError)
    })

    it('should handle empty UTXO response', async () => {
      if (USE_MOCK) {
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(
            getUTXOsInvalidResponse as BlockchairResponse<null>
          )
        )
      }

      const emptyAddress = '12LRT14SgNFFQ3hMRThAyXNao24BBy5cyU'

      if (USE_MOCK) {
        const utxos = await getUTXOs(publicClient, { address: emptyAddress })
        expect(utxos.length).toBe(0)
      } else {
        await expect(
          getUTXOs(publicClient, { address: emptyAddress })
        ).rejects.toMatchObject({
          status: 404,
        })
      }
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
        if (USE_MOCK) {
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
                url.searchParams.get('offset')?.split(',')[1] || '0',
                10
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
        }

        const utxos = await getUTXOs(publicClient, {
          address: addressWithManyUTXOs,
          minValue,
        })

        expect(utxos.length).toBeGreaterThan(0)
        expect(new Set(utxos.map((utxo) => utxo.txId)).size).toBe(utxos.length)
        if (USE_MOCK) {
          expect(global.fetch).toHaveBeenCalled()
        }

        const totalValue = utxos.reduce((sum, utxo) => sum + utxo.value, 0)
        expect(totalValue).toBeGreaterThanOrEqual(minValue)
      })
    })
  })

  describe('getTransactionFee', () => {
    it('should fetch correct transaction fee for valid transaction', async () => {
      if (USE_MOCK) {
        const mockData = {
          data: {
            [VALID_TX_ID]:
              getTransactionFeeValidResponse.data[
                '8f210660cd99c5e6dc77b6cb09d4d522d3fbc5fd97ad3e65403d49aa7aa5dc23'
              ],
          },
          context: getTransactionFeeValidResponse.context,
        }

        mockData.data[VALID_TX_ID].transaction.fee = TX_FEE
        vi.spyOn(global, 'fetch').mockResolvedValue(
          createMockResponse(mockData)
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
