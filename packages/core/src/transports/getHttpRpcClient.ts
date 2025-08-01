import { HttpRequestError, TimeoutError } from '../errors/request.js'
import type { RpcResponse } from '../types/rpc.js'
import type { MaybePromise } from '../types/utils.js'
import { stringify } from '../utils/stringify.js'
import { withTimeout } from '../utils/withTimeout.js'

export type RpcRequest = {
  jsonrpc?: '2.0'
  method: string
  params?: any
  id?: number
}

export type HttpRequestReturnType<
  body extends RpcRequest | RpcRequest[] = RpcRequest,
> = body extends RpcRequest[] ? RpcResponse[] : RpcResponse

export type HttpRpcClientOptions = {
  /** Request configuration to pass to `fetch`. */
  fetchOptions?: Omit<RequestInit, 'body'> | undefined
  /** A callback to handle the request. */
  onRequest?:
    | ((
        request: Request,
        init: RequestInit
      ) => MaybePromise<
        void | undefined | (RequestInit & { url?: string | undefined })
      >)
    | undefined
  /** A callback to handle the response. */
  onResponse?: ((response: Response) => Promise<void> | void) | undefined
  /** The timeout (in ms) for the request. */
  timeout?: number | undefined
}

export type HttpRequestParameters<
  body extends RpcRequest | RpcRequest[] = RpcRequest,
> = {
  url?: string
  /** The RPC request body. */
  body?: body
  /** Request configuration to pass to `fetch`. */
  fetchOptions?: HttpRpcClientOptions['fetchOptions'] | undefined
  /** A callback to handle the response. */
  onRequest?: ((request: Request) => Promise<void> | void) | undefined
  /** A callback to handle the response. */
  onResponse?: ((response: Response) => Promise<void> | void) | undefined
  /** The timeout (in ms) for the request. */
  timeout?: HttpRpcClientOptions['timeout'] | undefined
}

export type HttpRpcClient = {
  request<body extends RpcRequest | RpcRequest[]>(
    params: HttpRequestParameters<body>
  ): Promise<HttpRequestReturnType<body>>
}

export function getHttpRpcClient(
  url: string,
  options: HttpRpcClientOptions = {}
): HttpRpcClient {
  return {
    async request(params) {
      const {
        body,
        onRequest = options.onRequest,
        onResponse = options.onResponse,
        timeout = options.timeout ?? 10_000,
      } = params

      const fetchOptions = {
        ...(options.fetchOptions ?? {}),
        ...(params.fetchOptions ?? {}),
      }

      const { headers, method, signal: signal_ } = fetchOptions

      try {
        const response = await withTimeout(
          async ({ signal }) => {
            const init: RequestInit = {
              ...fetchOptions,
              body: body ? stringify(body) : undefined,
              headers: {
                ...(method !== 'GET'
                  ? { 'Content-Type': 'application/json' }
                  : undefined),
                ...headers,
              },
              method: method || 'POST',
              signal: signal_ || (timeout > 0 ? signal : null),
            }
            const request = new Request(params.url ?? url, init)
            if (onRequest) {
              await onRequest(request, init)
            }
            const response = await fetch(params.url ?? url, init)
            return response
          },
          {
            errorInstance: new TimeoutError({
              body: body ?? {},
              url: params.url ?? url,
              timeout,
            }),
            timeout,
            signal: true,
          }
        )

        if (onResponse) {
          await onResponse(response)
        }

        let data: any
        if (
          response.headers.get('Content-Type')?.startsWith('application/json')
        ) {
          data = await response.json()
        } else {
          data = await response.text()
          data = JSON.parse(data || '{}')
        }

        if (!response.ok) {
          throw new HttpRequestError({
            body,
            details: stringify(data.error) || response.statusText,
            headers: response.headers,
            status: response.status,
            url,
          })
        }
        return data
      } catch (err) {
        if (err instanceof HttpRequestError) {
          throw err
        }
        if (err instanceof TimeoutError) {
          throw err
        }
        throw new HttpRequestError({
          body,
          cause: err as Error,
          url,
        })
      }
    },
  }
}
