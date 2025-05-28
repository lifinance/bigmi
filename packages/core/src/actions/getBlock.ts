import { Block } from 'bitcoinjs-lib'
import { BlockNotFoundError } from '../errors/block.js'
import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { Transport } from '../types/transport.js'

export type GetBlockParameters =
  | {
      blockHash: string
      blockNumber?: never
    }
  | {
      blockHash?: never
      blockNumber: number
    }

export type GetBlockReturnType = Block

export async function getBlock<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { blockHash, blockNumber }: GetBlockParameters
): Promise<GetBlockReturnType> {
  let blockHex: string | undefined
  try {
    let _blockHash = blockHash
    if (!_blockHash && blockNumber) {
      _blockHash = await client.request(
        {
          method: 'getblockhash',
          params: [blockNumber],
        },
        { dedupe: true }
      )
    }
    if (_blockHash) {
      blockHex = await client.request(
        {
          method: 'getblock',
          params: [_blockHash, 0],
        },
        { dedupe: true }
      )
    }
  } catch (_error) {
    throw new BlockNotFoundError({ blockHash, blockNumber } as never)
  }
  if (!blockHex) {
    throw new BlockNotFoundError({ blockHash, blockNumber } as never)
  }
  return Block.fromHex(blockHex)
}
