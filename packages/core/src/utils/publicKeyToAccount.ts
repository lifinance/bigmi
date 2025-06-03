import { networks, payments } from 'bitcoinjs-lib'
import { BaseError } from '../errors/base.js'
import type { Account, AddressType } from '../types/account.js'
import { UTXONetwork } from './getUTXOAddress.js'

type publicKeyToAccountParams = {
  network?: UTXONetwork
  addressType?: AddressType
}

export const publicKeyToAccount = (
  publicKey: string,
  {
    addressType = 'p2pkh',
    network = UTXONetwork.Mainnet,
  }: publicKeyToAccountParams = {}
): Account => {
  // Convert network enum to bitcoinjs network
  const bitcoinNetwork =
    network === UTXONetwork.Mainnet ? networks.bitcoin : networks.testnet

  if (!payments[addressType]) {
    throw new BaseError('Address type not supported')
  }

  const { address } = payments[addressType]({
    pubkey: Uint8Array.from(publicKey),
    network: bitcoinNetwork,
  })

  if (!address) {
    throw new BaseError('Failed to get address from public key')
  }

  return {
    address,
    addressType,
    publicKey,
    purpose: 'payment',
  }
}
