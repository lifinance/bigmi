import type {
  Config,
  Connection,
  Connector,
} from '../factories/createConfig.js'
import type { ConnectorParameter } from './getConnectorClient.js'

export type DisconnectParameters = ConnectorParameter

export type DisconnectReturnType = void

export async function disconnect(
  config: Config,
  parameters: DisconnectParameters = {}
): Promise<DisconnectReturnType> {
  let connector: Connector | undefined
  if (parameters.connector) {
    connector = parameters.connector
  } else {
    const { connections, current } = config.state
    const connection = connections.get(current!)
    connector = connection?.connector
  }

  const connections = config.state.connections

  let disconnectError: unknown
  if (connector) {
    // A provider that has gone away cannot be kept connected: leaving its
    // connection in place promotes it to `current`, so the store still reports
    // an account that can never sign. Detach it either way, and surface the
    // failure to the caller once the state is consistent.
    try {
      await connector.disconnect()
    } catch (error) {
      disconnectError = error
    }
    connector.emitter.off('change', config._internal.events.change)
    connector.emitter.off('disconnect', config._internal.events.disconnect)
    connector.emitter.on('connect', config._internal.events.connect)

    connections.delete(connector.uid)
  }

  config.setState((x) => {
    // if no connections exist, move to disconnected state
    if (connections.size === 0) {
      return {
        ...x,
        connections: new Map(),
        current: null,
        status: 'disconnected',
      }
    }

    // switch over to another connection
    const nextConnection = connections.values().next().value as Connection
    return {
      ...x,
      connections: new Map(connections),
      current: nextConnection.connector.uid,
    }
  })

  // Set recent connector if exists
  {
    const current = config.state.current
    const recent = current
      ? config.state.connections.get(current)?.connector
      : undefined
    if (recent) {
      await config.storage?.setItem('recentConnectorId', recent.id)
    }
  }

  if (disconnectError) {
    throw disconnectError
  }
}
