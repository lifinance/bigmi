import type { RpcMethodHandler } from '../types.js'
import type { MempoolBalanceResponse } from './mempool.types.js'

export const getBalance: RpcMethodHandler<'getBalance'> = async (
  client,
  { baseUrl },
  { address }
) => {
  const apiUrl = `${baseUrl}/address/${address}`
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolBalanceResponse
  const balance =
    response.chain_stats.funded_txo_sum - response.chain_stats.spent_txo_sum
  return {
    result: BigInt(balance),
  }
}
