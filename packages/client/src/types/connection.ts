import type { Account, ChainId } from '@bigmi/core'
import type { Connector } from './connector.js'

export type Connection = {
  accounts: readonly [Account, ...Account[]]
  chainId: ChainId
  connector: Connector
}
