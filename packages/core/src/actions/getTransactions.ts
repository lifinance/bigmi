import { TransactionsFetchError } from '../errors/transaction'
import type { UTXOSchema } from '../transports/types'
import type { Account } from '../types/account'
import type { Chain } from '../types/chain'
import type { Client } from '../types/client'
import type { UTXOTransaction } from '../types/transaction'
import type { Transport } from '../types/transport'

export type GetTransactionsParameters = {
  address: string
  offset?: number
  limit?: number
  lastBlock?: string
}

export type GetTransactionsReturnType = {
  transactions: Array<Partial<UTXOTransaction>>
  total: number
  itemsPerPage: number
  hasMore: boolean
}

export async function getTransactions<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { address, offset, limit, lastBlock }: GetTransactionsParameters
): Promise<GetTransactionsReturnType> {
  try {
    return client.request({
      method: 'getTransactions',
      params: {
        address,
        offset,
        limit,
        lastBlock,
      },
    })
  } catch (_error) {
    throw new TransactionsFetchError({ address })
  }
}
