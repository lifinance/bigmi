import type { RpcMethods } from '../types.js'
import { getBalance } from './getBalance.js'
import { getTransactions } from './getTransactions.js'
import { getUTXOs } from './getUTXOs.js'

export const ankrMethods: RpcMethods = {
  getBalance,
  getUTXOs,
  getTransactions,
}
