import type { Address } from './address.js'

export type xPubAccount = {
  balance: bigint
  addresses: Array<{
    address: Address
    balance: bigint
    path: string
    scriptHex: string
  }>
}
