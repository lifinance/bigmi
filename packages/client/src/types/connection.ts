import type { Account } from '@bigmi/core'
import type { Connector } from './connector.js'

export type Connection = {
  accounts: readonly [Account, ...Account[]]
  chainId: number
  connector: Connector
}
