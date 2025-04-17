export type BtcAccount = {
  address: string
  addressType: 'p2tr' | 'p2wpkh' | 'p2wsh' | 'p2sh' | 'p2pkh'
  publicKey: string
  purpose: 'payment' | 'ordinals'
}

export type Account = BtcAccount
