'use client'

import {
  type GetAccountReturnType,
  getAccount,
  watchAccount,
} from '@bigmi/client'
import type { Config } from '@bigmi/core'
import type { ResolvedRegister } from '../types.js'
import { type ConfigParameter, useConfig } from './useConfig.js'
import { useSyncExternalStoreWithTracked } from './useSyncExternalStoreWithTracked.js'

export type UseAccountParameters<config extends Config = Config> =
  ConfigParameter<config>

export type UseAccountReturnType<config extends Config = Config> =
  GetAccountReturnType<config>

/** https://wagmi.sh/react/api/hooks/useAccount */
export function useAccount<C extends Config = ResolvedRegister['config']>(
  parameters: UseAccountParameters<C> = {}
): UseAccountReturnType<C> {
  const config = useConfig(parameters)

  return useSyncExternalStoreWithTracked(
    (onChange) => watchAccount(config, { onChange }),
    () => getAccount(config)
  )
}
