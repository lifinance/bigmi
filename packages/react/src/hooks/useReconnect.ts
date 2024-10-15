import { reconnect } from '@bigmi/client'
import { useEffect } from 'react'
import type { Config } from 'wagmi'

export const useReconnect = (config: Config) => {
  useEffect(() => {
    reconnect(config)
  }, [config])
}
