import {
  type SendUTXOTransactionParameters,
  type SendUTXOTransactionReturnType,
  sendUTXOTransaction,
} from '../../actions/sendUTXOTransaction.js'
import { signPsbt } from '../../actions/signPsbt.js'
import type { Transport } from '../../factories/createTransport.js'
import type { Account } from '../../types/account.js'
import type { Client } from '../../types/client.js'

import type { Chain } from '../../types/chain.js'
import type {
  SignPsbtParameters,
  SignPsbtReturnType,
} from '../../types/client.js'

export type WalletActions = {
  /**
   * Creates, signs, and sends a new transaction to the network.
   */
  sendUTXOTransaction: (
    args: SendUTXOTransactionParameters
  ) => Promise<SendUTXOTransactionReturnType>

  signPbst: (args: SignPsbtParameters) => Promise<SignPsbtReturnType>
}

export function walletActions<
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: Client<transport, chain, account>): WalletActions {
  return {
    sendUTXOTransaction: (args) => sendUTXOTransaction(client, args),
    signPbst: (args) => signPsbt(client, args),
  }
}
