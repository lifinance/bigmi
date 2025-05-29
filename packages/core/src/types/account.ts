import type { Address } from './address.js'

export interface Account {
  address: Address
  addressType: 'p2tr' | 'p2wpkh' | 'p2wsh' | 'p2sh' | 'p2pkh'
  publicKey: string
  purpose: 'payment' | 'ordinals'
}
