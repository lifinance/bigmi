import type { ErrorType } from '../errors/utils.js'

import type { Account } from './account.js'
import type { Address } from './address.js'
import type { Chain } from './chain.js'
import type { BtcRpcRequestFn, RpcSchema } from './request.js'
import type { BitcoinRpcMethods } from './rpc.js'
import type { Transport } from './transport.js'
import type { Prettify } from './utils.js'

export type UTXOWalletSchema = readonly [
  {
    Method: 'signPsbt'
    Parameters: SignPsbtParameters
    ReturnType: SignPsbtReturnType
  },
]

export type SignPsbtParameters = {
  /** The PSBT encoded as a hexadecimal string */
  psbt: string
  /**
   * Array of objects specifying details about the inputs to be signed
   */
  inputsToSign: {
    /**
     * The SigHash type to use for signing (e.g., SIGHASH_ALL).
     * If not specified, a default value is used.
     */
    sigHash?: number
    /** The Bitcoin address associated with the input that will be signed */
    address: string
    /** An array of indexes in the PSBT corresponding to the inputs that need to be signed */
    signingIndexes: number[]
  }[]
  /**
   * Whether to finalize the PSBT after signing.
   * If `true`, the PSBT will be completed and ready for broadcasting.
   * If `false` or omitted, the PSBT remains partially signed.
   * Some wallets does not support it.
   */
  finalize?: boolean
}

export type SignPsbtReturnType = string

export type UTXOWalletProvider = {
  request: BtcRpcRequestFn<UTXOWalletSchema>
}

export type ClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined =
    | Account
    | Address
    | undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = {
  /** The Account to use for the Client. This will be used for Actions that require an account as an argument. */
  account?: accountOrAddress | Account | Address | undefined
  /** Flags for batch settings. */
  batch?:
    | {
        /** Toggle to enable `eth_call` multicall aggregation. */
        multicall?: boolean | Prettify<MulticallBatchOptions> | undefined
      }
    | undefined
  /**
   * Time (in ms) that cached data will remain in memory.
   * @default 4_000
   */
  cacheTime?: number | undefined
  /** Chain for the client. */
  chain?: Chain | undefined | chain
  /** A key for the client. */
  key?: string | undefined
  /** A name for the client. */
  name?: string | undefined
  /**
   * Frequency (in ms) for polling enabled actions & events.
   * @default 4_000
   */
  pollingInterval?: number | undefined
  /**
   * Typed JSON-RPC schema for the client.
   */
  rpcSchema?: rpcSchema | undefined
  /** The RPC transport */
  transport: transport
  /** The type of client. */
  type?: string | undefined
}

// TODO: Move `transport` to slot index 2 since `chain` and `account` used more frequently.
// Otherwise, we end up with a lot of `Client<Transport, chain, account>` in actions.
export type Client<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
  extended extends Extended | undefined = Extended | undefined,
> = Client_Base<transport, chain, account, rpcSchema> &
  (extended extends Extended ? extended : unknown) & {
    extend: <const client extends Extended>(
      fn: (
        client: Client<transport, chain, account, rpcSchema, extended>
      ) => client
    ) => Client<
      transport,
      chain,
      account,
      rpcSchema,
      Prettify<client> & (extended extends Extended ? extended : unknown)
    >
  }

type Client_Base<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = {
  /** The Account of the Client. */
  account: account
  /** Flags for batch settings. */
  batch?: ClientConfig['batch'] | undefined
  /** Time (in ms) that cached data will remain in memory. */
  cacheTime: number
  /** Chain for the client. */
  chain: chain
  /** A key for the client. */
  key: string
  /** A name for the client. */
  name: string
  /** Frequency (in ms) for polling enabled actions & events. Defaults to 4_000 milliseconds. */
  pollingInterval: number
  /** Request function wrapped with friendly error handling */
  request: BtcRpcRequestFn<
    rpcSchema extends undefined ? BitcoinRpcMethods : rpcSchema
  >
  /** The RPC transport */
  transport: ReturnType<transport>['config'] & ReturnType<transport>['value']
  /** The type of client. */
  type: string
  /** A unique ID for the client. */
  uid: string
}

type Extended = Prettify<
  // disallow redefining base properties
  { [_ in keyof Client_Base]?: undefined } & {
    [key: string]: unknown
  }
>

export type MulticallBatchOptions = {
  /** The maximum size (in bytes) for each calldata chunk. @default 1_024 */
  batchSize?: number | undefined
  /** The maximum number of milliseconds to wait before sending a batch. @default 0 */
  wait?: number | undefined
}

export type CreateClientErrorType = ErrorType
