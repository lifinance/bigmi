import type { Transport } from '../factories/createTransport.js'
import type { UTXOAPISchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'

export type GetBalanceParameters = {
  /** The address of the account. */
  address: string
}

export type GetBalanceReturnType = bigint

export async function getBalance<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOAPISchema>,
  params: GetBalanceParameters
): Promise<GetBalanceReturnType> {
  const data = await client.request(
    {
      method: 'getBalance',
      params,
    },
    { dedupe: true }
  )
  return data
}
