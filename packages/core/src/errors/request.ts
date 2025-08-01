import { stringify } from '../utils/stringify.js'

import { BaseError } from './base.js'
import { getUrl } from './utils.js'

export type HttpRequestErrorType = HttpRequestError & {
  name: 'HttpRequestError'
}
export class HttpRequestError extends BaseError {
  body?: { [x: string]: unknown } | { [y: string]: unknown }[] | undefined
  headers?: Headers | undefined
  status?: number | undefined
  url: string

  constructor({
    body,
    cause,
    details,
    headers,
    status,
    url,
  }: {
    body?: { [x: string]: unknown } | { [y: string]: unknown }[] | undefined
    cause?: Error | undefined
    details?: string | undefined
    headers?: Headers | undefined
    status?: number | undefined
    url: string
  }) {
    super('HTTP request failed.', {
      cause,
      details,
      metaMessages: [
        status && `Status: ${status}`,
        `URL: ${getUrl(url)}`,
        body && `Request body: ${stringify(body)}`,
      ].filter(Boolean) as string[],
      name: 'HttpRequestError',
    })
    this.body = body
    this.headers = headers
    this.status = status
    this.url = url
  }
}

export type WebSocketRequestErrorType = WebSocketRequestError & {
  name: 'WebSocketRequestError'
}
export class WebSocketRequestError extends BaseError {
  constructor({
    body,
    cause,
    details,
    url,
  }: {
    body?: { [key: string]: unknown } | undefined
    cause?: Error | undefined
    details?: string | undefined
    url: string
  }) {
    super('WebSocket request failed.', {
      cause,
      details,
      metaMessages: [
        `URL: ${getUrl(url)}`,
        body && `Request body: ${stringify(body)}`,
      ].filter(Boolean) as string[],
      name: 'WebSocketRequestError',
    })
  }
}

export type RpcRequestErrorType = RpcRequestError & {
  name: 'RpcRequestError'
}
export class RpcRequestError extends BaseError {
  override code: number
  data?: unknown

  constructor({
    body,
    error,
    url,
  }: {
    body: { [x: string]: unknown } | { [y: string]: unknown }[]
    error: { code: number; data?: unknown; message: string }
    url: string
  }) {
    super('RPC Request failed.', {
      cause: error as any,
      details: error.message,
      metaMessages: [`URL: ${getUrl(url)}`, `Request body: ${stringify(body)}`],
      name: 'RpcRequestError',
    })
    this.code = error.code
    this.data = error.data
  }
}

export type SocketClosedErrorType = SocketClosedError & {
  name: 'SocketClosedError'
}
export class SocketClosedError extends BaseError {
  constructor({
    url,
  }: {
    url?: string | undefined
  } = {}) {
    super('The socket has been closed.', {
      metaMessages: [url && `URL: ${getUrl(url)}`].filter(Boolean) as string[],
      name: 'SocketClosedError',
    })
  }
}

export type TimeoutErrorType = TimeoutError & {
  name: 'TimeoutError'
}
export class TimeoutError extends BaseError {
  constructor({
    body,
    url,
    timeout,
  }: {
    body: { [x: string]: unknown } | { [y: string]: unknown }[]
    url: string
    timeout: number
  }) {
    super('The request took too long to respond.', {
      details: `The request timed out after ${timeout}ms.`,
      metaMessages: [`URL: ${getUrl(url)}`, `Request body: ${stringify(body)}`],
      name: 'TimeoutError',
    })
  }
}
