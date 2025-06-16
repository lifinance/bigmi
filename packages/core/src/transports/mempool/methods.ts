import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransaction } from './getTransaction.js'
import { getTransactions } from './getTransactions.js'

export const mempoolMethods: RpcMethods = {
  getBalance,
  getTransactions,
  getTransaction,
}
