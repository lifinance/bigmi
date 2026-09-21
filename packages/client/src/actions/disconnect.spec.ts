import { bitcoin, ChainId } from '@bigmi/core'
import { describe, expect, it } from 'vitest'
import { createConfig } from '../factories/createConfig.js'
import { disconnect } from './disconnect.js'

const address = 'bc1q8h8s4zd9y0lkrx334aqnj4ykqs220ss735a3gh'

const stubConnector =
  (id: string, disconnectImpl: () => Promise<void>) => (config: any) => ({
    id,
    name: id,
    type: 'UTXO' as const,
    connect: async () => ({
      accounts: [
        { address, addressType: 'p2wpkh', publicKey: '00', purpose: 'payment' },
      ],
      chainId: ChainId.BITCOIN_MAINNET,
    }),
    disconnect: disconnectImpl,
    getAccounts: async () => [],
    getChainId: async () => ChainId.BITCOIN_MAINNET,
    getProvider: async () => ({}),
    isAuthorized: async () => false,
    onAccountsChanged: async () => {},
    onChainChanged: () => {},
    onDisconnect: async () => {},
    emitter: config.emitter,
  })

function setup(disconnectImpl: () => Promise<void>) {
  const config = createConfig({
    chains: [bitcoin],
    connectors: [stubConnector('xverse', disconnectImpl) as any],
    client: () => ({}) as any,
  }) as any
  const connector = config.connectors[0]
  config.setState((x: any) => ({
    ...x,
    connections: new Map([
      [
        connector.uid,
        {
          accounts: [{ address }],
          chainId: ChainId.BITCOIN_MAINNET,
          connector,
        },
      ],
    ]),
    current: connector.uid,
    status: 'connected',
  }))
  return { config, connector }
}

describe('disconnect', () => {
  it('clears the connection when the connector disconnects', async () => {
    const { config, connector } = setup(async () => {})
    await disconnect(config, { connector })
    expect(config.state.status).toBe('disconnected')
    expect(config.state.connections.size).toBe(0)
  })

  it('clears the connection even when the connector throws', async () => {
    // A provider that has gone away cannot be kept connected, or it is
    // promoted to `current` and the account is reported as usable.
    const { config, connector } = setup(async () => {
      throw new Error('ProviderNotFoundError')
    })
    await expect(disconnect(config, { connector })).rejects.toThrow(
      'ProviderNotFoundError'
    )
    expect(config.state.connections.size).toBe(0)
    expect(config.state.status).toBe('disconnected')
  })
})
