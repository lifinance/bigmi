import { RpcErrorCode } from '../../errors/rpc.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  BlockchairResponse,
  BlockchairXpubResponse,
} from './blockchair.types.js'

export const getXPubAddresses: RpcMethodHandler<'getXPubAddresses'> = async (
  client,
  { baseUrl, apiKey },
  { xPubKey }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/dashboards/xpub/${xPubKey}`, {
    key: apiKey,
  })
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as BlockchairResponse<BlockchairXpubResponse>

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

  if (response.data[xPubKey] === undefined) {
    return {
      result: {
        balance: 0n,
        addresses: [],
      },
    }
  }

  const xpubData = response.data[xPubKey]

  const result = {
    balance: BigInt(xpubData.xpub.balance),
    addresses: Object.entries(xpubData.addresses).map(([address, data]) => ({
      address,
      balance: BigInt(data.balance),
      path: data.path,
      scriptHex: data.script_hex,
    })),
  }

  return {
    result,
  }
}
