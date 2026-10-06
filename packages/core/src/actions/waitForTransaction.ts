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
   * Number of times to retry a failed lookup of the transaction or of a block.
   * It is also the block budget: once `retryCount + 1` block callbacks have
   * counted, the next one rejects with `WaitForTransactionReceiptTimeoutError`.
   * A callback counts while the transaction is not mined or the height of its
   * block is unknown.
   * @default 10
   */
  retryCount?: number
  /**
   * Time to wait (in ms) between the retries of a lookup.
   * @default 3_000
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

  // `getId()` gives a txid in lower case; the node takes `txId` in either case.
  const awaitedTxId = txId.toLowerCase()
  let count = 0
  let transaction: UTXOTransaction | undefined
  // The height of the block of `transaction`, once `getblockstats` gives it.
  let minedHeight: number | undefined
  let replacedTransaction: Transaction | undefined
  // The replacement that `transaction` tracks once one is found. It is
  // reported when `transaction` has enough confirmations, which can be in a
  // later block.
  let replacement: Omit<ReplacementReturnType, 'transaction'> | undefined
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

        // Resolves with the tracked transaction, and first reports the
        // replacement it tracks, if any.
        const resolveWith = (transaction: UTXOTransaction) =>
          done(() => {
            if (replacement) {
              emit.onReplaced?.({ ...replacement, transaction })
            }
            emit.resolve(transaction)
          })

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
                minedHeight = blockStats.height || undefined
                if (
                  confirmations > 1 &&
                  (!blockStats.height ||
                    blockNumber - blockStats.height + 1 < confirmations)
                ) {
                  return
                }
                resolveWith(transaction)
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
                minedHeight = blockStats.height || undefined
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

              resolveWith(transaction)
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
                  let originalTransactionInBlock = false
                  const replacedTransactionId = replacedTransaction.getId()

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
                        // The tracked and the awaited transaction spend the
                        // same inputs, and a provider can list one in a block
                        // before getrawtransaction reports it mined. Neither
                        // is a replacement: a later callback finds it mined.
                        // `awaitedTxId` is the awaited one; the tracked one
                        // differs from it once a replacement is tracked.
                        const id = tx.getId()
                        if (id === awaitedTxId) {
                          originalTransactionInBlock = true
                        } else if (id !== replacedTransactionId) {
                          replacementTransaction = tx
                        }
                        break
                      }
                    }
                    if (replacementTransaction || originalTransactionInBlock) {
                      break
                    }
                  }

                  // The awaited transaction is back after its tracked
                  // replacement left the chain: track the awaited one again,
                  // so the next callback looks it up by `txId`.
                  if (originalTransactionInBlock) {
                    transaction = undefined
                    replacement = undefined
                    return
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

                  // Get the recipient addresses from the original transaction.
                  // That is the awaited one, also when the tracked transaction
                  // is an earlier replacement that left the chain.
                  const originalTransaction = Transaction.fromHex(txHex)
                  const originalOutputAddresses =
                    getOutputAddresses(originalTransaction)

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

                  replacement = {
                    reason,
                    replacedTransaction: originalTransaction,
                  }

                  // Check if we have enough confirmations. If not, continue
                  // polling. A replacement with no confirmations is not mined
                  // yet, so a later callback checks it again.
                  if (
                    !transaction.confirmations ||
                    transaction.confirmations < confirmations
                  ) {
                    return
                  }

                  resolveWith(transaction)
                } catch (err_) {
                  done(() => emit.reject(err_))
                }
              } else {
                done(() => emit.reject(err))
              }
            } finally {
              // The budget counts only blocks in which the tracked transaction
              // is not mined, or the height of its block is unknown. A mined
              // one waits for its confirmations, which can take more blocks
              // than `retryCount`.
              if (!transaction?.blockhash || !minedHeight) {
                count++
              }
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
