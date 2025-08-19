import type { Account, Chain, ChainId } from '@bigmi/core'
import type { Config } from '../factories/createConfig.js'
import type { Connector } from '../types/connector.js'

export type GetAccountReturnType<
  config extends Config = Config,
  ///
  chain = Config extends config ? Chain : config['chains'][number],
> =
  | {
      account: Account
      accounts: readonly [Account, ...Account[]]
      chain: chain | undefined
      chainId: ChainId
      connector: Connector
      isConnected: true
      isConnecting: false
      isDisconnected: false
      isReconnecting: false
      status: 'connected'
    }
  | {
      account: Account | undefined
      accounts: readonly Account[] | undefined
      chain: chain | undefined
      chainId: ChainId | undefined
      connector: Connector | undefined
      isConnected: boolean
      isConnecting: false
      isDisconnected: false
      isReconnecting: true
      status: 'reconnecting'
    }
  | {
      account: Account | undefined
      accounts: readonly Account[] | undefined
      chain: chain | undefined
      chainId: ChainId | undefined
      connector: Connector | undefined
      isConnected: false
      isReconnecting: false
      isConnecting: true
      isDisconnected: false
      status: 'connecting'
    }
  | {
      account: undefined
      accounts: undefined
      chain: undefined
      chainId: undefined
      connector: undefined
      isConnected: false
      isReconnecting: false
      isConnecting: false
      isDisconnected: true
      status: 'disconnected'
    }

export function getAccount<C extends Config>(
  config: C
): GetAccountReturnType<C> {
  const uid = config.state.current!
  const connection = config.state.connections.get(uid)
  const accounts = connection?.accounts
  const account = accounts?.[0]
  const chain = config.chains.find(
    (chain) => chain.id === connection?.chainId
  ) as GetAccountReturnType<C>['chain']
  const status = config.state.status

  switch (status) {
    case 'connected':
      return {
        account: account!,
        accounts: accounts!,
        chain,
        chainId: connection?.chainId!,
        connector: connection?.connector!,
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
        isReconnecting: false,
        status,
      }
    case 'reconnecting':
      return {
        account: account,
        accounts: accounts,
        chain,
        chainId: connection?.chainId,
        connector: connection?.connector,
        isConnected: !!account,
        isConnecting: false,
        isDisconnected: false,
        isReconnecting: true,
        status,
      }
    case 'connecting':
      return {
        account: account,
        accounts: accounts,
        chain,
        chainId: connection?.chainId,
        connector: connection?.connector,
        isConnected: false,
        isConnecting: true,
        isDisconnected: false,
        isReconnecting: false,
        status,
      }
    case 'disconnected':
      return {
        account: undefined,
        accounts: undefined,
        chain: undefined,
        chainId: undefined,
        connector: undefined,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
        isReconnecting: false,
        status,
      }
  }
}
