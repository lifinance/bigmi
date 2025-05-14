import { BaseError } from '@bigmi/core'

export class ProviderNotFoundError extends BaseError {
  code: number
  message: string
  name = 'ProviderNotFoundError'
  constructor() {
    super('Provider not found.')
    this.message = 'Provider not found'
    this.code = 243
  }
}
