import { deepEqual } from '@bigmi/core'
import type { Config, Connector } from '../factories/createConfig.js'

export type GetConnectorsReturnType<config extends Config = Config> =
  config['connectors']

let previousConnectors: readonly Connector[] = []

export function getConnectors<config extends Config>(
  config: config
): GetConnectorsReturnType<config> {
  const connectors = config.connectors
  if (deepEqual(previousConnectors, connectors)) {
    return previousConnectors
  }
  previousConnectors = connectors
  return connectors
}
