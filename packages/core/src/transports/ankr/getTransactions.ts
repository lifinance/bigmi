import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type { AnkrAddressWithTxnsResponse } from './ankr.types.js'

import type { UTXOTransaction } from '../../types/transaction.js'
import type { AnkrTransaction } from './ankr.types.js'

export const ankrTransactionTransformer = (
  txn: AnkrTransaction
): Partial<UTXOTransaction> => ({
  blockhash: txn?.blockHash,
  blocktime: txn.blockTime,
  confirmations: txn.confirmations,
  hex: txn.hex,
  locktime: txn?.coinSpecificData?.locktime,
  hash: txn.coinSpecificData?.hash,
  size: txn.size,
  txid: txn.txid,
  version: txn.version,
  vin: txn.vin.map((vin) => ({
    scriptSig: vin.scriptSig,
    sequence: vin.sequence,
    txid: vin.txid,
    vout: vin.vout,
    txinwitness: vin.addresses,
  })),
  vsize: txn.vsize,
  vout: txn.vout.map((vout) => ({
    n: vout.n,
    scriptPubKey: vout.scriptPubKey,
    value: vout.value,
  })),
})

export const getTransactions: RpcMethodHandler<'getTransactions'> = async (
  client,
  { baseUrl },
  { address, limit = 50, offset = 0, lastBlock }
) => {
  const apiUrl = urlWithParams(`${baseUrl}/address/${address}`, {
    details: 'txs',
    pageSize: limit,
    to: lastBlock,
  })

  const response = (await client.request({
    url: apiUrl,
    fetchOptions: { method: 'GET' },
  })) as unknown as AnkrAddressWithTxnsResponse

  if (response.error) {
    return { error: response.error }
  }

  const total = response.txs || 0
  const page = Math.floor(offset / limit) + 1
  const hasMore = total > offset + response.transactions.length

  const data = {
    transactions: response.transactions.map(ankrTransactionTransformer),
    total,
    page,
    itemsPerPage: limit,
    hasMore,
  }

  return { result: data }
}
