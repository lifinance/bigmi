import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { UTXO } from '../types/transaction.js'
import type { Transport } from '../types/transport.js'

export type GetUTXOsParameters = {
  address: string
  minValue?: number // get utxos add up to this value
}

export type GetUTXOsReturnType = Array<UTXO>

export async function getUTXOs<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { address, minValue }: GetUTXOsParameters
): Promise<GetUTXOsReturnType> {
  const data = await client.request({
    method: 'getUTXOs',
    params: {
      address,
      minValue,
    },
  })
  return data
}
