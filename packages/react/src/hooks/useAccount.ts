'use client'

import {
  type Config,
  type GetAccountReturnType,
  getAccount,
  watchAccount,
} from '@bigmi/client'

import type { ResolvedRegister } from '../types.js'
import { type ConfigParameter, useConfig } from './useConfig.js'
import { useSyncExternalStoreWithTracked } from './useSyncExternalStoreWithTracked.js'

export type UseAccountParameters<config extends Config = Config> =
  ConfigParameter<config>

export type UseAccountReturnType<config extends Config = Config> =
  GetAccountReturnType<config>

const DISCONNECTED_ACCOUNT: GetAccountReturnType = {
  account: undefined,
  accounts: undefined,
  chain: undefined,
  chainId: undefined,
  connector: undefined,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
  isReconnecting: false,
  status: 'disconnected',
}

export function useAccount<C extends Config = ResolvedRegister['config']>(
  parameters: UseAccountParameters<C> = {}
): UseAccountReturnType<C> {
  const config = useConfig(parameters)

  return useSyncExternalStoreWithTracked(
    (onChange) => watchAccount(config, { onChange }),
    () => getAccount(config),
    () => DISCONNECTED_ACCOUNT as UseAccountReturnType<C>
  )
}
