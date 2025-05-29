import type {
  SignPsbtParameters,
  SignPsbtReturnType,
  UTXOWalletSchema,
} from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { Transport } from '../types/transport.js'

export async function signPsbt<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOWalletSchema>,
  params: SignPsbtParameters
): Promise<SignPsbtReturnType> {
  const data = await client.request(
    {
      method: 'signPsbt',
      params: params,
    },
    { dedupe: true }
  )
  return data
}
