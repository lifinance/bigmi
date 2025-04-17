import type { BlockTag } from '../types/block.js'
import type { Hash } from '../types/hash.js'
import { BaseError } from './base.js'

export type TransactionNotFoundErrorType = TransactionNotFoundError & {
  name: 'TransactionNotFoundError'
}
export class TransactionNotFoundError extends BaseError {
  constructor({
    blockHash,
    blockNumber,
    blockTag,
    hash,
    index,
  }: {
    blockHash?: Hash | undefined
    blockNumber?: bigint | undefined
    blockTag?: BlockTag | undefined
    hash?: Hash | undefined
    index?: number | undefined
  }) {
    let identifier = 'Transaction'
    if (blockTag && index !== undefined) {
      identifier = `Transaction at block time "${blockTag}" at index "${index}"`
    }
    if (blockHash && index !== undefined) {
      identifier = `Transaction at block hash "${blockHash}" at index "${index}"`
    }
    if (blockNumber && index !== undefined) {
      identifier = `Transaction at block number "${blockNumber}" at index "${index}"`
    }
    if (hash) {
      identifier = `Transaction with hash "${hash}"`
    }
    super(`${identifier} could not be found.`, {
      name: 'TransactionNotFoundError',
    })
  }
}

export type TransactionReceiptNotFoundErrorType =
  TransactionReceiptNotFoundError & {
    name: 'TransactionReceiptNotFoundError'
  }
export class TransactionReceiptNotFoundError extends BaseError {
  constructor({ hash }: { hash: Hash }) {
    super(
      `Transaction receipt with hash "${hash}" could not be found. The Transaction may not be processed on a block yet.`,
      {
        name: 'TransactionReceiptNotFoundError',
      }
    )
  }
}

export type WaitForTransactionReceiptTimeoutErrorType =
  WaitForTransactionReceiptTimeoutError & {
    name: 'WaitForTransactionReceiptTimeoutError'
  }
export class WaitForTransactionReceiptTimeoutError extends BaseError {
  constructor({ hash }: { hash: Hash }) {
    super(
      `Timed out while waiting for transaction with hash "${hash}" to be confirmed.`,
      { name: 'WaitForTransactionReceiptTimeoutError' }
    )
  }
}
