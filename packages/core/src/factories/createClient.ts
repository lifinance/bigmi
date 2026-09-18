import type { ErrorType } from '../errors/utils.js'
import type { Account } from '../types/account.js'
import type { Address } from '../types/address.js'
import type { Chain } from '../types/chain.js'
import type { BtcRpcRequestFn, RpcSchema } from '../types/request.js'
import type { BitcoinRpcMethods } from '../types/rpc.js'
import type { Transport } from '../types/transport.js'
import type { Prettify } from '../types/utils.js'

import { parseAccount } from '../utils/parseAccount.js'
import { uid } from '../utils/uid.js'

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

export function createClient<
  transport extends Transport,
  chain extends Chain | undefined = undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
>(
  parameters: ClientConfig<transport, chain, accountOrAddress, rpcSchema>
): Prettify<
  Client<
    transport,
    chain,
    accountOrAddress extends Address ? Prettify<Account> : accountOrAddress,
    rpcSchema
  >
>

export function createClient(parameters: ClientConfig): Client {
  const {
    cacheTime = parameters.pollingInterval ?? 4_000,

    key = 'base',
    name = 'Base Client',
    pollingInterval = 4_000,
    type = 'base',
  } = parameters

  const chain = parameters.chain
  const account = parameters.account
    ? parseAccount(parameters.account)
    : undefined
  const { config, request, value } = parameters.transport({
    chain,
    pollingInterval,
  })
  const transport = { ...config, ...value }

  const client = {
    account,
    cacheTime,

    chain,
    key,
    name,
    pollingInterval,
    request,
    transport,
    type,
    uid: uid(),
  }

  function extend(base: typeof client) {
    type ExtendFn = (base: typeof client) => unknown
    return (extendFn: ExtendFn) => {
      const extended = extendFn(base) as Extended
      for (const key in client) {
        delete extended[key]
      }
      const combined = { ...base, ...extended }
      return Object.assign(combined, { extend: extend(combined as any) })
    }
  }

  return Object.assign(client, { extend: extend(client) as any })
}

/**
 * Defines a typed JSON-RPC schema for the client.
 * Note: This is a runtime noop function.
 */
export function rpcSchema<rpcSchema extends RpcSchema>(): rpcSchema {
  return null as any
}
