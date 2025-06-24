import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  MempoolBalanceResponse,
  MempoolUTXOTransactionsResponse,
} from './mempool.types.js'
import { mempoolTransactionTransformer } from './utils.js'

export const getTransactions: RpcMethodHandler<'getTransactions'> = async (
  client,
  { baseUrl },
  { address, limit = 50, offset = 0, afterTxId }
) => {
  const apiUrlAddress = `${baseUrl}/address/${address}`
  const balanceResponse = (await client.request({
    url: apiUrlAddress,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolBalanceResponse
  const totalTxns =
    balanceResponse.chain_stats.tx_count +
    balanceResponse.mempool_stats.tx_count

  const apiUrl = urlWithParams(`${baseUrl}/address/${address}/txs`, {
    after_txid: afterTxId,
  })

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolUTXOTransactionsResponse

  const transactions = response.map(mempoolTransactionTransformer)

  const result = {
    transactions,
    total: totalTxns,
    itemsPerPage: limit,
    hasMore: offset + transactions.length < totalTxns,
  }

  return {
    result,
  }
}
