import type { Address } from '@bigmi/core'
import type { Connector } from './connector.js'

export type Connection = {
  accounts: readonly [Address, ...Address[]]
  chainId: number
  connector: Connector
}
