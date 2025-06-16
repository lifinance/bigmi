import type { RpcMethodHandler } from '../types.js'
import type { MempoolTransaction } from './mempool.types.js'
import { mempoolTransactionTransformer } from './utils.js'

export const getTransaction: RpcMethodHandler<'getTransaction'> = async (
  client,
  { baseUrl },
  { txId }
) => {
  const apiUrl = `${baseUrl}/tx/${txId}`

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolTransaction

  const transaction = mempoolTransactionTransformer(response)

  const result = {
    transaction,
  }

  return {
    result,
  }
}
