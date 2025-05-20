import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  MempoolBalanceResponse,
  MempoolUTXOTransactionsResponse,
} from './mempool.types.js'

export const getTransactions: RpcMethodHandler<'getTransactions'> = async (
  client,
  { baseUrl },
  { address, limit = 50, offset = 0, afterTxId }
) => {
  const apiUrlAddress = `${baseUrl}/address/${address}`
  const balanceResponse = (await client.request({
    url: apiUrlAddress,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolBalanceResponse
  const totalTxns =
    balanceResponse.chain_stats.tx_count +
    balanceResponse.mempool_stats.tx_count

  const apiUrl = urlWithParams(`${baseUrl}/address/${address}/txs`, {
    after_txid: afterTxId,
  })

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as MempoolUTXOTransactionsResponse

  const transactions = response.map((utxo) => ({
    hash: utxo.txid,
    txid: utxo.txid,
    vout: utxo.vout.map((vout, index) => ({
      n: index,
      scriptPubKey: {
        address: vout.scriptpubkey_address,
        asm: vout.scriptpubkey_asm,
        type: vout.scriptpubkey_type,
        desc: vout.scriptpubkey,
        hex: vout.scriptpubkey,
      },
      value: vout.value,
    })),
    vin: utxo.vin.map((vin) => ({
      scriptSig: {
        asm: vin.scriptsig_asm,
        hex: vin.scriptsig,
      },
      sequence: vin.sequence,
      txinwitness: vin.witness,
      txid: vin.txid,
      vout: vin.vout,
    })),
  }))

  const result = {
    transactions,
    total: totalTxns,
    itemsPerPage: limit,
    hasMore: offset + transactions.length < totalTxns,
  }

  return {
    result,
  }
}
