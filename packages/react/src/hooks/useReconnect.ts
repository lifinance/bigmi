import { reconnect } from '@bigmi/client'
import type { Config } from '@bigmi/core'
import { useEffect } from 'react'

export const useReconnect = (config: Config) => {
  useEffect(() => {
    reconnect(config)
  }, [config])
}
