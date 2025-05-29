import type { ErrorType } from '../errors/utils.js'
import type { UTXOMethod } from '../transports/types.js'
import type { OneOf } from './utils.js'

export type RpcSchema = readonly {
  Method: string
  Parameters?: unknown | undefined
  ReturnType: unknown
}[]

export type RpcSchemaOverride = Omit<RpcSchema[number], 'Method'>

type DerivedRpcSchema<rpcSchema extends RpcSchema | undefined> =
  rpcSchema extends RpcSchema ? rpcSchema : never

export type RpcParameters<rpcSchema extends RpcSchema | undefined = undefined> =
  rpcSchema extends RpcSchema
    ? {
        [K in keyof rpcSchema]: rpcSchema[K] extends RpcSchema[number]
          ? {
              method: rpcSchema[K]['Method']
              params: rpcSchema[K]['Parameters']
            }
          : never
      }[number]
    : {
        method: string
        params?: unknown | undefined
      }

export type BtcRpcRequestOptions = {
  /** Deduplicate in-flight requests. */
  dedupe?: boolean | undefined
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
  /** The base delay (in ms) between retries. */
  retryDelay?: number | undefined
  /** The max number of times to retry. */
  retryCount?: number | undefined
  /** Unique identifier for the request. */
  uid?: string | undefined
}

export type BtcRpcRequestFn<
  rpcSchema extends RpcSchema | undefined = undefined,
  raw extends boolean = false,
> = <
  _parameters extends RpcParameters<
    DerivedRpcSchema<rpcSchema>
  > = RpcParameters<DerivedRpcSchema<rpcSchema>>,
  _returnType = DerivedRpcSchema<rpcSchema> extends RpcSchema
    ? raw extends true
      ? OneOf<
          | {
              result: Extract<
                DerivedRpcSchema<rpcSchema>[number],
                { Method: _parameters['method'] }
              >['ReturnType']
            }
          | { error: ErrorType }
        >
      : Extract<
          DerivedRpcSchema<rpcSchema>[number],
          { Method: _parameters['method'] }
        >['ReturnType']
    : raw extends true
      ? OneOf<
          | {
              result: unknown
            }
          | {
              error: ErrorType
            }
        >
      : unknown,
>(
  args: _parameters,
  options?: BtcRpcRequestOptions | undefined
) => Promise<_returnType>
