export type BlockchairUTXO = {
  block_id: number
  transaction_hash: string
  index: number
  value: number
  address: string
}

export type BlockChairDashboardAddressResponse = {
  set: BlockChairDashboardSet
  addresses: Record<string, BlockchairDashboardAddress>
  transactions: Array<string>
  utxo: Array<BlockchairUTXO>
}

export type BlockChairDashboardSet = {
  address_count: number
  balance: number
  balance_usd: number
  received: number
  spent: number
  output_count: number
  unspent_output_count: number
  first_seen_receiving: string
  last_seen_receiving: string
  first_seen_spending: string
  last_seen_spending: string
  transaction_count: number
}

export type BlockchairDashboardAddress = {
  type: string
  script_hex: string
  balance: number
  balance_usd: number
  received: number
  received_usd: number
  spent: number
  spent_usd: number
  output_count: number
  unspent_output_count: number
  first_seen_receiving: string
  last_seen_receiving: string
  first_seen_spending: string
  last_seen_spending: string
}

export type BlockchairAddressBalanceData<T = any> = Record<string, T>

export type BlockchairResponse<T = any> = {
  data: T
  context: {
    code: number
    error?: string
    limit?: number | string
    offset?: number | string
    total_rows?: number
  }
}
