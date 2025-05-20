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
