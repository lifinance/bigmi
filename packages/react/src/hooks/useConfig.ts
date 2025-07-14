'use client'

import type { Config } from '@bigmi/client'
import { useContext } from 'react'
import { BigmiContext } from '../context.js'
import { BigmiProviderNotFoundError } from '../errors/context.js'
import type { ResolvedRegister } from '../types.js'

export type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined
}

export type UseConfigParameters<config extends Config = Config> =
  ConfigParameter<config>

export type UseConfigReturnType<config extends Config = Config> = config

export function useConfig<C extends Config = ResolvedRegister['config']>(
  parameters: UseConfigParameters<C> = {}
): UseConfigReturnType<C> {
  // biome-ignore lint/correctness/useHookAtTopLevel: part of the hook
  const config = parameters.config ?? useContext(BigmiContext)
  if (!config) {
    throw new BigmiProviderNotFoundError()
  }
  return config as UseConfigReturnType<C>
}
