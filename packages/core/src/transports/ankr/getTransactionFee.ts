import type { RpcMethodHandler } from '../types.js'
import type { AnkrTxnResponse } from './ankr.types.js'

export const getTransactionFee: RpcMethodHandler<'getTransactionFee'> = async (
  client,
  { baseUrl },
  { txId }
) => {
  const apiUrl = `${baseUrl}/tx/${txId}`
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as AnkrTxnResponse
  if (response.error) {
    return { error: response.error }
  }

  return {
    result: BigInt(response.fees),
  }
}
