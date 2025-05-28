import { BaseError } from './base.js'

export type InsufficientUTXOBalanceErrorType = InsufficientUTXOBalanceError & {
  name: 'InsufficientUTXOBalanceError'
}

export class InsufficientUTXOBalanceError extends BaseError {
  constructor({
    minValue,
    address,
    balance,
  }: { minValue: number; address?: string; balance?: number }) {
    super(`Not enough UTXOs required for ${minValue}`, {
      metaMessages: [
        `${address && balance && `Address ${address} has a balance of ${balance}.`}`,
      ],
      name: 'InsufficientUTXOBalanceError',
    })
  }
}
