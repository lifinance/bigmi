import type { ErrorType } from '../errors/utils.js'
import type { UTXOMethod } from '../transports/types.js'
import type { Chain } from './chain.js'
import type { BtcRpcRequestFn, RpcSchema } from './request.js'
import type { OneOf } from './utils.js'

export type TransportConfig<
  type extends string = string,
  rpcRequestFn extends BtcRpcRequestFn = BtcRpcRequestFn,
> = {
  /** The name of the transport. */
  name: string
  /** The key of the transport. */
  key: string
  /** Methods to include or exclude from executing RPC requests. */
  methods?:
    | OneOf<
        | {
            include?: UTXOMethod[] | undefined
          }
        | {
            exclude?: UTXOMethod[] | undefined
          }
      >
    | undefined
  /** The JSON-RPC request function that matches the EIP-1193 request spec. */
  request: rpcRequestFn
  /** The base delay (in ms) between retries. */
  retryDelay?: number | undefined
  /** The max number of times to retry. */
  retryCount?: number | undefined
  /** The timeout (in ms) for requests. */
  timeout?: number | undefined
  /** The type of the transport. */
  type: type
}

export type Transport<
  type extends string = string,
  rpcAttributes = Record<string, any>,
  rpcRequestFn extends BtcRpcRequestFn = BtcRpcRequestFn<RpcSchema>,
> = <chain extends Chain | undefined = Chain>({
  chain,
}: {
  chain?: chain | undefined
  pollingInterval?: number | undefined
  retryCount?: TransportConfig['retryCount'] | undefined
  timeout?: TransportConfig['timeout'] | undefined
}) => {
  config: TransportConfig<type>
  request: rpcRequestFn
  value?: rpcAttributes | undefined
}

export type CreateTransportErrorType = ErrorType
