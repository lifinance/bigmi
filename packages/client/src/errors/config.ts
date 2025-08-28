import { BaseError, type ChainId } from '@bigmi/core'

export type ChainNotConfiguredErrorType = ChainNotConfiguredError & {
  name: 'ChainNotConfiguredError'
}
export class ChainNotConfiguredError extends BaseError {
  override name = 'ChainNotConfiguredError'
  constructor(chainId?: ChainId) {
    super(`Chain ${chainId ? `: ${chainId}` : ''} not configured.`)
  }
}
