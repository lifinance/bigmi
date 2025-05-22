import { BaseError } from './base.js'

export type UTXOsFetchErrorType = UTXOsFetchError & {
  name: 'UTXOsFetchError'
}

export class UTXOsFetchError extends BaseError {
  constructor({ address }: { address: string }) {
    super(`There was a problem fetching UTXOs for address: ${address}.`, {
      name: 'UTXOsFetchError',
    })
  }
}

export type NotEnoughUTXOsErrorType = NotEnoughUTXOsError & {
  name: 'NotEnoughUTXOsError'
}

export class NotEnoughUTXOsError extends BaseError {
  constructor({
    minValue,
    address,
    balance,
  }: { minValue: number; address?: string; balance?: number }) {
    super(`Not enough UTXOs required for ${minValue}`, {
      metaMessages: [
        `${address && balance && `Address ${address} has a balance of ${balance}.`}`,
      ],
      name: 'NotEnoughUTXOsError',
    })
  }
}
