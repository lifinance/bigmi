import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { UTXOTransaction } from '../types/transaction.js'
import type { Transport } from '../types/transport.js'

export type GetTransactionsParameters = {
  address: string
  offset?: number
  limit?: number
  lastBlock?: string
  afterTxId?: string
}

export type GetTransactionsReturnType = {
  transactions: Array<Partial<UTXOTransaction>>
  total: number
  hasMore?: boolean
}

export async function getTransactions<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { address, offset, limit, lastBlock }: GetTransactionsParameters
): Promise<GetTransactionsReturnType> {
  const data = await client.request({
    method: 'getTransactions',
    params: {
      address,
      offset,
      limit,
      lastBlock,
    },
  })

  return data
}
