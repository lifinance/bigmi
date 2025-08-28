import {
  type Address,
  BaseError,
  type ChainId,
  type Network,
} from '@bigmi/core'

export class ProviderNotFoundError extends BaseError {
  code: number
  message: string
  name = 'ProviderNotFoundError'
  constructor() {
    super('Provider not found.')
    this.message = 'Provider not found'
    this.code = 243
  }
}

export class ChainNotSupportedError extends BaseError {
  name = 'ChainNotSupportedError'
  constructor(chainId: ChainId, connector: string) {
    super(`Chain ${chainId.toString()} is not supported by ${connector} `)
  }
}

export class ConnectorChainIdDetectionError extends BaseError {
  override name = 'ConnectorChainIdDetectionError'
  constructor({ connector }: { connector: string }) {
    super(`Chain ID detection failed for connector "${connector}".`, {
      metaMessages: [
        'The connector needs at least one account to analyze the address format and determine the Bitcoin network.',
        'Please ensure the wallet is connected and has accounts available.',
        'Try reconnecting the wallet or checking if the wallet extension is properly installed.',
      ],
    })
  }
}

export type ConnectorAlreadyConnectedErrorType =
  ConnectorAlreadyConnectedError & {
    name: 'ConnectorAlreadyConnectedError'
  }
export class ConnectorAlreadyConnectedError extends BaseError {
  override name = 'ConnectorAlreadyConnectedError'
  constructor() {
    super('Connector already connected.')
  }
}

export type ConnectorNotConnectedErrorType = ConnectorNotConnectedError & {
  name: 'ConnectorNotConnectedError'
}
export class ConnectorNotConnectedError extends BaseError {
  override name = 'ConnectorNotConnectedError'
  constructor() {
    super('Connector not connected.')
  }
}

export type ConnectorNotFoundErrorType = ConnectorNotFoundError & {
  name: 'ConnectorNotFoundError'
}
export class ConnectorNotFoundError extends BaseError {
  override name = 'ConnectorNotFoundError'
  constructor() {
    super('Connector not found.')
  }
}

export type ConnectorAccountNotFoundErrorType =
  ConnectorAccountNotFoundError & {
    name: 'ConnectorAccountNotFoundError'
  }
export class ConnectorAccountNotFoundError extends BaseError {
  override name = 'ConnectorAccountNotFoundError'
  constructor({
    address,
    connector,
  }: {
    address: Address
    connector: string
  }) {
    super(`Account "${address}" not found for connector "${connector}".`)
  }
}

export type ConnectorChainMismatchErrorType = ConnectorAccountNotFoundError & {
  name: 'ConnectorChainMismatchError'
}
export class ConnectorChainMismatchError extends BaseError {
  override name = 'ConnectorChainMismatchError'
  constructor({
    connectionChainId,
    connectorChainId,
  }: {
    connectionChainId: ChainId
    connectorChainId: ChainId
  }) {
    super(
      `The current chain of the connector (id: ${connectorChainId}) does not match the connection's chain (id: ${connectionChainId}).`,
      {
        metaMessages: [
          `Current Chain ID:  ${connectorChainId}`,
          `Expected Chain ID: ${connectionChainId}`,
        ],
      }
    )
  }
}

export type ConnectorNetworkMismatchErrorType =
  ConnectorAccountNotFoundError & {
    name: 'ConnectorNetworkMismatchError'
  }
export class ConnectorNetworkMismatchError extends BaseError {
  override name = 'ConnectorNetworkMismatchError'
  constructor({
    connectionNetwork,
    connectorNetwork,
  }: {
    connectionNetwork: Network
    connectorNetwork: Network
  }) {
    super(
      `The current network of the connector (${connectorNetwork}) does not match the connection's network (${connectionNetwork}).`,
      {
        metaMessages: [
          `Current Network:  ${connectorNetwork}`,
          `Expected Network: ${connectionNetwork}`,
        ],
      }
    )
  }
}

export type ConnectorUnavailableReconnectingErrorType =
  ConnectorUnavailableReconnectingError & {
    name: 'ConnectorUnavailableReconnectingError'
  }
export class ConnectorUnavailableReconnectingError extends BaseError {
  override name = 'ConnectorUnavailableReconnectingError'
  constructor({ connector }: { connector: { name: string } }) {
    super(`Connector "${connector.name}" unavailable while reconnecting.`, {
      details: [
        'During the reconnection step, the only connector methods guaranteed to be available are: `id`, `name`, `type`, `uid`.',
        'All other methods are not guaranteed to be available until reconnection completes and connectors are fully restored.',
        'This error commonly occurs for connectors that asynchronously inject after reconnection has already started.',
      ].join(' '),
    })
  }
}
