import { TransactionsFetchError } from '../errors/transaction'
import type { UTXOSchema } from '../transports/types'
import type { Account } from '../types/account'
import type { Chain } from '../types/chain'
import type { Client } from '../types/client'
import type { UTXOTransaction } from '../types/transaction'
import type { Transport } from '../types/transport'

export type GetTransactionsParameters = {
  address: string
}

export type GetTransactionsReturnType = {
  transactions: Array<Partial<UTXOTransaction>>
  total: number
  page: number
  itemsPerPage: number
}

export async function getTransactions<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { address }: GetTransactionsParameters
): Promise<AsyncGenerator<GetTransactionsReturnType>> {
  try {
    return client.request({
      method: 'getTransactions',
      params: {
        address,
      },
    })
  } catch (_error) {
    throw new TransactionsFetchError({ address })
  }
}
