'use client'

import {
  type Config,
  type ConnectData,
  type ConnectErrorType,
  type ConnectMutate,
  type ConnectMutateAsync,
  type ConnectVariables,
  connectMutationOptions,
} from '@bigmi/client'
import type { Compute } from '@bigmi/core'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ResolvedRegister } from '../types.js'
import type {
  UseMutationParameters,
  UseMutationReturnType,
} from '../utils/query.js'
import { type ConfigParameter, useConfig } from './useConfig.js'
import { type UseConnectorsReturnType, useConnectors } from './useConnectors.js'

export type UseConnectParameters<
  config extends Config = Config,
  context = unknown,
> = Compute<
  ConfigParameter<config> & {
    mutation?:
      | UseMutationParameters<
          ConnectData<config>,
          ConnectErrorType,
          ConnectVariables<config, config['connectors'][number]>,
          context
        >
      | undefined
  }
>

export type UseConnectReturnType<
  config extends Config = Config,
  context = unknown,
> = Compute<
  UseMutationReturnType<
    ConnectData<config>,
    ConnectErrorType,
    ConnectVariables<config, config['connectors'][number]>,
    context
  > & {
    connect: ConnectMutate<config, context>
    connectAsync: ConnectMutateAsync<config, context>
    connectors: Compute<UseConnectorsReturnType> | config['connectors']
  }
>

export function useConnect<
  config extends Config = ResolvedRegister['config'],
  context = unknown,
>(
  parameters: UseConnectParameters<config, context> = {}
): UseConnectReturnType<config, context> {
  const { mutation } = parameters

  const config = useConfig(parameters)

  const mutationOptions = connectMutationOptions(config)
  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  })

  // Reset mutation back to an idle state when the connector disconnects.
  useEffect(() => {
    return config.subscribe(
      ({ status }) => status,
      (status, previousStatus) => {
        if (previousStatus === 'connected' && status === 'disconnected') {
          result.reset()
        }
      }
    )
  }, [config, result.reset])

  type Return = UseConnectReturnType<config, context>
  return {
    ...(result as Return),
    connect: mutate as Return['connect'],
    connectAsync: mutateAsync as Return['connectAsync'],
    connectors: useConnectors({ config }),
  }
}
