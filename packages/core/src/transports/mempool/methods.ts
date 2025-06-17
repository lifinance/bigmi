import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransactionFee } from './getTransactionFee.js'
import { getTransactions } from './getTransactions.js'

export const mempoolMethods: RpcMethods = {
  getBalance,
  getTransactions,
  getTransactionFee,
}
