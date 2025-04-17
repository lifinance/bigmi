import type { Address } from './address.ts'
import type { Connector } from './connector.ts'

export type Connection = {
  accounts: readonly [Address, ...Address[]]
  chainId: number
  connector: Connector
}
