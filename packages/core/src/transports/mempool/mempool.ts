import type { RpcMethods } from '../types.js'

type MempoolBalanceResponse = {
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

type MempoolVin = {
  txid: string
  vout: number
  prevout: MempoolVout
  scriptsig: string
  scriptsig_asm: string
  witness: string[]
  is_coinbase: boolean
  sequence: number
}

type MempoolVout = {
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_type: string
  scriptpubkey_address: string
  value: number
}

type MempoolUTXOResponse = {
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

type MempoolUTXOTransactionsResponse = {
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
}[]

export const mempoolMethods: RpcMethods = {
  getBalance: async (client, { baseUrl }, { address }) => {
    const apiUrl = `${baseUrl}/address/${address}`
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as MempoolBalanceResponse
    const balance =
      response.chain_stats.funded_txo_sum - response.chain_stats.spent_txo_sum
    return {
      result: BigInt(balance),
    }
  },
  getTransactions: async (
    client,
    { baseUrl },
    { address, limit = 50, offset = 0 }
  ) => {
    async function* generator() {
      const apiUrlAddress = `${baseUrl}/address/${address}`
      const balanceResponse = (await client.request({
        url: apiUrlAddress,
        fetchOptions: { method: 'GET' },
      })) as unknown as MempoolBalanceResponse
      const totalTxns =
        balanceResponse.chain_stats.tx_count +
        balanceResponse.mempool_stats.tx_count
      let currentOffset = offset
      let after_txid: string | undefined = undefined
      while (currentOffset < totalTxns) {
        const page = Math.floor(currentOffset / limit) + 1
        const apiUrl = `${baseUrl}/address/${address}/txs${after_txid ? `?after_txid=${after_txid}` : ''}`

        const response = (await client.request({
          url: apiUrl,
          fetchOptions: { method: 'GET' },
        })) as unknown as MempoolUTXOTransactionsResponse

        const transactions = response.map((utxo) => ({
          hash: utxo.txid,
          txid: utxo.txid,
          vout: utxo.vout.map((vout, index) => ({
            n: index,
            scriptPubKey: {
              address: vout.scriptpubkey_address,
              asm: vout.scriptpubkey_asm,
              type: vout.scriptpubkey_type,
              desc: vout.scriptpubkey,
              hex: vout.scriptpubkey,
            },
            value: vout.value,
          })),
          vin: utxo.vin.map((vin) => ({
            scriptSig: {
              asm: vin.scriptsig_asm,
              hex: vin.scriptsig,
            },
            sequence: vin.sequence,
            txinwitness: vin.witness,
            txid: vin.txid,
            vout: vin.vout,
          })),
        }))

        yield {
          transactions,
          total: totalTxns,
          page,
          itemsPerPage: limit,
        }

        currentOffset += response.length
        after_txid = response[response.length - 1]?.txid
        if (response.length < limit) {
          break
        }
      }
    }

    return {
      result: generator(),
    }
  },
  getUTXOs: async (client, { baseUrl }, { address }) => {
    const apiUrl = `${baseUrl}/address/${address}/utxo`
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as MempoolUTXOResponse

    return {
      result: response.map((utxo) => ({
        blockHeight: utxo.status.block_height,
        isConfirmed: Boolean(utxo.status.confirmed),
        txId: utxo.txid,
        value: utxo.value,
        vout: utxo.vout,
        scriptHex: '',
      })),
    }
  },
}
