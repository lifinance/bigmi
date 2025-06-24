import type { RpcMethodHandler } from '../types.js'
import type { MempoolTransaction } from './mempool.types.js'

export const getTransactionFee: RpcMethodHandler<'getTransactionFee'> = async (
  client,
  { baseUrl },
  { txId }
) => {
  const apiUrl = `${baseUrl}/tx/${txId}`

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolTransaction

  return {
    result: BigInt(response.fee),
  }
}
