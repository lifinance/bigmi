import type { HttpTransportConfig } from '../http.js'
import { utxo } from '../utxo.js'

type BlockcypherConfig = {
  baseUrl?: string
  apiKey?: string
} & HttpTransportConfig

export const blockcypher = (config?: BlockcypherConfig) =>
  utxo(config?.baseUrl || 'https://api.blockcypher.com/v1/btc/main', {
    key: 'blockcypher',
    ...config,
  })
