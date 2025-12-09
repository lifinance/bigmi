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

export type BlockchairXpubDashboardAddressResponse =
  BlockchairDashboardAddress & {
    path: string
  }

export type BlockchairXpubData = {
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

export type BlockchairXpubResponse = Record<
  string,
  {
    xpub: BlockchairXpubData
    addresses: Record<string, BlockchairXpubDashboardAddressResponse>
  }
>

export type BlockchairTransactionResponse = BlockchairResponse<
  Record<string, BlockchairTransaction>
>

export type BlockchairTransaction = {
  transaction: {
    block_id: number
    id: number
    hash: string
    date: string
    time: string
    size: number
    weight: number
    version: number
    lock_time: number
    is_coinbase: boolean
    has_witness: boolean
    input_count: number
    output_count: number
    input_total: number
    input_total_usd: number
    output_total: number
    output_total_usd: number
    fee: number
    fee_usd: number
    fee_per_kb: number
    fee_per_kb_usd: number
    fee_per_kwu: number
    fee_per_kwu_usd: number
    cdd_total: number
    is_rbf: boolean
  }
  inputs: Array<BlockchairVin>
  outputs: Array<BlockchairVout>
}

export type BlockchairVin = {
  block_id: number
  transaction_id: number
  index: number
  transaction_hash: string
  date: string
  time: string
  value: number
  value_usd: number
  recipient: string
  type: string
  script_hex: string
  is_from_coinbase: boolean
  is_spendable: boolean | null
  is_spent: boolean
  spending_block_id: number | null
  spending_transaction_id: number | null
  spending_index: number | null
  spending_transaction_hash: string | null
  spending_date: string | null
  spending_time: string | null
  spending_value_usd: number | null
  spending_sequence: number | null
  spending_signature_hex: string | null
  spending_witness: string | null
  lifespan: number | null
  cdd: number | null
}

export type BlockchairVout = BlockchairVin
