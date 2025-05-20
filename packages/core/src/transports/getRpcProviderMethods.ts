import { ankrMethods } from './ankr/methods.js'
import { blockchairMethods } from './blockchair/methods.js'
import { blockcypherMethods } from './blockcypher/methods.js'
import { mempoolMethods } from './mempool/methods.js'
import type { RpcMethods } from './types.js'

type providers = 'blockchair' | 'ankr' | 'blockcypher' | 'mempool' | string

export function getRpcProviderMethods(key: providers): RpcMethods | null {
  switch (key) {
    case 'blockchair':
      return blockchairMethods
    case 'ankr':
      return ankrMethods
    case 'blockcypher':
      return blockcypherMethods
    case 'mempool':
      return mempoolMethods
    default:
      return null
  }
}
