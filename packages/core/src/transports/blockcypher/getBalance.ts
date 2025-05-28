import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type { BlockcypherBalanceResponse } from './blockcypher.types.js'

export const getBalance: RpcMethodHandler<'getBalance'> = async (
  client,
  { baseUrl, apiKey },
  { address }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/addrs/${address}`, {
    token: apiKey,
  })
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as BlockcypherBalanceResponse
  if (response.error) {
    return {
      error: { code: -1, message: response.error },
    }
  }
  return {
    result: BigInt(response.balance),
  }
}
