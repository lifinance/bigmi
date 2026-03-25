import type { HttpTransport, HttpTransportConfig } from '../http.js'
import type { UTXOMethod } from '../types.js'
import { utxo } from '../utxo.js'
import { blockcypherMethods } from './methods.js'

type BlockcypherConfig = {
  baseUrl?: string
  apiKey?: string
} & HttpTransportConfig

export const blockcypher = (config?: BlockcypherConfig): HttpTransport =>
  utxo(config?.baseUrl || 'https://api.blockcypher.com/v1/btc/main', {
    name: 'Blockcypher API',
    key: 'blockcypher',
    methods: {
      include: Object.keys(blockcypherMethods) as UTXOMethod[],
    },
    ...config,
  })
