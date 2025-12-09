import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransactionFee } from './getTransactionFee.js'
import { getUTXOs } from './getUTXOs.js'
import { getXPubAddresses } from './getXPubAddresses.js'

export const blockchairMethods: RpcMethods = {
  getBalance,
  getUTXOs,
  getTransactionFee,
  getXPubAddresses,
}
