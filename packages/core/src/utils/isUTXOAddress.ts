import { type UTXONetwork, getUTXOAddress } from './getUTXOAddress.js'

export const isUTXOAddress = (
  address: string,
  network?: UTXONetwork
): boolean => {
  try {
    const utxoAddress = getUTXOAddress(address)

    if (network) {
      return network === utxoAddress.network
    }

    return true
  } catch (_error) {
    return false
  }
}
