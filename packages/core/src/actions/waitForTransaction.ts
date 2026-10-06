import { address, Transaction } from 'bitcoinjs-lib'
import {
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from '../errors/transaction.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { UTXOTransaction } from '../types/transaction.js'
import type { Transport } from '../types/transport.js'
import { getAction } from '../utils/getAction.js'
import { observe } from '../utils/observe.js'
import { stringify } from '../utils/stringify.js'
import { withRetry } from '../utils/withRetry.js'
import { getBlock } from './getBlock.js'
import { getBlockStats } from './getBlockStats.js'
import { getUTXOTransaction } from './getUTXOTransaction.js'
import { watchBlockNumber } from './watchBlockNumber.js'

export type ReplacementReason = 'cancelled' | 'replaced' | 'repriced'
export type ReplacementReturnType = {
  reason: ReplacementReason
  replacedTransaction: Transaction
  transaction: UTXOTransaction
}

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

export type WaitForTransactionReceiptParameters = {
  /** The Id of the transaction. */
  txId: string
  /** The hex string of the raw transaction. */
  txHex: string
  /** The sender address of the transaction. */
  senderAddress?: string
  /**
   * The number of confirmations (blocks that have passed) to wait before resolving.
   * @default 1
   */
  confirmations?: number | undefined
  /** Optional callback to emit if the transaction has been replaced. */
  onReplaced?: ((response: ReplacementReturnType) => void) | undefined
  /**
   * Polling frequency (in ms). Defaults to the client's pollingInterval config.
   * @default client.pollingInterval
   */
  pollingInterval?: number | undefined
  /**
   * Number of times to retry if the transaction or block is not found.
   * @default 6 (exponential backoff)
   */
  retryCount?: number
  /**
   * Time to wait (in ms) between retries.
   */
  retryDelay?: ((config: { count: number; error: Error }) => number) | number
  /** Optional timeout (in milliseconds) to wait before stopping polling. */
  timeout?: number | undefined
}

/**
 * Waits for the transaction to be included on a block (one confirmation), and then returns the transaction.
 * - JSON-RPC Methods:
 * - Polls getrawtransaction on each block until it has been processed.
 * - If a transaction has been replaced:
 * - Calls getblock and extracts the transactions
 * - Checks if one of the transactions is a replacement
 * - If so, calls getrawtransaction.
 *
 * The `waitForTransaction` action additionally supports replacement detection (e.g. RBF - transactions replaced-by-fee ).
 *
 * Transactions can be replaced when a user modifies their transaction in their wallet (to speed up or cancel).
 * https://bitcoinops.org/en/topics/replace-by-fee/
 *
 * There are 3 types of Transaction Replacement reasons:
 *
 * - `repriced`: The fee has been modified (e.g. same outputs, different amounts)
 * - `cancelled`: The Transaction has been cancelled (e.g. output is sender address)
 * - `replaced`: The Transaction has been replaced (e.g. different outputs)
 * @param client - Client to use
 * @param parameters - {@link WaitForTransactionReceiptParameters}
 * @returns The UTXO transaction. {@link WaitForTransactionReceiptReturnType}
 */
export async function waitForTransaction<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  {
    confirmations = 1,
    txId,
    txHex,
    senderAddress,
    onReplaced,
    pollingInterval = client.pollingInterval,
    retryCount = 10,
    retryDelay = 3_000,
    timeout,
  }: WaitForTransactionReceiptParameters
): Promise<WaitForTransactionReceiptReturnType> {
  const observerId = stringify([
    'waitForTransaction',
    client.uid,
    txId,
    // The first wait's closure decides how every wait on its observer
    // confirms, polls, retries and labels a replacement, so only waits with
    // the same options share one. A `retryDelay` function cannot be compared
    // and is left out. Each wait owns its `timeout`, so it is left out too.
    {
      confirmations,
      pollingInterval,
      retryCount,
      retryDelay: typeof retryDelay === 'number' ? retryDelay : undefined,
      senderAddress,
    },
  ])

  let count = 0
  let transaction: UTXOTransaction | undefined
  let replacedTransaction: Transaction | undefined
  let retrying = false

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    // Every way a wait settles goes through here: it clears its own timer and
    // removes only its own listener. When the last wait leaves, `observe` runs
    // the cleanup returned below, which unwatches the shared block watcher.
    const settle = (fn: () => void) => {
      clearTimeout(timer)
      _unobserve()
      fn()
    }

    const _unobserve = observe(
      observerId,
      {
        onReplaced,
        resolve: (transaction: WaitForTransactionReceiptReturnType) =>
          settle(() => resolve(transaction)),
        reject: (error: unknown) => settle(() => reject(error)),
      },
      (emit) => {
        // Settles the waits at most once. A callback that is still in flight
        // must not emit a second time.
        let finished = false
        const done = (fn: () => void) => {
          if (finished) {
            return
          }
          finished = true
          try {
            fn()
          } catch (error) {
            // A throwing `onReplaced` still settles the wait.
            emit.reject(error)
          }
        }

        const _unwatch = getAction(
          client,
          watchBlockNumber,
          'watchBlockNumber'
        )({
          emitMissed: true,
          emitOnBegin: true,
          pollingInterval,
          async onBlockNumber(blockNumber_) {
            let blockNumber = blockNumber_

            if (retrying) {
              return
            }
            if (count > retryCount) {
              done(() =>
                emit.reject(
                  new WaitForTransactionReceiptTimeoutError({
                    hash: txId as never,
                  })
                )
              )
              return
            }

            try {
              // If we already have a valid receipt, let's check if we have enough
              // confirmations. If we do, then we can resolve.
              if (transaction?.blockhash) {
                const blockStats = await getAction(
                  client,
                  getBlockStats,
                  'getBlockStats'
                )({
                  blockHash: transaction.blockhash,
                  stats: ['height'],
                })
                if (
                  confirmations > 1 &&
                  (!blockStats.height ||
                    blockNumber - blockStats.height + 1 < confirmations)
                ) {
                  return
                }
                done(() => emit.resolve(transaction!))
                return
              }

              // Get the transaction to check if it's been replaced.
              // We need to retry as some RPC Providers may be slow to sync
              // up mined transactions.
              retrying = true
              transaction = await withRetry(
                () =>
                  getAction(
                    client,
                    getUTXOTransaction,
                    'getUTXOTransaction'
                    // If transaction exists it might be the replaced one with different txId
                  )({ txId: transaction?.txid || txId }),
                {
                  delay: retryDelay,
                  retryCount,
                }
              )
              if (transaction.blockhash) {
                const blockStats = await getAction(
                  client,
                  getBlockStats,
                  'getBlockStats'
                )({
                  blockHash: transaction.blockhash,
                  stats: ['height'],
                })
                if (blockStats.height) {
                  blockNumber = blockStats.height
                }
              }
              retrying = false

              // Check if transaction has been processed.
              if (!transaction?.confirmations) {
                throw new TransactionReceiptNotFoundError({
                  hash: txId as never,
                })
              }

              // Check if we have enough confirmations. If not, continue polling.
              if (transaction.confirmations < confirmations) {
                return
              }

              done(() => emit.resolve(transaction!))
            } catch (err) {
              // If the receipt is not found, the transaction will be pending.
              // We need to check if it has potentially been replaced.
              if (
                err instanceof TransactionNotFoundError ||
                err instanceof TransactionReceiptNotFoundError
              ) {
                try {
                  replacedTransaction = Transaction.fromHex(
                    transaction?.hex || txHex
                  )

                  // Let's retrieve the transactions from the current block.
                  // We need to retry as some RPC Providers may be slow to sync
                  // up mined blocks.
                  retrying = true
                  const block = await withRetry(
                    () =>
                      getAction(
                        client,
                        getBlock,
                        'getBlock'
                      )({
                        blockNumber,
                      }),
                    {
                      delay: retryDelay,
                      retryCount,
                      // shouldRetry: ({ error }) =>
                      //   error instanceof BlockNotFoundError,
                    }
                  )
                  retrying = false

                  // Create a set of input identifiers for mempool transaction
                  const replacedTransactionInputs = new Set<string>()

                  for (const input of replacedTransaction.ins) {
                    const txid = Array.from(input.hash)
                      .reverse()
                      .map((byte) => `00${byte.toString(16)}`.slice(-2))
                      .join('')
                    const vout = input.index
                    const inputId = `${txid}:${vout}`
                    replacedTransactionInputs.add(inputId)
                  }

                  let replacementTransaction: Transaction | undefined

                  for (const tx of block.transactions!) {
                    if (tx.isCoinbase()) {
                      continue
                    }

                    // Check if any input of this transaction matches an input of mempool transaction
                    for (const input of tx.ins) {
                      const txid = Array.from(input.hash)
                        .reverse()
                        .map((byte) => `00${byte.toString(16)}`.slice(-2))
                        .join('')
                      const vout = input.index
                      const inputId = `${txid}:${vout}`
                      if (replacedTransactionInputs.has(inputId)) {
                        replacementTransaction = tx
                        break
                      }
                    }
                    if (replacementTransaction) {
                      break
                    }
                  }

                  // If we couldn't find a replacement transaction, continue polling.
                  if (!replacementTransaction) {
                    return
                  }

                  // If we found a replacement transaction, return it's receipt.
                  transaction = await getAction(
                    client,
                    getUTXOTransaction,
                    'getUTXOTransaction'
                  )({
                    txId: replacementTransaction.getId(),
                  })

                  // Check if we have enough confirmations. If not, continue polling.
                  if (
                    transaction.confirmations &&
                    transaction.confirmations < confirmations
                  ) {
                    return
                  }

                  let reason: ReplacementReason = 'replaced'

                  // Function to get output addresses
                  function getOutputAddresses(tx: Transaction): string[] {
                    const addresses: string[] = []
                    for (const output of tx.outs) {
                      try {
                        const outputAddress = address.fromOutputScript(
                          output.script
                        )
                        addresses.push(outputAddress)
                      } catch (_e) {
                        // Handle non-standard scripts (e.g., OP_RETURN)
                      }
                    }
                    return addresses
                  }

                  // Get the recipient addresses from the original transaction
                  const originalOutputAddresses =
                    getOutputAddresses(replacedTransaction)

                  // Get the recipient addresses from the replacement transaction
                  const replacementOutputAddresses = getOutputAddresses(
                    replacementTransaction
                  )

                  if (
                    originalOutputAddresses.length ===
                      replacementOutputAddresses.length &&
                    originalOutputAddresses.every((address) =>
                      replacementOutputAddresses.includes(address)
                    )
                  ) {
                    reason = 'repriced'
                  } else if (
                    senderAddress &&
                    replacementOutputAddresses.length === 1 &&
                    replacementOutputAddresses.includes(senderAddress)
                  ) {
                    reason = 'cancelled'
                  }

                  done(() => {
                    emit.onReplaced?.({
                      reason,
                      replacedTransaction: replacedTransaction!,
                      transaction: transaction!,
                    })
                    emit.resolve(transaction!)
                  })
                } catch (err_) {
                  done(() => emit.reject(err_))
                }
              } else {
                done(() => emit.reject(err))
              }
            } finally {
              count++
            }
          },
        })

        // `observe` runs this when the last wait on this observer leaves. It
        // also ends this observer: a callback that is still in flight must
        // not emit to a newer wait that starts a new observer on the same id.
        return () => {
          finished = true
          _unwatch()
        }
      }
    )

    if (timeout) {
      timer = setTimeout(
        () =>
          settle(() =>
            reject(
              new WaitForTransactionReceiptTimeoutError({ hash: txId as never })
            )
          ),
        timeout
      )
    }
  })
}
