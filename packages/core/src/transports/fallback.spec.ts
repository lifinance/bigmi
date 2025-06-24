import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getUTXOs } from '../actions/getUTXOs'
import { bitcoin } from '../chains/bitcoin'
import { AllTransportsFailedError } from '../errors/transport'
import { InsufficientUTXOBalanceError } from '../errors/utxo'
import { createClient, rpcSchema } from '../factories/createClient'
import { createMockResponse } from '../test/utils'
import blockchairLimitedResponse from './blockchair/__mocks__/getUTXOs/rateLimited.json'
import blockchairValidResponse from './blockchair/__mocks__/getUTXOs/valid.json'
import { blockchair } from './blockchair/blockchair'
import blockcypherLimitedResponse from './blockcypher/__mocks__/getUTXOs/rateLimited.json'
import blockcypherValidResponse from './blockcypher/__mocks__/getUTXOs/valid.json'
import { blockcypher } from './blockcypher/blockcypher'
import { fallback } from './fallback'
import type { UTXOSchema } from './types'

const address = import.meta.env.VITE_TEST_ADDRESS
const apiKey = import.meta.env.VITE_TEST_BLOCKCHAIR_KEY
const blockCypherKey = import.meta.env.VITE_TEST_BLOCKCYPHER_API_KEY

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: fallback([
    blockcypher({ apiKey: blockCypherKey }),
    blockchair({ apiKey }),
  ]),
})

describe('Fallback Transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUTXOs', () => {
    it('should use blockcypher when it succeeds', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        createMockResponse(blockcypherValidResponse)
      )

      const utxos = await getUTXOs(publicClient, { address })
      expect(utxos.length).toBeGreaterThan(0)
    })

    it('should fallback to blockchair when blockcypher fails', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((request) => {
        const url = new URL(request.toString())
        if (url.hostname.includes('blockcypher')) {
          return Promise.resolve(
            createMockResponse(blockcypherLimitedResponse, { status: 429 })
          )
        }

        return Promise.resolve(createMockResponse(blockchairValidResponse))
      })

      const utxos = await getUTXOs(publicClient, { address })
      expect(utxos.length).toBeGreaterThan(0)
    })

    it('should throw error when both transports fail', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((request) => {
        const url = new URL(request.toString())
        if (url.hostname.includes('blockcypher')) {
          return Promise.resolve(
            createMockResponse(blockcypherLimitedResponse, { status: 429 })
          )
        }
        return Promise.resolve(
          createMockResponse(blockchairLimitedResponse, { status: 429 })
        )
      })

      await expect(getUTXOs(publicClient, { address })).rejects.toThrow(
        AllTransportsFailedError
      )
    })

    it('should not call blockchair if user has insufficientUTXOs', async () => {
      const blockchairSpy = vi
        .spyOn(global, 'fetch')
        .mockImplementation((request) => {
          const url = new URL(request.toString())
          if (url.hostname.includes('blockcypher')) {
            return Promise.resolve(createMockResponse(blockcypherValidResponse))
          }

          return Promise.resolve(createMockResponse(blockchairValidResponse))
        })

      await expect(
        getUTXOs(publicClient, {
          address,
          minValue: 1000000,
        })
      ).rejects.toThrow(InsufficientUTXOBalanceError)

      expect(blockchairSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('blockchair')
      )
    })
  })
})
