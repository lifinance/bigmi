import {
  type Account,
  type Compute,
  type ErrorType,
  retryUntil,
  withTimeout,
} from '@bigmi/core'
import type { Config } from '../factories/createConfig.js'
import type { Connection } from '../types/connection.js'
import type { Connector, CreateConnectorFn } from '../types/connector.js'

let isReconnecting = false

export type ReconnectParameters = {
  /** Connectors to attempt reconnect with */
  connectors?: readonly (CreateConnectorFn | Connector)[] | undefined
}

export type ReconnectReturnType = Compute<Connection>[]

export type ReconnectErrorType = ErrorType

export async function reconnect(
  config: Config,
  parameters: ReconnectParameters = {}
): Promise<ReconnectReturnType> {
  // If already reconnecting, do nothing

  if (isReconnecting) {
    return []
  }
  isReconnecting = true

  config.setState((x) => ({
    ...x,
    status: x.current ? 'reconnecting' : 'connecting',
  }))

  const connectors: Connector[] = []
  if (parameters.connectors?.length) {
    for (const connector_ of parameters.connectors) {
      let connector: Connector
      // "Register" connector if not already created
      if (typeof connector_ === 'function') {
        connector = config._internal.connectors.setup(connector_)
      } else {
        connector = connector_
      }
      connectors.push(connector)
    }
  } else {
    connectors.push(...config.connectors)
  }

  // Try recently-used connectors first
  let recentConnectorId: string | null | undefined
  try {
    recentConnectorId = await config.storage?.getItem('recentConnectorId')
  } catch {}
  const scores: Record<string, number> = {}
  for (const [, connection] of config.state.connections) {
    scores[connection.connector.id] = 1
  }
  if (recentConnectorId) {
    scores[recentConnectorId] = 0
  }
  const sorted =
    Object.keys(scores).length > 0
      ? // .toSorted()
        [...connectors].sort(
          (a, b) => (scores[a.id] ?? 10) - (scores[b.id] ?? 10)
        )
      : connectors

  // Add this before the connectionPromises mapping
  const processedProviders = new Set()

  // Try to connect to each connector in parallel
  const connectionPromises = sorted.map(async (connector) => {
    try {
      // Check provider - poll every 100ms for up to 5s waiting for browser extension to inject it
      const provider = await retryUntil(
        () => connector.getProvider().catch(() => undefined),
        { timeout: 5000, interval: 100 }
      )
      if (!provider) {
        return null
      }

      // If we already have an instance of this connector's provider,
      // then we don't want to connect to it again
      if (processedProviders.has(provider)) {
        return null
      }
      processedProviders.add(provider)

      // Check authorization
      const isAuthorized = await withTimeout(() => connector.isAuthorized(), {
        timeout: 5000,
      })
      if (!isAuthorized) {
        return null
      }

      // Attempt connection
      const data = await withTimeout(
        () => connector.connect({ isReconnecting: true }),
        { timeout: 5000 }
      )
      if (!data || !data.accounts || data.accounts.length === 0) {
        return null
      }

      // Setup events
      connector.emitter.off('connect', config._internal.events.connect)
      connector.emitter.on('change', config._internal.events.change)
      connector.emitter.on('disconnect', config._internal.events.disconnect)

      // Update config state immediately when this connector succeeds
      config.setState((x) => {
        const connections = new Map(x.connections)
        connections.set(connector.uid, {
          accounts: data.accounts as readonly [Account, ...Account[]],
          chainId: data.chainId,
          connector,
        })

        return {
          ...x,
          connections,
          current: x.current || connector.uid, // Set as current if none exists
          status: 'connected',
        }
      })

      return { connector, data }
    } catch {
      return null
    }
  })

  const connectionResults = await Promise.allSettled(connectionPromises)

  const connections: Connection[] = []

  for (const result of connectionResults) {
    if (result.status === 'fulfilled' && result.value) {
      const { connector, data } = result.value
      connections.push({
        accounts: data.accounts as readonly [Account, ...Account[]],
        chainId: data.chainId,
        connector,
      })
    }
  }

  if (connections.length === 0) {
    config.setState((x) => ({
      ...x,
      status: 'disconnected',
    }))
  }

  isReconnecting = false
  return connections
}
