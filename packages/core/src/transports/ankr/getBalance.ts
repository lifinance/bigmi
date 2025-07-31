import { RpcErrorCode } from '../../errors/rpc.js'
import type { RpcMethodHandler } from '../types.js'
import type { AnkrBalanceResponse } from './ankr.types.js'

export const getBalance: RpcMethodHandler<'getBalance'> = async (
  client,
  { baseUrl },
  { address }
) => {
  const apiUrl = `${baseUrl}/address/${address}?details=basic`

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: {
      method: 'GET',
    },
  })) as unknown as AnkrBalanceResponse
  if (response.error) {
    return {
      error: { code: RpcErrorCode.MISC_ERROR, message: response.error },
    }
  }
  return {
    result: BigInt(response.balance),
  }
}
