import type { Address } from '../types/address.js'
import { type UTXONetwork, getUTXOAddress } from './getUTXOAddress.js'

export const isUTXOAddress = (
  address: string,
  network?: UTXONetwork
): boolean => {
  try {
    const utxoAddress = getUTXOAddress(address as Address)

    if (network) {
      return network === utxoAddress.network
    }

    return true
  } catch (_error) {
    return false
  }
}
