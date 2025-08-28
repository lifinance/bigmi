import { ChainId } from '../types/chain.js'
import { defineChain } from './defineChain.js'

export const bitcoin = /*#__PURE__*/ defineChain({
  id: ChainId.BITCOIN_MAINNET,
  name: 'Bitcoin',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: {
    default: {
      http: ['https://node-router.thorswap.net/bitcoin'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mempool',
      url: 'https://mempool.space/',
    },
  },
})
