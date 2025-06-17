import type { UTXOTransaction } from '../../types/transaction.js'
import type { MempoolTransaction } from './mempool.types.js'

export const mempoolTransactionTransformer = (
  txn: MempoolTransaction
): Partial<UTXOTransaction> => ({
  hash: txn.txid,
  txid: txn.txid,
  vout: txn.vout.map((vout, index) => ({
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
  vin: txn.vin.map((vin) => ({
    scriptSig: {
      asm: vin.scriptsig_asm,
      hex: vin.scriptsig,
    },
    sequence: vin.sequence,
    txinwitness: vin.witness,
    txid: vin.txid,
    vout: vin.vout,
  })),
})
