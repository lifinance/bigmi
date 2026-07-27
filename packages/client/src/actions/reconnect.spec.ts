import {
  type Account,
  type Address,
  AddressType,
  bitcoin,
  ChainId,
} from '@bigmi/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createConfig } from '../factories/createConfig.js'
import { createConnector } from '../factories/createConnector.js'
import { createStorage } from '../factories/createStorage.js'
import type { Connection } from '../types/connection.js'
import type { CreateConnectorFn } from '../types/connector.js'
import { connect } from './connect.js'
import { reconnect } from './reconnect.js'

const address = 'bc1q8h8s4zd9y0lkrx334aqnj4ykqs220ss735a3gh' as Address

const account: Account = {
  address,
  addressType: AddressType.p2wpkh,
  publicKey:
    '03cbaedc26f03fd3ba02fc936f338e980c9e2172c5e23128877ed46827e935296f',
  purpose: 'payment',
}

type MockConnectorParameters = {
  id: string
  /** Resolves the authorization check. Defaults to authorized. */
  isAuthorized?: () => Promise<boolean>
}

function mockConnector({
  id,
  isAuthorized = async () => true,
}: MockConnectorParameters): CreateConnectorFn {
  return createConnector(() => ({
    id,
    name: id,
    type: 'UTXO',
    async connect() {
      return { accounts: [account], chainId: ChainId.BITCOIN_MAINNET }
    },
    async disconnect() {},
    async getAccounts() {
      return [account]
    },
    async getChainId() {
      return ChainId.BITCOIN_MAINNET
    },
    async getProvider() {
      // Distinct object per connector so reconnect's provider dedup
      // does not collapse them into one.
      return { id }
    },
    isAuthorized,
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {},
  }))
}

function createTestConfig(connectors: readonly CreateConnectorFn[]) {
  const storedValues = new Map<string, string>()

  return createConfig({
    chains: [bitcoin],
    client: () => ({}) as any,
    connectors,
    multiInjectedProviderDiscovery: false,
    storage: createStorage({
      key: 'test',
      storage: {
        getItem: (key) => storedValues.get(key),
        removeItem: (key) => {
          storedValues.delete(key)
        },
        setItem: (key, value) => {
          storedValues.set(key, value)
        },
      },
    }),
  })
}

/**
 * Mimics what `persist` rehydrates: a connection keyed by the previous
 * session's uid, whose connector is a plain object with no methods.
 */
function seedRehydratedConnection(config: ReturnType<typeof createTestConfig>) {
  const staleUid = 'stale-uid-from-previous-session'
  const staleConnection = {
    accounts: [account],
    chainId: ChainId.BITCOIN_MAINNET,
    connector: { id: 'mock', name: 'mock', type: 'UTXO', uid: staleUid },
  } as unknown as Connection

  config.setState((x) => ({
    ...x,
    connections: new Map([[staleUid, staleConnection]]),
    current: staleUid,
    status: 'reconnecting',
  }))

  return staleUid
}

describe('reconnect', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('replaces the connection rehydrated under the previous session uid', async () => {
    const config = createTestConfig([mockConnector({ id: 'mock' })])
    const staleUid = seedRehydratedConnection(config)

    await reconnect(config)

    const liveUid = config.connectors[0].uid
    expect(config.state.connections.has(staleUid)).toBe(false)
    expect(config.state.connections.size).toBe(1)
    expect(config.state.current).toBe(liveUid)
    expect(config.state.status).toBe('connected')
    // The live entry carries a real connector, not a serialized stub.
    expect(
      typeof config.state.connections.get(liveUid)?.connector.connect
    ).toBe('function')
  })

  it('resets connections and current when nothing reconnects', async () => {
    const config = createTestConfig([
      mockConnector({ id: 'mock', isAuthorized: async () => false }),
    ])
    seedRehydratedConnection(config)

    const connections = await reconnect(config)

    expect(connections).toHaveLength(0)
    expect(config.state.connections.size).toBe(0)
    expect(config.state.current).toBeNull()
    expect(config.state.status).toBe('disconnected')
  })

  it('keeps a connection established by connect() while reconnect is in flight', async () => {
    // Holds reconnect open until we release it, so `connect()` lands first.
    let releaseAuthorization: (isAuthorized: boolean) => void = () => {}
    const authorizationCheck = new Promise<boolean>((resolve) => {
      releaseAuthorization = resolve
    })

    const config = createTestConfig([
      mockConnector({ id: 'slow', isAuthorized: () => authorizationCheck }),
      // Never reconnects on its own — only connected explicitly below.
      mockConnector({ id: 'manual', isAuthorized: async () => false }),
    ])

    const reconnectPromise = reconnect(config)
    await vi.waitFor(() => expect(config.state.status).toBe('connecting'))

    const manualConnector = config.connectors[1]
    await connect(config, { connector: manualConnector })
    expect(config.state.current).toBe(manualConnector.uid)

    releaseAuthorization(false)
    await reconnectPromise

    expect(config.state.connections.has(manualConnector.uid)).toBe(true)
    expect(config.state.current).toBe(manualConnector.uid)
    expect(config.state.status).toBe('connected')
  })
})
