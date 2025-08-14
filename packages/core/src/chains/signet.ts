import { ChainId } from '../types/chain.js'
import { defineChain } from './defineChain.js'

export const bitcoinSignet = /*#__PURE__*/ defineChain({
  id: ChainId.BITCOIN_SIGNET,
  name: 'Bitcoin Signet',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.ankr.com/btc_signet/c58ee1c627c5ad7cd69197c352aa51bdcebd87b86e0363c1e5133d5735cb3c69',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mempool',
      url: 'https://mempool.space/signet',
    },
  },
  testnet: true,
})
