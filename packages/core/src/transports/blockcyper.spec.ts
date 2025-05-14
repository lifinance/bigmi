import { describe, expect, it } from 'vitest'
import { getTransactions } from '../actions/getTransactions'
import { getUTXOs } from '../actions/getUTXOs'
import { bitcoin } from '../chains/bitcoin'
import { createClient, rpcSchema } from '../factories/createClient'
import type { UTXOSchema } from './types'
import { utxo } from './utxo'

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: utxo('https://api.blockcypher.com/v1/btc/main', {
    key: 'blockcypher',
  }),
})

const address = import.meta.env.VITE_TEST_ADDRESS

describe('Blockcypher Transport', () => {
  // describe('getTransactions action', async () => {
  //   const { transactions } = await getTransactions(publicClient, { address })
  //   it('should return transactions', () => {
  //     expect(transactions.length > 1)
  //   })
  // })

  describe('getUTXOs action', async () => {
    const utxos = await getUTXOs(publicClient, { address })
    it('should return utxos', () => {
      expect(utxos.length > 1)
    })
  })
})
