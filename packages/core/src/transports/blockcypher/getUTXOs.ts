import type { UTXO } from '../../types/transaction.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  BlockcypherUTXO,
  BlockcypherUTXOsResponse,
} from './blockcypher.types.js'

const blockchairUTXOTransformer = (utxo: BlockcypherUTXO): UTXO => ({
  blockHeight: utxo.block_height,
  isConfirmed: Boolean(utxo.confirmations),
  confirmations: utxo.confirmations,
  value: utxo.value,
  vout: utxo.tx_output_n,
  txId: utxo.tx_hash,
  scriptHex: utxo.script,
})

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl, apiKey },
  { address, minValue }
) => {
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
      const utxoBatch = batch.map(blockchairUTXOTransformer)
      utxos.push(...utxoBatch)

      if (minValue) {
        valueCount += utxoBatch.reduce((sum, utxo) => sum + utxo.value, 0)
        if (valueCount >= minValue) {
          break
        }
      }
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
}
