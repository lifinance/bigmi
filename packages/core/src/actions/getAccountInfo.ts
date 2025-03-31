import type { Account, Chain, Client, Transport } from 'viem'
import type { BtcAccount, UTXOWalletSchema } from '../clients/types.js'

export async function getAddressInfo<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(client: Client<Transport, C, A, UTXOWalletSchema>): Promise<BtcAccount> {
  const data = await client.request(
    {
      method: 'addressInfo',
      params: [],
    },
    { dedupe: true }
  )
  return data
}
