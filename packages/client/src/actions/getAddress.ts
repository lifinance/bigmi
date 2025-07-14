import type { Address } from '@bigmi/core'
import { InvalidAddressError, isUTXOAddress } from '@bigmi/core'

export function getAddress(address: string): Address {
  if (!isUTXOAddress(address)) {
    throw new InvalidAddressError({ address })
  }
  return address as Address
}
