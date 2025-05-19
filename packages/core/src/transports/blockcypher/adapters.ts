import type { UTXO } from '../../types/transaction.js'
import type { BlockcypherUTXO } from './blockcypher.types.js'

export const blockcypherDataAdapters = {
  getUTXOs: (utxo: BlockcypherUTXO): UTXO => ({
    blockHeight: utxo.block_height,
    isConfirmed: Boolean(utxo.confirmations),
    confirmations: utxo.confirmations,
    value: utxo.value,
    vout: utxo.tx_output_n,
    txId: utxo.tx_hash,
    scriptHex: utxo.script,
  }),
}
