import { bitcoin, ChainId } from '@bigmi/core'
import { describe, expect, it } from 'vitest'
import { createConfig } from '../factories/createConfig.js'
import { createStorage } from '../factories/createStorage.js'
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
  // The default storage is a no-op outside the browser, so the shim
  // assertions below would pass vacuously.
  const store = new Map<string, string>()
  const config = createConfig({
    chains: [bitcoin],
    connectors: [stubConnector('xverse', disconnectImpl) as any],
    client: () => ({}) as any,
    storage: createStorage({
      storage: {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => {
          store.set(key, value)
        },
        removeItem: (key) => {
          store.delete(key)
        },
      },
    }),
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

  it('clears the connector shim when its disconnect throws', async () => {
    // The connector throws before writing its own shim, so the store would
    // say disconnected while storage still said connected — and the next
    // reload would silently restore what the user disconnected.
    const { config, connector } = setup(async () => {
      throw new Error('ProviderNotFoundError')
    })
    await config.storage?.setItem(`${connector.id}.connected`, true)

    await expect(disconnect(config, { connector })).rejects.toThrow(
      'ProviderNotFoundError'
    )
    await expect(
      config.storage?.getItem(`${connector.id}.connected`)
    ).resolves.toBeFalsy()
    await expect(
      config.storage?.getItem(`${connector.id}.disconnected`)
    ).resolves.toBe(true)
  })
})
