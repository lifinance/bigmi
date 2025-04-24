import type {
  SendUTXOTransactionParameters,
  SendUTXOTransactionReturnType,
} from '../actions/sendUTXOTransaction'

import type { WaitForTransactionReceiptParameters } from '../actions/waitForTransaction'
import type {
  SignPsbtParameters,
  SignPsbtReturnType,
} from '../transports/types'
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
