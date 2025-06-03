import {
  type Account,
  type AddressPurpose,
  type AddressType,
  BaseError,
} from '@bigmi/core'

export const getAccountFromAddressAndPublicKey = (
  address: string,
  publicKey: string
): Account => {
  return {
    address,
    purpose: getAccountPurpose(address),
    addressType: getAddressType(address),
    publicKey,
  }
}

export const getAccountPurpose = (address: string): AddressPurpose => {
  if (address.startsWith('bc1p') || address.startsWith('tc1p')) {
    return 'ordinals'
  }
  if (address.startsWith('s')) {
    return 'stacks'
  }
  if (address.startsWith('bc1q')) {
    return 'payment'
  }
  throw new BaseError('Invalid bitcoin address')
}

export const getAddressType = (address: string): AddressType => {
  if (address.startsWith('1')) {
    return 'p2pkh'
  }
  if (address.startsWith('3')) {
    return 'p2sh'
  }
  if (address.startsWith('bc1p')) {
    return 'p2tr'
  }
  if (address.startsWith('bc1q')) {
    if (address.length === 42) {
      return 'p2wpkh'
    }
    return 'p2wsh'
  }
  throw new BaseError('Invalid bitcoin address')
}
