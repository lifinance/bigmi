import type { RpcMethods } from './types.js'

type AnkrBalanceResponse = {
  address: string
  balance: string
  totalReceived: string
  totalSent: string
  unconfirmedBalance: string
  unconfirmedTxs: number
  txs: number
  error: string
}

type AnkrUTXOResponse = {
  txid: string
  vout: number
  value: string
  height: number
  confirmations: number
  coinbase: boolean
}[]

export const ankrMethods: RpcMethods = {
  getBalance: async (client, { baseUrl }, { address }) => {
    const apiUrl = `${baseUrl}/address/${address}?details=basic`

    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as AnkrBalanceResponse
    if (response.error) {
      return {
        error: { code: -1, message: response.error },
      }
    }
    return {
      result: BigInt(response.balance),
    }
  },
  getUTXOs: async (client, { baseUrl }, { address }) => {
    const apiUrl = `${baseUrl}/utxo/${address}`
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as AnkrUTXOResponse

    return {
      result: response.map((utxo) => ({
        block_height: utxo.height,
        isConfirmed: Boolean(utxo.confirmations),
        txid: utxo.txid,
        value: Number(utxo.value),
        vout: Number(utxo.vout),
      })),
    }
  },
}
