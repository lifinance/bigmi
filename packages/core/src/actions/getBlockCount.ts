import type { Transport } from '../factories/createTransport.js'
import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'

export type GetBlockCountReturnType = number

export async function getBlockCount<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>
): Promise<GetBlockCountReturnType> {
  const data = await client.request(
    {
      method: 'getblockcount',
      params: [],
    },
    { dedupe: true }
  )
  return data
}
