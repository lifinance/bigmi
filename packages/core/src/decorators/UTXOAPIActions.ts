import {
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '../actions/getBalance.js'
import type { Transport } from '../factories/createTransport.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'

export type UTXOAPIActions = {
  getBalance: (args: GetBalanceParameters) => Promise<GetBalanceReturnType>
}

export function UTXOAPIActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: Client<transport, chain, account>): UTXOAPIActions {
  return {
    getBalance: (args) => getBalance(client, args),
  }
}
