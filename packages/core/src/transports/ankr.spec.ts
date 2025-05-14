import { describe, expect, it } from 'vitest'
import { getBalance } from '../actions/getBalance'
import { getTransactions } from '../actions/getTransactions'
import { getUTXOs } from '../actions/getUTXOs'
import { bitcoin } from '../chains/bitcoin'
import { createClient, rpcSchema } from '../factories/createClient'
import type { UTXOSchema } from './types'
import { utxo } from './utxo'

const ANKR_KEY = import.meta.env.VITE_TEST_ANKR_KEY
const address = import.meta.env.VITE_TEST_ADDRESS

const publicClient = createClient({
  chain: bitcoin,
  rpcSchema: rpcSchema<UTXOSchema>(),
  transport: utxo(
    `https://rpc.ankr.com/premium-http/btc_blockbook/${ANKR_KEY}/api/v2`,
    {
      key: 'ankr',
    }
  ),
})

describe('Ankr Transport', () => {
  // describe('getTransactions action', async () => {
  //   const { transactions } = await getTransactions(publicClient, { address })
  //   it('should return transactions', () => {
  //     expect(transactions.length > 1)
  //   })
  // })

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
