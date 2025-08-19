import type {
  Account,
  Chain,
  ChainId,
  Client,
  Compute,
  HttpRpcClient,
} from '@bigmi/core'
import type { Emitter } from '../factories/createEmitter.js'
import type { Storage } from './storage.js'

export type Connector<
  createConnectorFn extends CreateConnectorFn = CreateConnectorFn,
> = ReturnType<createConnectorFn> & {
  emitter: Emitter<ConnectorEventMap>
  uid: string
}

export type ConnectorEventMap = {
  change: {
    accounts?: readonly Account[] | undefined
    chainId?: ChainId | undefined
  }
  connect: { accounts: readonly Account[]; chainId: ChainId }
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
        | {
            chainId?: ChainId | undefined
            isReconnecting?: boolean | undefined
          }
        | undefined
    ): Promise<{
      accounts: readonly Account[]
      chainId: ChainId
    }>
    disconnect(): Promise<void>
    getAccounts(): Promise<readonly Account[]>
    getChainId(): Promise<ChainId>
    getProvider(
      parameters?: { chainId?: ChainId | undefined } | undefined
    ): Promise<provider>
    getClient?(
      parameters?: { chainId?: ChainId | undefined } | undefined
    ): Promise<Client>
    isAuthorized(): Promise<boolean>
    switchChain?(parameters: { chainId: ChainId }): Promise<boolean>

    onAccountsChanged(accounts: Account[]): void
    onChainChanged(chainId: ChainId): void
    onConnect?(connectInfo: ProviderConnectInfo): void
    onDisconnect(error?: Error | undefined): void
    onMessage?(message: ProviderMessage): void
  } & properties
>

interface ProviderConnectInfo {
  readonly chainId: ChainId
}

interface ProviderMessage {
  readonly type: string
  readonly data: unknown
}
