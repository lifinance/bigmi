import { BaseError } from '../../errors/base.js'
import { RpcRequestError } from '../../errors/request.js'
import { RpcErrorCode } from '../../errors/rpc.js'
import { InsufficientUTXOBalanceError } from '../../errors/utxo.js'
import type { UTXO } from '../../types/transaction.js'

import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  BlockChairDashboardAddressResponse,
  BlockchairResponse,
  BlockchairUTXO,
} from './blockchair.types.js'
import { getBalance } from './getBalance.js'

const blockChairUTXOTransformer =
  (scriptHex: string) =>
  (data: BlockchairUTXO): UTXO => ({
    blockHeight: data.block_id,
    scriptHex,
    txId: data.transaction_hash,
    value: data.value,
    vout: data.index,
  })

const MAX_API_LIMIT = '100,100'

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl, apiKey },
  { address, minValue }
) => {
  async function* fetchUTXOs() {
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const apiUrl = urlWithParams(
        `${baseUrl}/dashboards/addresses/${address}`,
        {
          key: apiKey,
          offset: `0,${offset}`,
          limit: MAX_API_LIMIT,
        }
      )
      const response = (await client.request({
        url: apiUrl,
        fetchOptions: { method: 'GET' },
      })) as unknown as BlockchairResponse<BlockChairDashboardAddressResponse>

      if (response.context?.code !== 200 && response.context?.code !== 404) {
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
            code:
              response.context.code === 429
                ? RpcErrorCode.ACCESS_DENIED
                : RpcErrorCode.MISC_ERROR,
            message: response.context.error || 'Error fetching utxos',
          },
        })
      }

      if (!response.data || response.data.utxo.length === 0) {
        hasMore = false
        continue
      }

      const { limit } = response.context
      const totalRows = response.data.addresses[address].unspent_output_count
      if (limit && totalRows) {
        const [, utxoLimit] = String(limit)
          .split(',')
          .map((val) => Number(val))
        hasMore = offset + utxoLimit < totalRows
        offset += utxoLimit
      } else {
        hasMore = false
        offset += 0
      }

      yield response.data
    }
  }

  if (minValue) {
    const { error, result: balance } = await getBalance(
      client,
      { baseUrl, apiKey },
      { address }
    )

    if (error) {
      throw new BaseError('Error fetching balance', {
        cause: error,
      })
    }

    if (balance === undefined) {
      throw new BaseError('Balance is undefined', {
        cause: new Error('Unable to determine balance'),
      })
    }

    if (minValue > Number(balance)) {
      throw new InsufficientUTXOBalanceError({
        minValue,
        address,
        balance: Number(balance),
      })
    }
  }
  const utxos: UTXO[] = []
  let valueCount = 0

  for await (const batch of fetchUTXOs()) {
    const addressScriptHex = batch.addresses[address].script_hex
    const utxoBatch = batch.utxo.map(
      blockChairUTXOTransformer(addressScriptHex)
    )
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
