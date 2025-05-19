import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getUTXOs } from '../../actions/getUTXOs'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import type { UTXOSchema } from '../types'
import { utxo } from '../utxo'
import getInvalidBalanceReponse from './__mocks__/responses/getBalance/invalidAddress.json'
import getBalanceReponse from './__mocks__/responses/getBalance/valid.json'
import getUTXOsInvalidResponse from './__mocks__/responses/getUTXOs/invalidAddress.json'
import getUTXOsResponse from './__mocks__/responses/getUTXOs/valid.json'
import getUTXOsPaginatedResponse from './__mocks__/responses/getUTXOs/validPaginated.json'
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
  transport: utxo('https://api.blockchair.com', {
    key: 'blockchair',
    includeChainToURL: true,
    apiKey,
  }),
})

describe('Blockchair Transport', () => {
  describe('getBalance action', async () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })
    it('should fetch correct balance', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(getBalanceReponse as BlockchairAddressBalanceData),
        headers: new Headers({
          'Content-type': 'application/json',
        }),
      })
      const balance = await getBalance(publicClient, { address })
      expect(balance).toBeTypeOf('bigint')
    })

    it('should handle non-existent address', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            getInvalidBalanceReponse as BlockchairAddressBalanceData
          ),
        headers: new Headers({
          'Content-type': 'application/json',
        }),
      })
      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(publicClient, { address: nonExistentAddress })
      ).rejects.toThrow()
    })
  })

  describe('getUTXOs action', async () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })
    it('should return utxos with correct structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            getUTXOsResponse as BlockchairResponse<BlockChairDashboardAddressResponse>
          ),
        headers: new Headers({
          'Content-type': 'application/json',
        }),
      })

      const utxos = await getUTXOs(publicClient, {
        address,
      })

      expect(utxos.length).toBeGreaterThan(0)
      expect(utxos[0]).toHaveProperty('blockHeight')
      expect(utxos[0]).toHaveProperty('scriptHex')
      expect(utxos[0]).toHaveProperty('txId')
      expect(utxos[0]).toHaveProperty('value')
      expect(utxos[0]).toHaveProperty('vout')
    })

    it('should throw error when minValue exceeds balance', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            getUTXOsResponse as BlockchairResponse<BlockChairDashboardAddressResponse>
          ),
        headers: new Headers({
          'Content-type': 'application/json',
        }),
      })
      const hugeValue = 999999999999999999n
      await expect(
        getUTXOs(publicClient, {
          address,
          minValue: Number(hugeValue),
        })
      ).rejects.toThrow("doesn't have enough utxo to spend")
    })

    it('should handle empty UTXO response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(getUTXOsInvalidResponse as BlockchairResponse<null>),
        headers: new Headers({
          'Content-type': 'application/json',
        }),
      })
      const emptyAddress = '12LRT14SgNFFQ3hMRThAyXNao24BBy5cyU'
      await expect(
        getUTXOs(publicClient, { address: emptyAddress })
      ).rejects.toThrow()
    })

    it('should handle pagination correctly', async () => {
      const createMockResponse = (offset: number, limit: number) => ({
        ok: true,
        json: () =>
          Promise.resolve({
            ...getUTXOsPaginatedResponse,
            data: {
              ...getUTXOsPaginatedResponse.data,
              utxo: getUTXOsPaginatedResponse.data.utxo.slice(
                offset,
                offset + limit
              ),
              addresses: {
                [addressWithManyUTXOs]: {
                  ...getUTXOsPaginatedResponse.data.addresses[
                    addressWithManyUTXOs
                  ],
                  unspent_output_count:
                    getUTXOsPaginatedResponse.data.utxo.length,
                },
              },
            },
          } as unknown as BlockchairResponse<BlockChairDashboardAddressResponse>),
        headers: new Headers({
          'Content-type': 'application/json',
        }),
      })

      const addressWithManyUTXOs = '1GrwDkr33gT6LuumniYjKEGjTLhsL5kmqC'
      const minValue = 5_610_592_350

      global.fetch = vi.fn().mockImplementation((request) => {
        const url = new URL(request)

        // Handle balance check request
        if (url.pathname.includes('/addresses/balances')) {
          const addresses = url.searchParams.get('addresses')
          if (addresses !== addressWithManyUTXOs) {
            throw new Error(`Unexpected address in balance check: ${addresses}`)
          }
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  [addressWithManyUTXOs]: 1000000000000, // Large enough balance
                },
                context: {
                  code: 200,
                },
              } as BlockchairResponse<BlockchairAddressBalanceData>),
            headers: new Headers({
              'Content-type': 'application/json',
            }),
          }
        }

        // Handle UTXO requests
        if (url.pathname.includes('/dashboards/addresses')) {
          const address = url.pathname.split('/').pop()
          if (address !== addressWithManyUTXOs) {
            throw new Error(`Unexpected address in UTXO request: ${address}`)
          }
          const offset = Number.parseInt(
            url.searchParams.get('offset')?.split(',')[1] || '0'
          )
          const limit = 100
          return createMockResponse(offset, limit)
        }

        throw new Error(`Unexpected URL: ${url.pathname}`)
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
