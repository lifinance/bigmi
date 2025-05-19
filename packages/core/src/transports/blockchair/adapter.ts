import type { UTXO } from '../../types/transaction.js'
import type { BlockchairUTXO } from './blockchair.types.js'

export const blockChairDataAdapters = {
  getUTXOs:
    (scriptHex: string) =>
    (data: BlockchairUTXO): UTXO => ({
      blockHeight: data.block_id,
      scriptHex,
      txId: data.transaction_hash,
      value: data.value,
      vout: data.index,
    }),
}
