import {
  getBalance,
  type GetBalanceParameters,
  type GetBalanceReturnType,
} from '../../actions/getBalance.js'
import {
  getBlock,
  type GetBlockParameters,
  type GetBlockReturnType,
} from '../../actions/getBlock.js'
import {
  getBlockCount,
  type GetBlockCountReturnType,
} from '../../actions/getBlockCount.js'
import {
  getBlockStats,
  type GetBlockStatsParameters,
  type GetBlockStatsReturnType,
} from '../../actions/getBlockStats.js'
import {
  getTransactionFee,
  type GetTransactionFeeParameters,
  type GetTransactionFeeReturnType,
} from '../../actions/getTransactionFee.js'
import {
  getTransactions,
  type GetTransactionsParameters,
  type GetTransactionsReturnType,
} from '../../actions/getTransactions.js'
import {
  getUTXOs,
  type GetUTXOsParameters,
  type GetUTXOsReturnType,
} from '../../actions/getUTXOs.js'
import {
  getUTXOTransaction,
  type GetUTXOTransactionParameters,
  type GetUTXOTransactionReturnType,
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
