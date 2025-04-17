import type { ErrorType } from '../errors/utils.js'
import type { OneOf, Prettify } from './utils.js'

export type RpcSchema = readonly {
  Method: string
  Parameters?: unknown | undefined
  ReturnType: unknown
}[]

export type RpcSchemaOverride = Omit<RpcSchema[number], 'Method'>

type DerivedRpcSchema<
  rpcSchema extends RpcSchema | undefined,
  rpcSchemaOverride extends RpcSchemaOverride | undefined,
> = rpcSchemaOverride extends RpcSchemaOverride
  ? [rpcSchemaOverride & { Method: string }]
  : rpcSchema

export type RpcParameters<rpcSchema extends RpcSchema | undefined = undefined> =
  rpcSchema extends RpcSchema
    ? {
        [K in keyof rpcSchema]: Prettify<
          {
            method: rpcSchema[K] extends rpcSchema[number]
              ? rpcSchema[K]['Method']
              : never
          } & (rpcSchema[K] extends rpcSchema[number]
            ? rpcSchema[K]['Parameters'] extends undefined
              ? { params?: undefined }
              : { params: rpcSchema[K]['Parameters'] }
            : never)
        >
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
            include?: string[] | undefined
          }
        | {
            exclude?: string[] | undefined
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
  rpcSchemaOverride extends RpcSchemaOverride | undefined = undefined,
  _parameters extends RpcParameters<
    DerivedRpcSchema<rpcSchema, rpcSchemaOverride>
  > = RpcParameters<DerivedRpcSchema<rpcSchema, rpcSchemaOverride>>,
  _returnType = DerivedRpcSchema<rpcSchema, rpcSchemaOverride> extends RpcSchema
    ? raw extends true
      ? OneOf<
          | {
              result: Extract<
                DerivedRpcSchema<rpcSchema, rpcSchemaOverride>[number],
                { Method: _parameters['method'] }
              >['ReturnType']
            }
          | { error: ErrorType }
        >
      : Extract<
          DerivedRpcSchema<rpcSchema, rpcSchemaOverride>[number],
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
