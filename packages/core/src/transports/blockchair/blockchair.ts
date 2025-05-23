import type { HttpTransportConfig } from '../http.js'
import { utxo } from '../utxo.js'

type BlockchairConfig = {
  baseUrl?: string
  apiKey?: string
} & HttpTransportConfig

export const blockchair = (config: BlockchairConfig) =>
  utxo(config?.baseUrl || 'https://api.blockchair.com', {
    key: 'blockchair',
    includeChainToURL: true,
    ...config,
  })
