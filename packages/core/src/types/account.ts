import type { Address, AddressPurpose, AddressType } from './address.js'

export interface Account {
  address: Address
  addressType: AddressType
  publicKey: string
  purpose: AddressPurpose
}
