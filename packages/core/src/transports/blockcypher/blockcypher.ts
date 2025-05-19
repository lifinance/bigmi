import type { UTXO } from '../../types/transaction.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethods } from '../types.js'

type BlockcypherBalanceResponse = {
  address: string
  total_received: number
  total_sent: number
  balance: number
  unconfirmed_balance: number
  final_balance: number
  n_tx: number
  unconfirmed_n_tx: number
  final_n_tx: number
  error?: string
  hasMore?: boolean
}

type BlockcypherUTXO = {
  tx_hash: string
  block_height: number
  tx_input_n: number
  tx_output_n: number
  value: number
  ref_balance: number
  spent: boolean
  confirmations: number
  confirmed: Date
  double_spend: boolean
  script: string
}

type BlockcypherUTXOsResponse = BlockcypherBalanceResponse & {
  txrefs: BlockcypherUTXO[]
}

const blockcypherDataAdapters = {
  getUTXOs: (utxo: BlockcypherUTXO): UTXO => ({
    blockHeight: utxo.block_height,
    isConfirmed: Boolean(utxo.confirmations),
    confirmations: utxo.confirmations,
    value: utxo.value,
    vout: utxo.tx_output_n,
    txId: utxo.tx_hash,
    scriptHex: utxo.script,
  }),
}

export const blockcypherMethods: RpcMethods = {
  getBalance: async (client, { baseUrl, apiKey }, { address }) => {
    const apiUrl = urlWithParams(`${baseUrl}/addrs/${address}`, {
      token: apiKey,
    })
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as BlockcypherBalanceResponse
    if (response.error) {
      return {
        error: { code: -1, message: response.error },
      }
    }
    return {
      result: BigInt(response.balance),
    }
  },
  getUTXOs: async (client, { baseUrl, apiKey }, { address, minValue }) => {
    async function* fetchUTXOs() {
      let hasMore = true
      let beforeBlock = undefined

      while (hasMore) {
        const apiUrl = urlWithParams(`${baseUrl}/addrs/${address}`, {
          token: apiKey,
          unspentOnly: 'true',
          includeScript: 'true',
          before: beforeBlock,
        })
        const response = (await client.request({
          url: apiUrl,
          fetchOptions: { method: 'GET' },
        })) as unknown as BlockcypherUTXOsResponse

        if (response.error) {
          throw new Error(`${response.error}`)
        }

        if (minValue && minValue > response.final_balance) {
          throw new Error(
            `Address: ${address} doesn't have enough utxo to spend ${minValue}`
          )
        }

        if (!response.txrefs || response.txrefs.length === 0) {
          hasMore = false
          continue
        }

        const { hasMore: apiHasMore } = response

        hasMore = Boolean(apiHasMore)
        beforeBlock = response.txrefs[response.txrefs.length - 1].block_height

        yield response.txrefs
      }
    }

    try {
      const utxos: UTXO[] = []
      let valueCount = 0

      for await (const batch of fetchUTXOs()) {
        const utxoBatch = batch.map(blockcypherDataAdapters.getUTXOs)
        utxos.push(...utxoBatch)

        if (minValue) {
          valueCount += utxoBatch.reduce((sum, utxo) => sum + utxo.value, 0)
          if (valueCount >= minValue) {
            break
          }
        }
      }
      if (utxos.length < 1) {
        throw new Error(`Address: ${address} has no spendable utxos`)
      }

      return { result: utxos }
    } catch (error: any) {
      return {
        error: {
          code: error?.code || -1,
          message:
            error instanceof Error ? error.message : 'Failed to fetch UTXOs',
        },
      }
    }
  },
}
