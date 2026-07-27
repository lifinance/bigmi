import { type Address, bitcoin, ChainId } from '@bigmi/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmitter } from '../factories/createEmitter.js'
import { createStorage } from '../factories/createStorage.js'
import type {
  ConnectorEventMap,
  CreateConnectorFn,
} from '../types/connector.js'
import { binance } from './binance.js'
import { bitget } from './bitget.js'
import { okx } from './okx.js'
import { onekey } from './onekey.js'

const address = 'bc1q8h8s4zd9y0lkrx334aqnj4ykqs220ss735a3gh' as Address
const publicKey =
  '03cbaedc26f03fd3ba02fc936f338e980c9e2172c5e23128877ed46827e935296f'

function createProvider(accounts: Address[]) {
  return {
    addListener: vi.fn(),
    getAccounts: vi.fn(async () => accounts),
    getNetwork: vi.fn(async () => 'livenet' as const),
    getPublicKey: vi.fn(async () => publicKey),
    isOkxWallet: true,
    removeListener: vi.fn(),
    requestAccounts: vi.fn(async () => accounts),
    signPsbt: vi.fn(),
    switchNetwork: vi.fn(),
  }
}

type Provider = ReturnType<typeof createProvider>

/**
 * Each connector reads its provider off a different `window` global, so the
 * shape of the stub differs even though the reconnect behaviour is identical.
 */
const connectors: {
  id: string
  name: string
  connector: () => CreateConnectorFn
  windowShape: (provider: Provider) => Record<string, unknown>
}[] = [
  {
    id: 'binance',
    name: 'binance',
    connector: () => binance(),
    windowShape: (provider) => ({ binancew3w: { bitcoin: provider } }),
  },
  {
    id: 'bitget',
    name: 'bitget',
    connector: () => bitget(),
    windowShape: (provider) => ({ bitkeep: { unisat: provider } }),
  },
  {
    id: 'com.okex.wallet.bitcoin',
    name: 'okx',
    connector: () => okx(),
    windowShape: (provider) => ({ okxwallet: { bitcoin: provider } }),
  },
  {
    id: 'so.onekey.app.wallet.bitcoin',
    name: 'onekey',
    connector: () => onekey(),
    windowShape: (provider) => ({ $onekey: { btc: provider } }),
  },
]

async function createTestConnector(
  { connector, id, windowShape }: (typeof connectors)[number],
  provider: Provider
) {
  vi.stubGlobal('window', windowShape(provider))

  const storedValues = new Map<string, string>()
  const storage = createStorage({
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
  })
  // Mimics a wallet that was connected in a previous session.
  await storage.setItem(`${id}.connected`, true)

  return connector()({
    chains: [bitcoin],
    emitter: createEmitter<ConnectorEventMap>('test'),
    storage,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe.each(connectors)('$name connector', (testCase) => {
  it('reconnects through passive account access', async () => {
    const provider = createProvider([address])
    const connector = await createTestConnector(testCase, provider)

    expect(await connector.isAuthorized()).toBe(true)
    const result = await connector.connect({ isReconnecting: true })

    expect(provider.requestAccounts).not.toHaveBeenCalled()
    expect(provider.getAccounts).toHaveBeenCalled()
    expect(result.accounts[0]?.address).toBe(address)
    expect(result.chainId).toBe(ChainId.BITCOIN_MAINNET)
  })

  it('requests account access for an explicit connection', async () => {
    const provider = createProvider([address])
    const connector = await createTestConnector(testCase, provider)

    await connector.connect()

    expect(provider.requestAccounts).toHaveBeenCalledOnce()
  })

  it('is not authorized when the extension exposes no accounts', async () => {
    const provider = createProvider([])
    const connector = await createTestConnector(testCase, provider)

    expect(await connector.isAuthorized()).toBe(false)
    expect(provider.requestAccounts).not.toHaveBeenCalled()
  })

  it('returns no accounts when the extension exposes none', async () => {
    const provider = createProvider([])
    const connector = await createTestConnector(testCase, provider)

    await expect(connector.getAccounts()).resolves.toEqual([])
    expect(provider.requestAccounts).not.toHaveBeenCalled()
  })
})
