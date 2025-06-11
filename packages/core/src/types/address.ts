export type Address = string

export type AddressPurpose = 'payment' | 'ordinals' | 'stacks'

export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Regtest = 'regtest',
}

export enum AddressType {
  p2pkh = 'p2pkh',
  p2sh = 'p2sh',
  p2wpkh = 'p2wpkh',
  p2wsh = 'p2wsh',
  p2tr = 'p2tr',
}

export type AddressInfo = {
  bech32: boolean
  network: Network
  address: Address
  type: AddressType
  purpose: AddressPurpose
}
