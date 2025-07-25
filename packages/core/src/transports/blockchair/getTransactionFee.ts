import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type { BlockchairTransactionResponse } from './blockchair.types.js'

export const getTransactionFee: RpcMethodHandler<'getTransactionFee'> = async (
  client,
  { baseUrl, apiKey },
  { txId }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/dashboards/transaction/${txId}`, {
    key: apiKey,
  })
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: {
      method: 'GET',
    },
  })) as unknown as BlockchairTransactionResponse

  if (response.context?.code !== 200) {
    return {
      error: {
        code: response.context?.code,
        message: response.context?.error,
      },
    }
  }

  return {
    result: BigInt(response.data[txId].transaction.fee),
  }
}
