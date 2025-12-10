import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { Transport } from '../types/transport.js'
import type { xPubAccount } from '../types/xpub.js'

export type GetXPubAddressesParameters = {
  /** The public key you're trying to get addresses of. */
  xPubKey: string
}

export type GetXPubAddressesReturnType = xPubAccount

/**
 * Retrieves all addresses and their balances associated with an extended public key (xPub).
 *
 * An extended public key (xPub) is a Bitcoin public key that can be used to derive multiple
 * child addresses. This action fetches all derived addresses along with their individual balances
 * and the total balance across all addresses.
 *
 * @param client - Client instance configured with UTXO transport
 * @param params - {@link GetXPubAddressesParameters}
 * @returns The xPub account data including total balance and all derived addresses. {@link GetXPubAddressesReturnType}
 *
 * @example
 * ```typescript
 * const result = await getXPubAddresses(client, {
 *   xPubKey: 'xpub6CcGTthbwnbxsMRuEF3sb...'
 * })
 *
 * console.log(result.balance) // Total balance across all addresses
 * console.log(result.addresses) // Array of derived addresses with individual balances
 * ```
 */
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
