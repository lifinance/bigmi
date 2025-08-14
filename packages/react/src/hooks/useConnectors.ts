'use client'

import {
  type Config,
  type GetConnectorsReturnType,
  getConnectors,
  watchConnectors,
} from '@bigmi/client'
import { useSyncExternalStore } from 'react'
import type { ResolvedRegister } from '../types.js'
import { type ConfigParameter, useConfig } from './useConfig.js'

export type UseConnectorsParameters<config extends Config = Config> =
  ConfigParameter<config>

export type UseConnectorsReturnType<config extends Config = Config> =
  GetConnectorsReturnType<config>

export function useConnectors<
  config extends Config = ResolvedRegister['config'],
>(
  parameters: UseConnectorsParameters<config> = {}
): UseConnectorsReturnType<config> {
  const config = useConfig(parameters)

  return useSyncExternalStore(
    (onChange) => watchConnectors(config, { onChange }),
    () => getConnectors(config),
    () => getConnectors(config)
  )
}
