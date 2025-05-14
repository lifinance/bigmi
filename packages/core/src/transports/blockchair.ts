import type { RpcMethods } from './types.js'

type BlockchairUTXO = {
  block_id: number
  transaction_id: number
  index: number
  transaction_hash: string
  date: string
  time: string
  value: number
  value_usd: number
  recipient: string
  type: string
  script_hex: string
  is_from_coinbase: boolean
  is_spendable: boolean | null
  is_spent: boolean
  lifespan: number
  cdd: number
}

type BlockchairAddressData<T = any> = Record<string, T>

type BlockchairResponse<T = any> = {
  data: T
  context: { code: number; error: string }
}

const withAPIKey = (url: string, apiKey?: string) =>
  apiKey ? `${url}&key=${apiKey}` : url

export const blockchairMethods: RpcMethods = {
  getBalance: async (client, { baseUrl, apiKey }, { address }) => {
    const apiUrl = withAPIKey(
      `${baseUrl}/addresses/balances/?addresses=${address}`,
      apiKey
    )
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as BlockchairResponse<BlockchairAddressData>
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
  },
  getUTXOs: async (client, { baseUrl, apiKey }, { address }) => {
    const apiUrl = withAPIKey(
      `${baseUrl}/outputs?q=is_spent(false)&recipient(${address})`,
      apiKey
    )
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as BlockchairResponse<BlockchairUTXO[]>
    if (response.context?.code !== 200) {
      return {
        error: {
          code: response.context?.code,
          message: response.context?.error,
        },
      }
    }
    return {
      result: response.data.map((utxo) => ({
        txid: utxo.transaction_hash,
        value: utxo.value,
        block_height: utxo.block_id,
        vout: utxo.index,
        isConfirmed: true,
      })),
    }
  },
}
