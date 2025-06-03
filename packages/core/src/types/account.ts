import type { Address } from './address.js'

export type AddressType = 'p2tr' | 'p2wpkh' | 'p2wsh' | 'p2sh' | 'p2pkh'
export type AddressPurpose = 'payment' | 'ordinals' | 'stacks'
export interface Account {
  address: Address
  addressType: AddressType
  publicKey: string
  purpose: AddressPurpose
}
