import type { Account, Chain } from '@bigmi/core'
import type { Connector } from './connector.js'

export interface BtcAccount extends Account {
  accounts: readonly BtcAccount[]
  chain: Chain | undefined
  chainId: number
  connector: Connector
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  isReconnecting: boolean
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  pubKey?: string
}
