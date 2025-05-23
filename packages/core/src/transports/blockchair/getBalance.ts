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
  if (response.context?.code !== 200) {
    return {
      error: {
        code: response.context?.code,
        message: response.context?.error,
      },
    }
  }
  return {
    result: BigInt(response.data[address]),
  }
}
