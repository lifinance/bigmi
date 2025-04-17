import {
  type GetBlockCountReturnType,
  getBlockCount,
} from '../actions/getBlockCount.js'
import {
  type GetUTXOTransactionParameters,
  type GetUTXOTransactionReturnType,
  getUTXOTransaction,
} from '../actions/getUTXOTransaction.js'
import {
  type SendUTXOTransactionParameters,
  type SendUTXOTransactionReturnType,
  sendUTXOTransaction,
} from '../actions/sendUTXOTransaction.js'
import type { Transport } from '../factories/createTransport.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'

export type UTXOActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = {
  getBlockCount: (
    client: Client<transport, chain, account>
  ) => Promise<GetBlockCountReturnType>
  sendUTXOTransaction: (
    args: SendUTXOTransactionParameters
  ) => Promise<SendUTXOTransactionReturnType>
  getUTXOTransaction: (
    args: GetUTXOTransactionParameters
  ) => Promise<GetUTXOTransactionReturnType>
}

export function UTXOActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(
  client: Client<transport, chain, account>
): UTXOActions<transport, chain, account> {
  return {
    getBlockCount: (client) => getBlockCount(client),
    sendUTXOTransaction: (args) => sendUTXOTransaction(client, args),
    getUTXOTransaction: (args) => getUTXOTransaction(client, args),
  }
}
