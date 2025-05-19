import { TransactionsFetchError } from '../errors/transaction'
import type { UTXOSchema } from '../transports/types'
import type { Account } from '../types/account'
import type { Chain } from '../types/chain'
import type { Client } from '../types/client'
import type { UTXO } from '../types/transaction'
import type { Transport } from '../types/transport'

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
  try {
    return client.request({
      method: 'getUTXOs',
      params: {
        address,
        minValue,
      },
    })
  } catch (e: any) {
    console.error(e)
    throw new TransactionsFetchError({ address })
  }
}
