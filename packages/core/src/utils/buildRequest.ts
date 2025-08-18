import { BaseError } from '../errors/base.js'
import { HttpRequestError } from '../errors/request.js'
import {
  MethodNotSupportedRpcError,
  RpcErrorCode,
  UserRejectedRequestError,
} from '../errors/rpc.js'
import type { ErrorType } from '../errors/utils.js'
import type {
  BtcRpcRequestFn,
  BtcRpcRequestOptions,
  RpcSchema,
} from '../types/request.js'
import { stringToHex } from './converter.js'
import { stringify } from './stringify.js'
import { withDedupe } from './withDedupe.js'
import { withRetry } from './withRetry.js'

export type RequestErrorType = ErrorType

export function buildRequest<request extends BtcRpcRequestFn<RpcSchema>>(
  request: request,
  options: BtcRpcRequestOptions = {}
): BtcRpcRequestFn {
  return async (args, overrideOptions = {}) => {
    const {
      dedupe = false,
      methods,
      retryDelay = 150,
      retryCount = 3,
      uid,
    } = {
      ...options,
      ...overrideOptions,
    }

    const { method } = args
    if (methods?.exclude?.includes(method)) {
      throw new MethodNotSupportedRpcError(method)
    }
    if (methods?.include && !methods.include.includes(method)) {
      throw new MethodNotSupportedRpcError(method)
    }

    const requestId = dedupe
      ? stringToHex(`${uid}.${stringify(args)}`)
      : undefined
    return withDedupe(
      () =>
        withRetry(
          async () => {
            try {
              return await request(args)
            } catch (err_) {
              const err = err_ as unknown as BaseError
              switch (err.code) {
                case RpcErrorCode.METHOD_NOT_SUPPORTED:
                  throw new MethodNotSupportedRpcError(method)

                case RpcErrorCode.USER_REJECTION:
                  throw new UserRejectedRequestError(err.message)

                // CAIP-25: User Rejected Error
                // https://docs.walletconnect.com/2.0/specs/clients/sign/error-codes#rejected-caip-25
                case 5000:
                  throw new UserRejectedRequestError(err.message)

                default:
                  if (err_ instanceof BaseError) {
                    throw err_
                  }
                  throw new BaseError('Unknown Error', { cause: err_ as Error })
              }
            }
          },
          {
            delay: ({ count, error }) => {
              // If we find a Retry-After header, let's retry after the given time.
              if (error && error instanceof HttpRequestError) {
                const retryAfter = error?.headers?.get('Retry-After')
                if (retryAfter?.match(/\d/)) {
                  return Number.parseInt(retryAfter, 10) * 1000
                }
              }

              // Otherwise, let's retry with an exponential backoff.
              return ~~(1 << count) * retryDelay
            },
            retryCount,
            shouldRetry: ({ error }) => shouldRetry(error),
          }
        ),
      { enabled: dedupe, id: requestId }
    )
  }
}

/** @internal */
export function shouldRetry(error: Error) {
  if ('code' in error && typeof error.code === 'number') {
    if (error.code === -1) {
      return true // Unknown error
    }
    if (error.code === RpcErrorCode.INTERNAL_ERROR) {
      return true
    }
    return false
  }
  if (error instanceof HttpRequestError && error.status) {
    // Forbidden
    if (error.status === 403) {
      return true
    }
    // Request Timeout
    if (error.status === 408) {
      return true
    }
    // Request Entity Too Large
    if (error.status === 413) {
      return true
    }
    // Too Many Requests
    if (error.status === 429) {
      return true
    }
    // Internal Server Error
    if (error.status === 500) {
      return true
    }
    // Bad Gateway
    if (error.status === 502) {
      return true
    }
    // Service Unavailable
    if (error.status === 503) {
      return true
    }
    // Gateway Timeout
    if (error.status === 504) {
      return true
    }
    return false
  }
  return true
}
