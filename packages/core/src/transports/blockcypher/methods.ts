import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransactionFee } from './getTransactionFee.js'
import { getUTXOs } from './getUTXOs.js'

export const blockcypherMethods: RpcMethods = {
  getBalance,
  getUTXOs,
  getTransactionFee,
}
