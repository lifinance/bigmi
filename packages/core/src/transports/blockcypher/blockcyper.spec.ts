import { describe, expect, it } from 'vitest'
import { getBalance } from '../../actions/getBalance.js'
import { getUTXOs } from '../../actions/getUTXOs.js'
import { bitcoin } from '../../chains/bitcoin.js'
import { createClient, rpcSchema } from '../../factories/createClient.js'
import type { UTXOSchema } from '../types.js'
import { utxo } from '../utxo.js'

const apiKey = import.meta.env.VITE_TEST_BLOCKCYPHER_API_KEY

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: utxo('https://api.blockcypher.com/v1/btc/main', {
    key: 'blockcypher',
    apiKey,
  }),
})

const address = import.meta.env.VITE_TEST_ADDRESS

describe('Blockcypher Transport', () => {
  describe('getBalance action', async () => {
    const balance = await getBalance(publicClient, { address })
    it('should fetch correct balance', () => {
      expect(balance).toBeTypeOf('bigint')
    })
  })

  describe('getUTXOs action', async () => {
    const utxos = await getUTXOs(publicClient, { address })
    it('should return utxos', () => {
      expect(utxos.length > 1)
    })
  })
})
