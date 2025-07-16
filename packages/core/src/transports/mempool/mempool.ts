import type { HttpTransportConfig } from '../http.js'
import type { UTXOMethod } from '../types.js'
import { utxo } from '../utxo.js'
import { mempoolMethods } from './methods.js'

type MempoolConfig = {
  baseUrl?: string
} & HttpTransportConfig

export const mempool = (config?: MempoolConfig) =>
  utxo(config?.baseUrl || 'https://mempool.space/api', {
    name: 'Mempool.space API',
    key: 'mempool',
    methods: {
      include: Object.keys(mempoolMethods) as UTXOMethod[],
    },
    ...config,
  })
