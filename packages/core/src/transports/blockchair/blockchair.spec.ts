import { describe, expect, it } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getUTXOs } from '../../actions/getUTXOs'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import type { UTXOSchema } from '../types'
import { utxo } from '../utxo'

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
    const balance = await getBalance(publicClient, { address })

    it('should fetch correct balance', () => {
      expect(balance).toBeTypeOf('bigint')
    })

    it('should handle non-existent address', async () => {
      const nonExistentAddress =
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaNUIBNSUENopnoidsacn'
      await expect(
        getBalance(publicClient, { address: nonExistentAddress })
      ).rejects.toThrow()
    })
  })

  describe('getUTXOs action', async () => {
    it('should return utxos with correct structure', async () => {
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
      const hugeValue = 999999999999999999n
      await expect(
        getUTXOs(publicClient, {
          address,
          minValue: Number(hugeValue),
        })
      ).rejects.toThrow("doesn't have enough utxo to spend")
    })

    it('should handle empty UTXO response', async () => {
      const emptyAddress = '12LRT14SgNFFQ3hMRThAyXNao24BBy5cyU'
      await expect(
        getUTXOs(publicClient, { address: emptyAddress })
      ).rejects.toThrow()
    })

    it('should handle pagination correctly', async () => {
      const addressWithManyUTXOs = '1GrwDkr33gT6LuumniYjKEGjTLhsL5kmqC'
      const utxos = await getUTXOs(publicClient, {
        address: addressWithManyUTXOs,
        minValue: 55_610_592_350,
      })
      expect(utxos.length).toBeGreaterThan(100)
      const uniqueTxIds = new Set(utxos.map((utxo) => utxo.txId))
      expect(uniqueTxIds.size).toBe(utxos.length)
    }, 50_000)
  })
})
