import type { HttpRpcClient } from '../transports/getHttpRpcClient.js'
import type { Address } from '../types/address.js'
import type { Chain } from '../types/chain.js'
import type { Compute } from '../types/utils.js'
import type { Client } from './createClient.js'
import type { Emitter } from './createEmitter.js'
import type { Storage } from './createStorage.js'

interface ProviderConnectInfo {
  readonly chainId: string
}

interface ProviderMessage {
  readonly type: string
  readonly data: unknown
}

export type ConnectorEventMap = {
  change: {
    accounts?: readonly Address[] | undefined
    chainId?: number | undefined
  }
  connect: { accounts: readonly Address[]; chainId: number }
  disconnect: never
  error: { error: Error }
  message: { type: string; data?: unknown | undefined }
}

export type CreateConnectorFn<
  provider = unknown,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>,
> = (config: {
  chains: readonly [Chain, ...Chain[]]
  emitter: Emitter<ConnectorEventMap>
  storage?: Compute<Storage<storageItem>> | null | undefined
  transports?: Record<number, HttpRpcClient> | undefined
}) => Compute<
  {
    readonly icon?: string | undefined
    readonly id: string
    readonly name: string
    readonly rdns?: string | readonly string[] | undefined
    /** @deprecated */
    readonly supportsSimulation?: boolean | undefined
    readonly type: string

    setup?(): Promise<void>
    connect(
      parameters?:
        | { chainId?: number | undefined; isReconnecting?: boolean | undefined }
        | undefined
    ): Promise<{
      accounts: readonly Address[]
      chainId: number
    }>
    disconnect(): Promise<void>
    getAccounts(): Promise<readonly Address[]>
    getChainId(): Promise<number>
    getProvider(
      parameters?: { chainId?: number | undefined } | undefined
    ): Promise<provider>
    getClient?(
      parameters?: { chainId?: number | undefined } | undefined
    ): Promise<Client>
    isAuthorized(): Promise<boolean>

    onAccountsChanged(accounts: string[]): void
    onChainChanged(chainId: string): void
    onConnect?(connectInfo: ProviderConnectInfo): void
    onDisconnect(error?: Error | undefined): void
    onMessage?(message: ProviderMessage): void
  } & properties
>

export function createConnector<
  provider,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>,
  ///
  createConnectorFn extends CreateConnectorFn<
    provider,
    properties,
    storageItem
  > = CreateConnectorFn<provider, properties, storageItem>,
>(createConnectorFn: createConnectorFn) {
  return createConnectorFn
}
