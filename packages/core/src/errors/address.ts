import { BaseError } from './base.js'

export type InvalidAddressErrorType = InvalidAddressError & {
  name: 'InvalidAddressError'
}
export class InvalidAddressError extends BaseError {
  constructor({ address }: { address: string }) {
    super(`Address "${address}" is invalid.`, {
      metaMessages: [
        '- Address must be a hex value of 20 bytes (40 hex characters).',
        '- Address must match its checksum counterpart.',
      ],
      name: 'InvalidAddressError',
    })
  }
}

export type NotEnoughUTXOErrorType = NotEnoughUTXOError & {
  name: 'NotEnoughUTXOError'
}

export class NotEnoughUTXOError extends BaseError {
  constructor({
    minValue,
    address,
    balance,
  }: { minValue: number; address?: string; balance?: number }) {
    super(`Not enough utxo required for ${minValue}`, {
      metaMessages: [
        `${address && balance && `Address ${address} has a balance of ${balance}.`}`,
      ],
      name: 'NotEnoughUTXOError',
    })
  }
}
