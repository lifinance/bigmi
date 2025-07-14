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
  type GetTransactionFeeParameters,
  type GetTransactionFeeReturnType,
  getTransactionFee,
} from '../../actions/getTransactionFee.js'
import {
  type GetTransactionsParameters,
  type GetTransactionsReturnType,
  getTransactions,
} from '../../actions/getTransactions.js'
import {
  type GetUTXOsParameters,
  type GetUTXOsReturnType,
  getUTXOs,
} from '../../actions/getUTXOs.js'
import {
  type GetUTXOTransactionParameters,
  type GetUTXOTransactionReturnType,
  getUTXOTransaction,
} from '../../actions/getUTXOTransaction.js'

import type { Client } from '../../factories/createClient.js'
import type { UTXOSchema } from '../../transports/types.js'
import type { Account } from '../../types/account.js'
import type { Chain } from '../../types/chain.js'
import type { Transport } from '../../types/transport.js'

export type PublicActions = {
  getBalance: (args: GetBalanceParameters) => Promise<GetBalanceReturnType>
  getBlock: (args: GetBlockParameters) => Promise<GetBlockReturnType>
  getBlockCount: () => Promise<GetBlockCountReturnType>
  getBlockStats: (
    args: GetBlockStatsParameters
  ) => Promise<GetBlockStatsReturnType>
  getTransactions: (
    args: GetTransactionsParameters
  ) => Promise<GetTransactionsReturnType>
  getUTXOTransaction: (
    args: GetUTXOTransactionParameters
  ) => Promise<GetUTXOTransactionReturnType>
  getUTXOs: (args: GetUTXOsParameters) => Promise<GetUTXOsReturnType>
  getTransactionFee: (
    args: GetTransactionFeeParameters
  ) => Promise<GetTransactionFeeReturnType>
}

export function publicActions<
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
  schema extends UTXOSchema = UTXOSchema,
>(client: Client<transport, chain, account, schema>): PublicActions {
  return {
    getBalance: (args) => getBalance(client, args),
    getBlock: (args) => getBlock(client, args),
    getBlockCount: () => getBlockCount(client),
    getBlockStats: (args) => getBlockStats(client, args),
    getTransactions: (args) => getTransactions(client, args),
    getUTXOTransaction: (args) => getUTXOTransaction(client, args),
    getUTXOs: (args) => getUTXOs(client, args),
    getTransactionFee: (args) => getTransactionFee(client, args),
  }
}
