'use client'

import { type Config, reconnect } from '@bigmi/client'

import { useEffect } from 'react'

export const useReconnect = (config: Config) => {
  useEffect(() => {
    reconnect(config)
  }, [config])
}
