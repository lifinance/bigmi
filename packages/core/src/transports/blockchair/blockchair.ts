import type { HttpTransportConfig } from '../http.js'
import type { UTXOMethod } from '../types.js'
import { utxo } from '../utxo.js'
import { blockchairMethods } from './methods.js'

type BlockchairConfig = {
  baseUrl?: string
  apiKey?: string
} & HttpTransportConfig

export const blockchair = (config?: BlockchairConfig) =>
  utxo(config?.baseUrl || 'https://api.blockchair.com', {
    name: 'Blockchair API',
    key: 'blockchair',
    includeChainToURL: true,
    methods: {
      include: Object.keys(blockchairMethods) as UTXOMethod[],
    },
    ...config,
  })
