import type { WaitForTransactionReceiptParameters } from '../actions/waitForTransaction'
import type { UTXOTransaction } from './transaction'

export type WaitForTransactionReceiptReturnType = UTXOTransaction

export type WithRetryParameters = {
  // The delay (in ms) between retries.
  delay?:
    | ((config: { count: number; error: Error }) => number)
    | number
    | undefined
  // The max number of times to retry.
  retryCount?: number | undefined
}

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

export type SendUTXOTransactionParameters = {
  /** The hex string of the raw transaction. */
  hex: string
  /** Rejects transactions whose fee rate is higher than the specified value, expressed in BTC/kB. Set to 0 to accept any fee rate. Default = 0.10 */
  maxFeeRate?: number
}

export type SendUTXOTransactionReturnType = string

export type WalletActions = {
  /**
   * Creates, signs, and sends a new transaction to the network.
   */
  sendUTXOTransaction: (
    args: SendUTXOTransactionParameters
  ) => Promise<SendUTXOTransactionReturnType>

  signPbst: (args: SignPsbtParameters) => Promise<SignPsbtReturnType>

  waitForTransactionReceipt: (
    args: WaitForTransactionReceiptParameters
  ) => Promise<WaitForTransactionReceiptReturnType>
}
