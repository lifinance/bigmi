import type { TransportConfig } from '../../types/transport.js'
import type { HttpTransportConfig } from '../http.js'
import type { UTXOMethod } from '../types.js'
import { utxo } from '../utxo.js'
import { ankrMethods } from './methods.js'

type AnkrConfig = { baseUrl?: string; apiKey?: string } & HttpTransportConfig

export const ankr = (config?: AnkrConfig) => {
  const methods: TransportConfig['methods'] = {
    include: Object.keys(ankrMethods) as UTXOMethod[],
  }
  if (config?.baseUrl) {
    return utxo(config.baseUrl, { key: 'ankr', ...config, methods })
  }

  if (!config?.apiKey) {
    throw Error('Ankr API KEY is required')
  }
  return utxo(
    `https://rpc.ankr.com/premium-http/btc_blockbook/${config.apiKey}/api/v2`,
    {
      name: 'Ankr API',
      key: 'ankr',
      methods,
      ...config,
    }
  )
}
