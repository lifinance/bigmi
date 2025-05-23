import { BaseError } from '@bigmi/core'

export type BigmiProviderNotFoundErrorType = BigmiProviderNotFoundError & {
  name: 'BigmiProviderNotFoundError'
}
export class BigmiProviderNotFoundError extends BaseError {
  override name = 'BigmiProviderNotFoundError'
  constructor() {
    super('`useConfig` must be used within `BigmiProvider`.')
  }
}
