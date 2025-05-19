import { describe, expect, it } from 'vitest'
import { getBalance } from '../actions/getBalance'
import { getUTXOs } from '../actions/getUTXOs'
import { bitcoin } from '../chains/bitcoin'
import { createClient, rpcSchema } from '../factories/createClient'
import type { UTXOSchema } from './types'
import { utxo } from './utxo'

const address = import.meta.env.VITE_TEST_ADDRESS
const BLOCKCHAIR_API_KEY = import.meta.env.VITE_TEST_BLOCKCHAIR_KEY
const BLOCKCYPHER_API_KEY = import.meta.env.VITE_TEST_BLOCKCYPHER_API_KEY

const clients = {
  blockchair: createClient({
    chain: bitcoin,
    rpcSchema: rpcSchema<UTXOSchema>(),
    transport: utxo('https://api.blockchair.com', {
      key: 'blockchair',
      includeChainToURL: true,
      apiKey: BLOCKCHAIR_API_KEY,
    }),
  }),
  blockCypher: createClient({
    chain: bitcoin,
    rpcSchema: rpcSchema<UTXOSchema>(),
    transport: utxo('https://api.blockcypher.com/v1/btc/main', {
      key: 'blockcypher',
      apiKey: BLOCKCYPHER_API_KEY,
    }),
  }),
}

describe.each([
  ['Blockchair', clients.blockchair],
  ['BlockCypher', clients.blockCypher],
])('%s Transport', (_, client) => {
  describe('getBalance action', () => {
    it('should fetch correct balance', async () => {
      const balance = await getBalance(client, { address })
      expect(balance).toBeTypeOf('bigint')
    })

    it('should handle non-existent address', async () => {
      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(client, { address: nonExistentAddress })
      ).rejects.toThrow()
    })
  })

  describe('getUTXOs action', () => {
    it('should return utxos with correct structure', async () => {
      const utxos = await getUTXOs(client, { address })

      expect(utxos.length).toBeGreaterThan(0)
      expect(utxos[0]).toHaveProperty('blockHeight')
      expect(utxos[0]).toHaveProperty('scriptHex')
      expect(utxos[0]).toHaveProperty('txId')
      expect(utxos[0]).toHaveProperty('value')
      expect(utxos[0]).toHaveProperty('vout')
    })

    it('should throw error when minValue exceeds balance', async () => {
      const hugeValue = 999999999999999999n
      await expect(
        getUTXOs(client, {
          address,
          minValue: Number(hugeValue),
        })
      ).rejects.toThrow()
    })

    it('should handle empty UTXO response', async () => {
      const emptyAddress = '12LRT14SgNFFQ3hMRThAyXNao24BBy5cyU'
      await expect(
        getUTXOs(client, { address: emptyAddress })
      ).rejects.toThrow()
    })

    it('should handle pagination correctly', async () => {
      const addressWithManyUTXOs = '1GrwDkr33gT6LuumniYjKEGjTLhsL5kmqC'
      const utxos = await getUTXOs(client, {
        address: addressWithManyUTXOs,
        minValue: 5_610_592_350,
      })
      expect(utxos.length).toBeGreaterThan(100)
      const uniqueTxIds = new Set(utxos.map((utxo) => utxo.txId))
      expect(uniqueTxIds.size).toBe(utxos.length)
    }, 50_000)
  })
})
