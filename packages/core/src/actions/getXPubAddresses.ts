import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Address } from '../types/address.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { Transport } from '../types/transport.js'

export type GetXPubAddressesParameters = {
  /** The public key you're trying to get addresses of. */
  xPubKey: string
}

export type GetXPubAddressesReturnType = {
  meta: {
    balance: bigint
  }
  addresses: Array<{
    address: Address
    balance: bigint
  }>
}

export async function getXPubAddresses<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  params: GetXPubAddressesParameters
): Promise<GetXPubAddressesReturnType> {
  const data = await client.request(
    {
      method: 'getXPubAddresses',
      params,
    },
    { dedupe: true }
  )

  return data
}
