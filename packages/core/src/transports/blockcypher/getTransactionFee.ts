import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type { BlockcypherTransactionReponse } from './blockcypher.types.js'
import { getRpcErrorCode } from './utils.js'

export const getTransactionFee: RpcMethodHandler<'getTransactionFee'> = async (
  client,
  { baseUrl, apiKey },
  { txId }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/txs/${txId}`, {
    token: apiKey,
  })

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as BlockcypherTransactionReponse

  if (response.error) {
    return {
      error: { code: getRpcErrorCode(response.error), message: response.error },
    }
  }

  return {
    result: BigInt(response.fees),
  }
}
