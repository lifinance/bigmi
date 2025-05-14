import { BaseError } from './base.js'

export class ProviderNotFoundError extends BaseError {
  constructor(message?: string) {
    const name = 'ProviderNotFoundError'
    const defaultMessage = 'The provider for this connector was not found'
    super(`${name}: ${message || defaultMessage}`, {
      name,
    })
  }
}
