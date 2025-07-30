import { BaseError } from './base.js'

/**
 * @enum {number} RpcErrorCode
 * @description JSON-RPC error codes
 * @see https://www.jsonrpc.org/specification#error_object
 */
export enum RpcErrorCode {
  /**
   * Parse error Invalid JSON
   **/
  PARSE_ERROR = -32700,
  /**
   * The JSON sent is not a valid Request object.
   **/
  INVALID_REQUEST = -32600,
  /**
   * The method does not exist/is not available.
   **/
  METHOD_NOT_FOUND = -32601,
  /**
   * Invalid method parameter(s).
   */
  INVALID_PARAMS = -32602,
  /**
   * Internal JSON-RPC error.
   * This is a generic error, used when the server encounters an error in performing the request.
   **/
  INTERNAL_ERROR = -32603,
  /**
   * user rejected/canceled the request
   */
  USER_REJECTION = -32000,
  /**
   * method is not supported for the address provided
   */
  METHOD_NOT_SUPPORTED = -32001,
  /**
   * The client does not have permission to access the requested resource.
   */
  ACCESS_DENIED = -32002,
  /**
   * Unknown generic errors
   */
  MISC_ERROR = -1,
}

export class UserRejectedRequestError extends BaseError {
  override code = RpcErrorCode.USER_REJECTION
  constructor(message?: string) {
    const name = 'UserRejectedRequestError'
    const errMessage =
      message || 'The user rejected your request, please try again'
    super(`${name}:  ${errMessage}`, {
      name,
    })
  }
}

export class MethodNotSupportedRpcError extends BaseError {
  override code = RpcErrorCode.METHOD_NOT_SUPPORTED
  constructor(method?: string) {
    const name = 'MethodNotSupportedError'
    const message = `The method ${method} you are calling is not supported`
    super(`${name}: ${message}`, {
      name,
    })
  }
}

export class ParseError extends BaseError {
  override code = RpcErrorCode.PARSE_ERROR
  constructor(message?: string) {
    const name = 'ParseError'
    const errMessage =
      message || 'Invalid JSON, there was an error parsing your request.'
    super(`${name}: ${errMessage}`, {
      name,
    })
  }
}
