import type { RpcMethodHandler } from '../types.js'
import type { AnkrTxnResponse } from './ankr.types.js'
import { ankrTransactionTransformer } from './utils.js'

export const getTransaction: RpcMethodHandler<'getTransaction'> = async (
  client,
  { baseUrl },
  { txId }
) => {
  const apiUrl = `${baseUrl}/tx-specific/${txId}`
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as AnkrTxnResponse

  if (response.error) {
    return { error: response.error }
  }

  const result = {
    transaction: ankrTransactionTransformer(response),
  }

  return {
    result,
  }
}
