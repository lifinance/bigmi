import { RpcErrorCode } from '../../errors/rpc.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  BlockchairAddressBalanceData,
  BlockchairResponse,
} from './blockchair.types.js'

export const getBalance: RpcMethodHandler<'getBalance'> = async (
  client,
  { baseUrl, apiKey },
  { address }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/addresses/balances`, {
    key: apiKey,
    addresses: address,
  })
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as BlockchairResponse<BlockchairAddressBalanceData>

  if (response.context.error || response.context?.code !== 200) {
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

  if (response.data[address] === undefined) {
    return {
      result: 0n,
    }
  }

  return {
    result: BigInt(response.data[address]),
  }
}
