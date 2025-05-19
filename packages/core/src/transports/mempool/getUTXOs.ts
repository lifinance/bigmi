import type { RpcMethodHandler } from '../types.js'
import type { MempoolUTXOResponse } from './mempool.types.js'

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl },
  { address }
) => {
  const apiUrl = `${baseUrl}/address/${address}/utxo`
  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolUTXOResponse

  return {
    result: response.map((utxo) => ({
      blockHeight: utxo.status.block_height,
      isConfirmed: Boolean(utxo.status.confirmed),
      txId: utxo.txid,
      value: utxo.value,
      vout: utxo.vout,
      scriptHex: '',
    })),
  }
}
