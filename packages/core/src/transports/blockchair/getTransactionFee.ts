import { RpcErrorCode } from '../../errors/rpc.js'
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

  if (
    !response.data[txId] ||
    response.context.error ||
    response.context?.code !== 200
  ) {
    return {
      error: {
        code:
          response.context.code === 429
            ? RpcErrorCode.ACCESS_DENIED
            : RpcErrorCode.MISC_ERROR,
        message: response.context?.error,
      },
    }
  }

  return {
    result: BigInt(response.data[txId].transaction.fee),
  }
}
