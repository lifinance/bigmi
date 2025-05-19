import { describe, expect, it } from 'vitest'
import { getBalance } from '../../actions/getBalance'
import { getTransactions } from '../../actions/getTransactions'
import { getUTXOs } from '../../actions/getUTXOs'
import { bitcoin } from '../../chains/bitcoin'
import { createClient, rpcSchema } from '../../factories/createClient'
import type { UTXOSchema } from '../types'
import { utxo } from '../utxo'

const apiKey = 'a44e810ba3974445811449cb8e7a22f3'

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
