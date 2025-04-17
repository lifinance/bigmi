import {
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '../../actions/getBalance.js'
import {
  type GetBlockParameters,
  type GetBlockReturnType,
  getBlock,
} from '../../actions/getBlock.js'
import {
  type GetBlockCountReturnType,
  getBlockCount,
} from '../../actions/getBlockCount.js'
import {
  type GetBlockStatsParameters,
  type GetBlockStatsReturnType,
  getBlockStats,
} from '../../actions/getBlockStats.js'
import {
  type GetUTXOTransactionParameters,
  type GetUTXOTransactionReturnType,
  getUTXOTransaction,
} from '../../actions/getUTXOTransaction.js'

import type { Client } from '../../factories/createClient.js'
import type { Transport } from '../../factories/createTransport.js'
import type { Account } from '../../types/account.js'

import type { Chain } from '../../types/chain.js'

export type PublicActions = {
  getBalance: (args: GetBalanceParameters) => Promise<GetBalanceReturnType>

  getBlockCount: () => Promise<GetBlockCountReturnType>

  getBlockStats: (
    args: GetBlockStatsParameters
  ) => Promise<GetBlockStatsReturnType>

  getUTXOTransaction: (
    args: GetUTXOTransactionParameters
  ) => Promise<GetUTXOTransactionReturnType>

  getBlock: (args: GetBlockParameters) => Promise<GetBlockReturnType>
}

export function PublicActions<
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: Client<transport, chain, account>): PublicActions {
  return {
    getBlock: (args) => getBlock(client, args),
    getBalance: (args) => getBalance(client, args),
    getBlockCount: () => getBlockCount(client),
    getBlockStats: (args) => getBlockStats(client, args),
    getUTXOTransaction: (args) => getUTXOTransaction(client, args),
  }
}
