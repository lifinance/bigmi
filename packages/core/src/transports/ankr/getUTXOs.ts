import type { RpcMethodHandler } from '../types.js'
import type { AnkrUTXOResponse } from './ankr.types.js'

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl },
  { address }
) => {
  const apiUrl = `${baseUrl}/utxo/${address}`
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as AnkrUTXOResponse

  return {
    result: response.map((utxo) => ({
      blockHeight: utxo.height,
      confirmations: utxo.confirmations,
      isConfirmed: Boolean(utxo.confirmations),
      txId: utxo.txid,
      value: Number(utxo.value),
      vout: Number(utxo.vout),
      scriptHex: '',
    })),
  }
}
