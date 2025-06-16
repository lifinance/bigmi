import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { UTXOTransaction } from '../types/transaction.js'
import type { Transport } from '../types/transport.js'

export type GetTransactionParameters = {
  txId: string
}

export type GetTransactionReturnType = {
  transaction: Partial<UTXOTransaction>
}

export async function getTransaction<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { txId }: GetTransactionParameters
): Promise<GetTransactionReturnType> {
  const data = await client.request({
    method: 'getTransaction',
    params: {
      txId,
    },
  })

  return data
}
