import { sha256 } from '@noble/hashes/sha256'
import { bech32, bech32m, type Decoded } from 'bech32'
import bs58 from 'bs58'

import {
  type Address,
  type AddressInfo,
  type AddressPurpose,
  AddressType,
} from '../types/address.js'
import { ChainId, Network } from '../types/chain.js'

const addressTypes: {
  [key: number]: { type: AddressType; network: Network }
} = {
  0: {
    type: AddressType.p2pkh,
    network: Network.Mainnet,
  },
  111: {
    type: AddressType.p2pkh,
    network: Network.Testnet,
  },
  5: {
    type: AddressType.p2sh,
    network: Network.Mainnet,
  },
  196: {
    type: AddressType.p2sh,
    network: Network.Testnet,
  },
}

const parseBech32 = (address: Address): AddressInfo => {
  let decoded: Decoded

  try {
    if (
      address.startsWith('bc1p') ||
      address.startsWith('tb1p') ||
      address.startsWith('bcrt1p')
    ) {
      decoded = bech32m.decode(address)
    } else {
      decoded = bech32.decode(address)
    }
  } catch (_error) {
    throw new Error('Invalid address')
  }

  const mapPrefixToNetwork: { [key: string]: Network } = {
    bc: Network.Mainnet,
    tb: Network.Testnet,
    bcrt: Network.Regtest,
  }

  const network: Network = mapPrefixToNetwork[decoded.prefix]

  if (network === undefined) {
    throw new Error('Invalid address')
  }

  const witnessVersion = decoded.words[0]

  if (witnessVersion < 0 || witnessVersion > 16) {
    throw new Error('Invalid address')
  }
  const data = bech32.fromWords(decoded.words.slice(1))

  let type: AddressType
  if (data.length === 20) {
    type = AddressType.p2wpkh
  } else if (witnessVersion === 1) {
    type = AddressType.p2tr
  } else {
    type = AddressType.p2wsh
  }

  const purpose = getAddressPurpose(type)

  return {
    bech32: true,
    network,
    address,
    type,
    purpose,
  }
}

export const getAddressInfo = (address: Address): AddressInfo => {
  let decoded: Uint8Array
  const prefix = address.substring(0, 2).toLowerCase()

  if (prefix === 'bc' || prefix === 'tb') {
    return parseBech32(address)
  }

  try {
    decoded = bs58.decode(address)
  } catch (_error) {
    throw new Error('Invalid address')
  }

  const { length } = decoded

  if (length !== 25) {
    throw new Error('Invalid address')
  }

  const version = decoded[0]

  const checksum = decoded.slice(length - 4, length)
  const body = decoded.slice(0, length - 4)

  const expectedChecksum = sha256(sha256(body)).slice(0, 4)

  if (
    checksum.some(
      (value: number, index: number) => value !== expectedChecksum[index]
    )
  ) {
    throw new Error('Invalid address')
  }

  const validVersions = Object.keys(addressTypes).map(Number)

  if (!validVersions.includes(version)) {
    throw new Error('Invalid address')
  }

  const addressType = addressTypes[version]

  return {
    ...addressType,
    address,
    bech32: false,
    purpose: getAddressPurpose(addressType.type),
  }
}

const getAddressPurpose = (type: AddressType): AddressPurpose => {
  switch (type) {
    case AddressType.p2tr:
      return 'ordinals'
    case AddressType.p2wsh:
      return 'stacks'
    case AddressType.p2wpkh:
    case AddressType.p2sh:
    case AddressType.p2pkh:
      return 'payment'
    default:
      throw new Error('Invalid address type')
  }
}

export const getAddressChainId = (address: Address): ChainId => {
  const addressInfo = getAddressInfo(address)

  switch (addressInfo.network) {
    case Network.Mainnet:
      return ChainId.BITCOIN_MAINNET
    case Network.Testnet:
      return ChainId.BITCOIN_TESTNET
    case Network.Regtest:
      return ChainId.BITCOIN_SIGNET
    default:
      return ChainId.BITCOIN_MAINNET
  }
}
