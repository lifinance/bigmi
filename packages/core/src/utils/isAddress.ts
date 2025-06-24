import type { Address, Network } from '../types/address.js'
import { getAddressInfo } from './getAddressInfo.js'

export const isAddress = (address: string, network?: Network): boolean => {
  try {
    const addressInfo = getAddressInfo(address as Address)

    if (network) {
      return network === addressInfo.network
    }

    return true
  } catch (_error) {
    return false
  }
}
