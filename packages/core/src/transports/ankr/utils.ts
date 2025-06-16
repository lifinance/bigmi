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
