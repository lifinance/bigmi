import { defineChain } from './defineChain.js'

export const bitcoin = /*#__PURE__*/ defineChain({
  id: 20000000000001,
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
