import type { RpcMethodHandler } from '../types.js'
import { AnkrUTXOTxnAdapter } from './adapters.js'
import type { AnkrAddressWithTxnsResponse } from './ankr.types.js'

export const getTransactions: RpcMethodHandler<'getTransactions'> = async (
  client,
  { baseUrl },
  { address, limit = 100, offset = 0 }
) => {
  async function* generator() {
    let totalTxns = 0
    let currentOffset = offset
    let lastBlock = undefined

    do {
      const apiUrl = `${baseUrl}/address/${address}?details=txs&pageSize=${limit}${lastBlock ? `&to=${lastBlock}` : ''}`
      const response = (await client.request({
        url: apiUrl,
        fetchOptions: { method: 'GET' },
      })) as unknown as AnkrAddressWithTxnsResponse

      const page = Math.floor(currentOffset / limit) + 1

      totalTxns = response.txs
      currentOffset += response.transactions.length
      lastBlock =
        response.transactions[response.transactions.length - 1].blockHeight

      const data = {
        transactions: response.transactions.map(AnkrUTXOTxnAdapter),
        total: totalTxns,
        page,
        itemsPerPage: limit,
      }
      yield data

      if (response.transactions.length < limit) {
        break
      }
    } while (currentOffset < totalTxns)
  }

  return {
    result: generator(),
  }
}
