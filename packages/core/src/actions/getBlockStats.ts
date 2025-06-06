import { BlockNotFoundError } from '../errors/block.js'
import type { UTXOSchema } from '../transports/types.js'
import type { Account } from '../types/account.js'
import type { BlockStats, BlockStatsKeys } from '../types/blockStats.js'
import type { Chain } from '../types/chain.js'
import type { Client } from '../types/client.js'
import type { Transport } from '../types/transport.js'

export type GetBlockStatsParameters = (
  | {
      blockHash: string
      blockNumber?: never
    }
  | {
      blockHash?: never
      blockNumber: number
    }
) & {
  stats?: Array<BlockStatsKeys>
}

export type GetBlockStatsReturnType = BlockStats

export async function getBlockStats<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, UTXOSchema>,
  { blockHash, blockNumber, stats }: GetBlockStatsParameters
): Promise<GetBlockStatsReturnType> {
  const blockHashOrNumber = blockHash || blockNumber
  if (!blockHashOrNumber) {
    throw new BlockNotFoundError({ blockHash, blockNumber } as never)
  }
  try {
    const params: [string | number, Array<BlockStatsKeys>?] = [
      blockHashOrNumber,
    ]
    if (stats) {
      params.push(stats)
    }
    const data = await client.request(
      {
        method: 'getblockstats',
        params: params,
      },
      { dedupe: true }
    )
    return data
  } catch (_error) {
    throw new BlockNotFoundError({ blockHash, blockNumber } as never)
  }
}
