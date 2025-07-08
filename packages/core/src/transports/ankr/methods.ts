import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransactionFee } from './getTransactionFee.js'
import { getTransactions } from './getTransactions.js'

export const ankrMethods: RpcMethods = {
  getBalance,
  getTransactions,
  getTransactionFee,
}
