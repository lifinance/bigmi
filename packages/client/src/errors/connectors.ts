import { BaseError, type ChainId } from '@bigmi/core'

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

export class ChainNotSupportedError extends BaseError {
  name = 'ChainNotSupportedError'
  constructor(chainId: ChainId, connector: string) {
    super(`Chain ${chainId.toString()} is not supported by ${connector} `)
  }
}
