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

export type AllTransportsFailedErrorType = AllTransportsFailedError & {
  name: 'AllTransportsFailedError'
}
export class AllTransportsFailedError extends BaseError {
  constructor({
    method,
    params,
    errors,
    totalAttempts,
  }: {
    method: string
    params: unknown
    errors: Array<{
      transport: string
      error: Error
      attempt: number
    }>
    totalAttempts: number
  }) {
    const errorMessages = errors
      .map(
        ({ transport, error, attempt }) =>
          `${attempt}. ${transport}: ${error.message}`
      )
      .join('\n')

    super(
      `All ${totalAttempts} transports failed for method "${method}": \n${errorMessages}`,
      {
        name: 'AllTransportsFailedError',
        metaMessages: [
          `Method: ${method}`,
          `Total attempts: ${totalAttempts}`,
          `Failed transports: ${errors.map((e) => e.transport).join(', ')}`,
        ],
      }
    )

    this.method = method
    this.params = params
    this.errors = errors
    this.totalAttempts = totalAttempts
  }

  method: string
  params: unknown
  errors: Array<{
    transport: string
    error: Error
    attempt: number
  }>
  totalAttempts: number
}
