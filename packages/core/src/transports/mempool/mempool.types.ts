export type MempoolBalanceResponse = {
  address: string
  chain_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
  mempool_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
}

export type MempoolVin = {
  txid: string
  vout: number
  prevout: MempoolVout
  scriptsig: string
  scriptsig_asm: string
  witness: string[]
  is_coinbase: boolean
  sequence: number
}

export type MempoolVout = {
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_type: string
  scriptpubkey_address: string
  value: number
}

export type MempoolUTXOResponse = {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
  value: number
}[]

export type MempoolTransaction = {
  txid: string
  version: number
  locktime: number
  vin: MempoolVin[]
  vout: MempoolVout[]
  size: number
  weight: number
  fee: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
}

export type MempoolUTXOTransactionsResponse = Array<MempoolTransaction>

export type MempoolErrorResponse = string
