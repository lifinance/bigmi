import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { Transport } from '../types/transport.js'

export type GetTransactionFeeParameters = {
  txId: string
}

export type GetTransactionFeeReturnType = bigint

export async function getTransactionFee<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { txId }: GetTransactionFeeParameters
): Promise<GetTransactionFeeReturnType> {
  const data = await client.request({
    method: 'getTransactionFee',
    params: { txId },
  })

  return data
}
