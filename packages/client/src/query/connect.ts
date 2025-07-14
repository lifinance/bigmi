import type { Compute } from '@bigmi/core'
import type { MutateOptions, MutationOptions } from '@tanstack/query-core'
import {
  type ConnectErrorType,
  type ConnectParameters,
  type ConnectReturnType,
  connect,
} from '../actions/connect.js'
import type { Config } from '../factories/createConfig.js'
import type { Connector, CreateConnectorFn } from '../types/connector.js'

export function connectMutationOptions<config extends Config>(config: config) {
  return {
    mutationFn(variables) {
      return connect(config, variables)
    },
    mutationKey: ['connect'],
  } as const satisfies MutationOptions<
    ConnectData<config>,
    ConnectErrorType,
    ConnectVariables<config, Connector | CreateConnectorFn>
  >
}

export type ConnectData<config extends Config> = ConnectReturnType<config>

export type ConnectVariables<
  config extends Config,
  connector extends Connector | CreateConnectorFn,
> = ConnectParameters<config, connector>

export type ConnectMutate<config extends Config, context = unknown> = <
  connector extends
    | config['connectors'][number]
    | Connector
    | CreateConnectorFn,
>(
  variables: ConnectVariables<config, connector>,
  options?:
    | Compute<
        MutateOptions<
          ConnectData<config>,
          ConnectErrorType,
          Compute<ConnectVariables<config, connector>>,
          context
        >
      >
    | undefined
) => void

export type ConnectMutateAsync<config extends Config, context = unknown> = <
  connector extends
    | config['connectors'][number]
    | Connector
    | CreateConnectorFn,
>(
  variables: ConnectVariables<config, connector>,
  options?:
    | Compute<
        MutateOptions<
          ConnectData<config>,
          ConnectErrorType,
          Compute<ConnectVariables<config, connector>>,
          context
        >
      >
    | undefined
) => Promise<ConnectData<config>>
