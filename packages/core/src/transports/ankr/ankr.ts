import type { UTXOTransaction } from '../../types/transaction.js'
import type { RpcMethods } from '../types.js'

type AnkrBalanceResponse = {
  address: string
  balance: string
  totalReceived: string
  totalSent: string
  unconfirmedBalance: string
  unconfirmedTxs: number
  txs: number
  error: string
}

type AnkrUTXOResponse = {
  txid: string
  vout: number
  value: string
  height: number
  confirmations: number
  coinbase: boolean
}[]

type AnkrVin = {
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

type AnkrVout = {
  value: number
  n: number
  spent: boolean
  spentTxId: string
  spentIndex: number
  spentHeight: number
  hex: string
  addresses: string[]
  isAddress: boolean
  scriptPubKey?: {
    address: string
    asm: string
    desc: string
    hex: string
    type: string
  }
}

type AnkrTransaction = {
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
  coinSpecificData?: {
    hash: string
    hex: string
    locktime: number
    size: number
    txid: string
    version: number
  }
}

type AnkrAddressWithTxnsResponse = {
  transactions: AnkrTransaction[]
} & AnkrBalanceResponse

const AnkrUTXOTxnAdapter = (
  txn: AnkrTransaction
): Partial<UTXOTransaction> => ({
  blockhash: txn?.blockHash,
  blocktime: txn.blockTime,
  confirmations: txn.confirmations,
  hex: txn.hex,
  locktime: txn?.coinSpecificData?.locktime,
  hash: txn.coinSpecificData?.hash,
  size: txn.size,
  txid: txn.txid,
  version: txn.version,
  vin: txn.vin.map((vin) => ({
    scriptSig: vin.scriptSig,
    sequence: vin.sequence,
    txid: vin.txid,
    vout: vin.vout,
    txinwitness: vin.addresses,
  })),
  vsize: txn.vsize,
  vout: txn.vout.map((vout) => ({
    n: vout.n,
    scriptPubKey: vout.scriptPubKey,
    value: vout.value,
  })),
})

export const ankrMethods: RpcMethods = {
  getBalance: async (client, { baseUrl }, { address }) => {
    const apiUrl = `${baseUrl}/address/${address}?details=basic`

    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as AnkrBalanceResponse
    if (response.error) {
      return {
        error: { code: -1, message: response.error },
      }
    }
    return {
      result: BigInt(response.balance),
    }
  },
  getUTXOs: async (client, { baseUrl }, { address }) => {
    const apiUrl = `${baseUrl}/utxo/${address}`
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as AnkrUTXOResponse

    return {
      result: response.map((utxo) => ({
        blockHeight: utxo.height,
        confirmations: utxo.confirmations,
        isConfirmed: Boolean(utxo.confirmations),
        txId: utxo.txid,
        value: Number(utxo.value),
        vout: Number(utxo.vout),
        scriptHex: '',
      })),
    }
  },
  getTransactions: async (
    client,
    { baseUrl },
    { address, limit = 100, offset = 0 }
  ) => {
    async function* generator() {
      let totalTxns = 0
      let currentOffset = offset
      let lastBlock = undefined

      do {
        const apiUrl = `${baseUrl}/address/${address}?details=txs&pageSize=${limit}${lastBlock ? `&to=${lastBlock}` : ''}`
        const response = (await client.request({
          url: apiUrl,
          fetchOptions: { method: 'GET' },
        })) as unknown as AnkrAddressWithTxnsResponse

        const page = Math.floor(currentOffset / limit) + 1

        totalTxns = response.txs
        currentOffset += response.transactions.length
        lastBlock =
          response.transactions[response.transactions.length - 1].blockHeight

        const data = {
          transactions: response.transactions.map(AnkrUTXOTxnAdapter),
          total: totalTxns,
          page,
          itemsPerPage: limit,
        }
        yield data

        if (response.transactions.length < limit) {
          break
        }
      } while (currentOffset < totalTxns)
    }

    return {
      result: generator(),
    }
  },
}
