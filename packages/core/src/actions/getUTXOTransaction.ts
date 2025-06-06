import { TransactionNotFoundError } from '../errors/transaction.js'
import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { UTXOTransaction } from '../types/transaction.js'
import type { Transport } from '../types/transport.js'

export type GetUTXOTransactionParameters = {
  /** The Id of the transaction */
  txId: string
  /** The block in which to look for the transaction */
  blockHash?: string
}

export type GetUTXOTransactionReturnType = UTXOTransaction

export async function getUTXOTransaction<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { txId, blockHash }: GetUTXOTransactionParameters
): Promise<GetUTXOTransactionReturnType> {
  try {
    const params: [string, boolean, string?] = [txId, true]
    if (blockHash) {
      params.push(blockHash)
    }
    const data = await client.request({
      method: 'getrawtransaction',
      params: params,
    })
    return data
  } catch (_error) {
    throw new TransactionNotFoundError({
      blockHash: blockHash as never,
      hash: txId as never,
    })
  }
}
