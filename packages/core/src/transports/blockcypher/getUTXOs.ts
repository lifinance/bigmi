import type { UTXO } from '../../types/transaction.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import { blockcypherDataAdapters } from './adapters.js'
import type { BlockcypherUTXOsResponse } from './blockcypher.types.js'

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
}
