import type { HttpTransportConfig } from '../http.js'
import { utxo } from '../utxo.js'

type AnkrConfig = { baseUrl?: string; apiKey?: string } & HttpTransportConfig

export const ankr = (config?: AnkrConfig) => {
  if (config?.baseUrl) {
    return utxo(config.baseUrl, { key: 'ankr', ...config })
  }

  if (!config?.apiKey) {
    throw Error('Ankr API KEY is required')
  }
  return utxo(
    `https://rpc.ankr.com/premium-http/btc_blockbook/${config.apiKey}/api/v2`,
    {
      key: 'ankr',
      ...config,
    }
  )
}
