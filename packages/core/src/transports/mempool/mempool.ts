import type { HttpTransportConfig } from '../http.js'
import { utxo } from '../utxo.js'

type MempoolConfig = {
  baseUrl?: string
} & HttpTransportConfig

export const mempool = (config?: MempoolConfig) =>
  utxo(config?.baseUrl || 'https://mempool.space/api', {
    key: 'mempool',
    ...config,
  })
