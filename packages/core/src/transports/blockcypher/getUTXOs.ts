import { RpcRequestError } from '../../errors/request.js'
import { InsufficientUTXOBalanceError } from '../../errors/utxo.js'
import type { UTXO } from '../../types/transaction.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  BlockcypherUTXO,
  BlockcypherUTXOsResponse,
} from './blockcypher.types.js'
import { getRpcErrorCode } from './utils.js'

const blockcypherUTXOTransformer = (utxo: BlockcypherUTXO): UTXO => ({
  blockHeight: utxo.block_height,
  isConfirmed: Boolean(utxo.confirmations),
  confirmations: utxo.confirmations,
  value: utxo.value,
  vout: utxo.tx_output_n,
  txId: utxo.tx_hash,
  scriptHex: utxo.script,
})

const MAX_API_LIMIT = 2000

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl, apiKey },
  { address, minValue }
) => {
  async function* fetchUTXOs() {
    let hasMore = true
    let beforeBlock: number | undefined

    while (hasMore) {
      const apiUrl = urlWithParams(`${baseUrl}/addrs/${address}`, {
        token: apiKey,
        unspentOnly: 'true',
        includeScript: 'true',
        before: beforeBlock,
        limit: MAX_API_LIMIT,
      })
      const response = (await client.request({
        url: apiUrl,
        fetchOptions: { method: 'GET' },
      })) as unknown as BlockcypherUTXOsResponse

      if (response.error) {
        throw new RpcRequestError({
          url: apiUrl,
          body: {
            method: 'fetchUTXOs',
            params: {
              address,
              minValue,
            },
          },
          error: {
            code: getRpcErrorCode(response.error),
            message: response.error,
          },
        })
      }

      if (minValue && minValue > response.final_balance) {
        throw new InsufficientUTXOBalanceError({
          minValue,
          address,
          balance: response.final_balance,
        })
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

  const utxos: UTXO[] = []
  let valueCount = 0

  for await (const batch of fetchUTXOs()) {
    const utxoBatch = batch.map(blockcypherUTXOTransformer)
    utxos.push(...utxoBatch)

    if (minValue) {
      valueCount += utxoBatch.reduce((sum, utxo) => sum + utxo.value, 0)
      if (valueCount >= minValue) {
        break
      }
    }
  }

  return { result: utxos }
}
