import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type { AnkrAddressWithTxnsResponse } from './ankr.types.js'
import { ankrTransactionTransformer } from './utils.js'

export const getTransactions: RpcMethodHandler<'getTransactions'> = async (
  client,
  { baseUrl },
  { address, limit = 50, offset = 0, lastBlock }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/address/${address}`, {
    details: 'txs',
    pageSize: limit,
    to: lastBlock,
  })

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as AnkrAddressWithTxnsResponse

  if (response.error) {
    return { error: response.error }
  }

  const total = response.txs || 0
  const page = Math.floor(offset / limit) + 1
  const hasMore = total > offset + response.transactions.length

  const data = {
    transactions: response.transactions.map(ankrTransactionTransformer),
    total,
    page,
    itemsPerPage: limit,
    hasMore,
  }

  return { result: data }
}
