import type { Account, Client, Compute } from '@bigmi/core'
import { createClient, custom, parseAccount } from '@bigmi/core'
import {
  ConnectorAccountNotFoundError,
  ConnectorChainMismatchError,
  ConnectorNotConnectedError,
} from '../errors/connectors.js'
import type { Config } from '../factories/createConfig.js'
import type { Connection } from '../types/connection.js'
import type { Connector } from '../types/connector.js'
import { getAddress } from './getAddress.js'

export type ChainIdParameter<
  config extends Config,
  chainId extends
    | config['chains'][number]['id']
    | undefined = config['chains'][number]['id'],
> = {
  chainId?:
    | (chainId extends config['chains'][number]['id'] ? chainId : undefined)
    | config['chains'][number]['id']
    | undefined
}

export type GetConnectorClientReturnType<
  config extends Config = Config,
  chainId extends
    config['chains'][number]['id'] = config['chains'][number]['id'],
> = Compute<
  Client<
    config['_internal']['transports'][chainId],
    Extract<config['chains'][number], { id: chainId }>,
    Account
  >
>

export type ConnectorParameter = {
  connector?: Connector | undefined
}

export type GetConnectorClientParameters<
  config extends Config = Config,
  chainId extends
    config['chains'][number]['id'] = config['chains'][number]['id'],
> = Compute<
  ChainIdParameter<config, chainId> &
    ConnectorParameter & {
      /**
       * Account to use for the client.
       *
       * - `Account | Address`: An Account MUST exist on the connector.
       * - `null`: Account MAY NOT exist on the connector. This is useful for
       *   actions that can infer the account from the connector (e.g. sending a
       *   call without a connected account – the user will be prompted to select
       *   an account within the wallet).
       */
      account?: Account | null | undefined
    }
>

export async function getConnectorClient<
  C extends Config,
  ChainId extends C['chains'][number]['id'],
>(
  config: C,
  parameters: GetConnectorClientParameters<C, ChainId> = {}
): Promise<GetConnectorClientReturnType<C, ChainId>> {
  // Get connection
  let connection: Connection | undefined
  if (parameters.connector) {
    const { connector } = parameters
    const [accounts, chainId] = await Promise.all([
      connector.getAccounts(),
      connector.getChainId(),
    ])
    connection = {
      accounts: accounts as readonly [Account, ...Account[]],
      chainId,
      connector,
    }
  } else {
    connection = config.state.connections.get(config.state.current!)
  }
  if (!connection) {
    throw new ConnectorNotConnectedError()
  }

  const chainId = parameters.chainId ?? connection.chainId

  // Check connector using same chainId as connection
  const connectorChainId = await connection.connector.getChainId()
  if (connectorChainId !== connection.chainId) {
    throw new ConnectorChainMismatchError({
      connectionChainId: connection.chainId,
      connectorChainId,
    })
  }

  // If connector has custom `getClient` implementation
  type Return = GetConnectorClientReturnType<C, ChainId>
  const connector = connection.connector
  if (connector.getClient) {
    return connector.getClient({ chainId }) as unknown as Return
  }

  // Default using `custom` transport
  const account = parseAccount(parameters.account ?? connection.accounts[0]!)
  account.address = getAddress(account.address)

  const chain = config.chains.find((chain: { id: any }) => chain.id === chainId)
  const provider = (await connection.connector.getProvider({ chainId })) as {
    request(...args: any): Promise<any>
  }

  // If account was provided, check that it exists on the connector
  if (
    parameters.account &&
    !connection.accounts.some(
      (x: Account) => x.address.toLowerCase() === account.address.toLowerCase()
    )
  ) {
    throw new ConnectorAccountNotFoundError({
      address: account.address,
      connector: connector.name,
    })
  }

  return createClient({
    account,
    chain,
    name: 'Connector Client',
    transport: (opts) => custom(provider)({ ...opts, retryCount: 0 }),
  }) as Return
}
