import {
  type SendUTXOTransactionParameters,
  type SendUTXOTransactionReturnType,
  sendUTXOTransaction,
} from '../../actions/sendUTXOTransaction.js'
import { signPsbt } from '../../actions/signPsbt.js'
import type {
  SignPsbtParameters,
  SignPsbtReturnType,
} from '../../transports/types.js'
import type { Account } from '../../types/account.js'
import type { Chain } from '../../types/chain.js'
import type { Client } from '../../types/client.js'
import type { Transport } from '../../types/transport.js'

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
