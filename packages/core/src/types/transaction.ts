export type UTXOTransaction = {
  blockhash?: string
  blocktime?: number
  confirmations?: number
  hash: string
  hex: string
  in_active_chain?: boolean
  locktime: number
  size: number
  time?: number
  txid: string
  version: number
  vsize: number
  weight: number
  vin: (
    | {
        coinbase: string
        sequence: number
        txinwitness?: string[]
      }
    | {
        txid: string
        vout: number
        scriptSig?: {
          asm: string
          hex: string
        }
        sequence: number
        txinwitness?: string[]
      }
  )[]
  vout: {
    n: number
    value: number
    scriptPubKey: {
      address?: string
      asm: string
      desc: string
      hex: string
      type: string
    }
  }[]
}

export type UTXO = {
  txId: string
  vout: number
  value: number
  isConfirmed?: boolean
  confirmations?: number
  blockHeight: number
  scriptHex: string
}
