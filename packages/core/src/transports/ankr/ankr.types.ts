export type AnkrBalanceResponse = {
  address: string
  balance: string
  totalReceived: string
  totalSent: string
  unconfirmedBalance: string
  unconfirmedTxs: number
  txs: number
  error: string
}

export type AnkrUTXOResponse = {
  txid: string
  vout: number
  value: string
  height: number
  confirmations: number
  coinbase: boolean
}[]

export type AnkrVin = {
  txid: string
  vout: number
  sequence: number
  n: number
  addresses: string[]
  isAddress: boolean
  isOwn: boolean
  value: string
  scriptSig?: {
    asm: string
    hex: string
  }
}

export type AnkrVout = {
  value: number
  n: number
  spent: boolean
  spentTxId: string
  spentIndex: number
  spentHeight: number
  hex: string
  addresses: string[]
  isAddress: boolean
  scriptPubKey: {
    address?: string
    asm: string
    desc: string
    hex: string
    type: string
  }
}

export type AnkrTransaction = {
  txid: string
  version: number
  vin: AnkrVin[]
  vout: AnkrVout[]
  blockHash?: string
  blockHeight: number
  confirmations: number
  blockTime: number
  size: number
  vsize: number
  value: string
  valueIn: string
  fees: string
  hex: string
  weight: number
  coinSpecificData?: {
    hash: string
    hex: string
    locktime: number
    size: number
    txid: string
    version: number
  }
}

export type AnkrAddressWithTxnsResponse = {
  transactions: AnkrTransaction[]
} & AnkrBalanceResponse

export type AnkrTxnResponse = {
  error?: string
} & AnkrTransaction
