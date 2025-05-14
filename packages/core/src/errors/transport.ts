import { BaseError } from './base.js'

export type UrlRequiredErrorType = UrlRequiredError & {
  name: 'UrlRequiredError'
}
export class UrlRequiredError extends BaseError {
  constructor() {
    super(
      'No URL was provided to the Transport. Please provide a valid RPC URL to the Transport.',
      {
        name: 'UrlRequiredError',
      }
    )
  }
}

export type TransportMethodNotSupportedErrorType =
  TransportMethodNotSupportedError & {
    name: 'TransportMethodNotSupportedError'
  }
export class TransportMethodNotSupportedError extends BaseError {
  constructor({ method }: { method: string }) {
    super(`No transport found that supports the method: ${method}`, {
      name: 'TransportMethodNotSupportedError',
    })
  }
}
