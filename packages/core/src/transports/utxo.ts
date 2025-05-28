import { RpcRequestError } from '../errors/request.js'
import { UrlRequiredError } from '../errors/transport.js'
import { createTransport } from '../factories/createTransport.js'
import { getHttpRpcClient } from './getHttpRpcClient.js'
import { getRpcProviderMethods } from './getRpcProviderMethods.js'
import type { HttpTransport, HttpTransportConfig } from './http.js'
import type { UTXOMethod } from './types.js'

type UTXOHttpTransportConfig = HttpTransportConfig & {
  includeChainToURL?: boolean
  apiKey?: string
}

export function utxo(
  url?: string,
  config: UTXOHttpTransportConfig = {}
): HttpTransport {
  const {
    fetchOptions,
    key = 'utxo',
    name = 'UTXO HTTP API',
    onFetchRequest,
    onFetchResponse,
    retryDelay,
    apiKey,
    methods,
  } = config

  return ({ chain, retryCount: retryCount_, timeout: timeout_ }) => {
    const retryCount = config.retryCount ?? retryCount_
    const timeout = timeout_ ?? config.timeout ?? 10_000
    let url_ = url
    if (config.includeChainToURL) {
      const chainName = chain?.name.replace(' ', '-').toLowerCase()
      url_ = `${url}${chainName ? `/${chainName}` : ''}`
    }
    if (!url_) {
      throw new UrlRequiredError()
    }

    const client = getHttpRpcClient(url_, {
      fetchOptions,
      onRequest: onFetchRequest,
      onResponse: onFetchResponse,
      timeout,
    })

    const rpcMethods = getRpcProviderMethods(key)

    return createTransport(
      {
        key,
        name,
        methods,
        async request({ method, params }) {
          const body = { method, params }
          const methodHandler = rpcMethods?.[method as UTXOMethod]
          const { error, result } = await (methodHandler?.(
            client,
            { baseUrl: url_, apiKey },
            params
          ) ??
            client.request({
              body,
            }))
          if (error) {
            throw new RpcRequestError({
              body,
              error,
              url: url_,
            })
          }
          return result
        },
        retryCount,
        retryDelay,
        timeout,
        type: 'http',
      },
      {
        fetchOptions,
        url: url_,
      }
    )
  }
}
