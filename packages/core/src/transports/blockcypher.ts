import { urlWithApiKey } from '../utils/url.js'
import type { RpcMethods } from './types.js'

type BlockcypherBalanceResponse = {
  address: string
  total_received: number
  total_sent: number
  balance: number
  unconfirmed_balance: number
  final_balance: number
  n_tx: number
  unconfirmed_n_tx: number
  final_n_tx: number
  error?: string
}

type BlockcypherUTXO = {
  tx_hash: string
  block_height: number
  tx_input_n: number
  tx_output_n: number
  value: number
  ref_balance: number
  spent: boolean
  confirmations: number
  confirmed: Date
  double_spend: boolean
}

type BlockcypherUTXOsResponse = BlockcypherBalanceResponse & {
  txrefs: BlockcypherUTXO[]
}

const BLOCKCYPHER_API_KEY_NAME = 'token'

export const blockcypherMethods: RpcMethods = {
  getBalance: async (client, { baseUrl, apiKey }, { address }) => {
    const apiUrl = urlWithApiKey(`${baseUrl}/addrs/${address}`, {
      name: BLOCKCYPHER_API_KEY_NAME,
      value: apiKey,
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
  },
  getUTXOs: async (client, { baseUrl, apiKey }, { address }) => {
    const apiUrl = urlWithApiKey(`${baseUrl}/addrs/${address}`, {
      name: BLOCKCYPHER_API_KEY_NAME,
      value: apiKey,
    })
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as BlockcypherUTXOsResponse
    if (response.error) {
      return {
        error: { code: -1, message: response.error },
      }
    }
    return {
      result: response.txrefs.map((utxo) => ({
        block_height: utxo.block_height,
        isConfirmed: Boolean(utxo.confirmations),
        txid: utxo.tx_hash,
        value: utxo.value,
        vout: utxo.tx_output_n,
      })),
    }
  },
}
