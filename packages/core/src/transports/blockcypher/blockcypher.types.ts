export type BlockcypherErrorResponse = {
  error: string
}

export type BlockcypherBalanceResponse = {
  address: string
  total_received: number
  total_sent: number
  balance: number
  unconfirmed_balance: number
  final_balance: number
  n_tx: number
  unconfirmed_n_tx: number
  final_n_tx: number
  error?: string
  hasMore?: boolean
}

export type BlockcypherUTXO = {
  tx_hash: string
  block_height: number
  tx_input_n: number
  tx_output_n: number
  value: number
  ref_balance: number
  spent: boolean
  confirmations: number
  confirmed: string
  double_spend: boolean
  script: string
}

export type BlockcypherUTXOsResponse = BlockcypherBalanceResponse & {
  txrefs: BlockcypherUTXO[]
}

export type BlockcypherTransactionInput = {
  prev_hash: string
  output_index: number
  script: string
  output_value: number
  sequence: number
  addresses: string[]
  script_type: string
}

export type BlockcypherTransactionOutput = {
  value: number
  script: string
  spent_by: string
  addresses: string[]
  script_type: string
}

export type BlockcypherTransaction = {
  block_hash: string
  block_height: number
  hash: string
  addresses: string[]
  total: number
  fees: number
  size: number
  vsize: number
  preference: string
  relayed_by: string
  confirmed: string
  received: string
  ver: number
  lock_time: number
  double_spend: boolean
  vin_sz: number
  vout_sz: number
  confirmations: number
  inputs: BlockcypherTransactionInput[]
  outputs: BlockcypherTransactionOutput[]
}

export type BlockcypherTransactionReponse = BlockcypherTransaction & {
  error?: string
}
