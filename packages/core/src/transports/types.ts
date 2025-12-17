import type { BlockStats, BlockStatsKeys } from '../types/blockStats.js'
import type { UTXO, UTXOTransaction } from '../types/transaction.js'
import type { xPubAccount } from '../types/xpub.js'
import type { HttpRpcClient } from './getHttpRpcClient.js'

export const UTXOAPISchemaMethods: UTXOMethod[] = [
  'getBalance',
  'getTransactions',
  'getUTXOs',
  'getTransactionFee',
  'getXPubAddresses',
]

export type UTXOAPISchema = [
  {
    Method: 'getBalance'
    Parameters: { address: string }
    ReturnType: bigint
  },
  {
    Method: 'getTransactions'
    Parameters: {
      address: string
      offset?: number
      limit?: number
      lastBlock?: string
      afterTxId?: string
    }
    ReturnType: {
      transactions: Array<Partial<UTXOTransaction>>
      total: number
      hasMore?: boolean
    }
  },
  {
    Method: 'getTransactionFee'
    Parameters: {
      txId: string
    }
    ReturnType: bigint
  },
  {
    Method: 'getUTXOs'
    Parameters: {
      address: string
      minValue?: number
    }
    ReturnType: Array<UTXO>
  },
  {
    Method: 'getXPubAddresses'
    Parameters: {
      xPubKey: string
    }
    ReturnType: xPubAccount
  },
]

export type UTXOSchema = [
  {
    Method: 'getblockcount'
    Parameters: []
    ReturnType: number
  },
  {
    Method: 'getblockhash'
    Parameters: [number]
    ReturnType: string
  },
  {
    Method: 'getblock'
    Parameters: [string, number]
    ReturnType: string
  },
  {
    Method: 'getblockstats'
    Parameters: [string | number, Array<BlockStatsKeys>?]
    ReturnType: BlockStats
  },
  {
    Method: 'sendrawtransaction'
    Parameters: [string, number?]
    ReturnType: string
  },
  {
    Method: 'getrawtransaction'
    Parameters: [string, boolean, string?]
    ReturnType: UTXOTransaction
  },
  ...UTXOAPISchema,
]

export type UTXOMethod = UTXOSchema[number]['Method']

export type SignPsbtParameters = {
  /** The PSBT encoded as a hexadecimal string */
  psbt: string
  /**
   * Array of objects specifying details about the inputs to be signed
   */
  inputsToSign: {
    /**
     * The SigHash type to use for signing (e.g., SIGHASH_ALL).
     * If not specified, a default value is used.
     */
    sigHash?: number
    /** The Bitcoin address associated with the input that will be signed */
    address: string
    /** An array of indexes in the PSBT corresponding to the inputs that need to be signed */
    signingIndexes: number[]
  }[]
  /**
   * Whether to finalize the PSBT after signing.
   * If `true`, the PSBT will be completed and ready for broadcasting.
   * If `false` or omitted, the PSBT remains partially signed.
   * Some wallets does not support it.
   */
  finalize?: boolean
}

export type SignPsbtReturnType = string

export type UTXOWalletSchema = readonly [
  {
    Method: 'signPsbt'
    Parameters: SignPsbtParameters
    ReturnType: SignPsbtReturnType
  },
]

export type SuccessResult<result> = {
  method?: undefined
  result: result
  error?: undefined
}
export type ErrorResult<error> = {
  method?: undefined
  result?: undefined
  error: error
}

export type RpcResponse<result = any, error = any> =
  | SuccessResult<result>
  | ErrorResult<error>

export type RpcMethodHandler<M extends UTXOMethod = UTXOMethod> = (
  client: HttpRpcClient,
  config: { baseUrl: string; apiKey?: string },
  params: Extract<UTXOSchema[number], { Method: M }>['Parameters']
) => Promise<
  RpcResponse<Extract<UTXOSchema[number], { Method: M }>['ReturnType']>
>

export type RpcMethods = {
  [key in UTXOMethod]?: RpcMethodHandler<key>
}
