import {
  type Address,
  bitcoin,
  ChainId,
  UserRejectedRequestError,
} from '@bigmi/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConnectorNotConnectedError } from '../errors/connectors.js'
import { createEmitter } from '../factories/createEmitter.js'
import { createStorage } from '../factories/createStorage.js'
import type { ConnectorEventMap } from '../types/connector.js'
import { UnisatBitcoinChainEnum, unisat } from './unisat.js'

const address = 'bc1q8h8s4zd9y0lkrx334aqnj4ykqs220ss735a3gh' as Address
const publicKey =
  '03cbaedc26f03fd3ba02fc936f338e980c9e2172c5e23128877ed46827e935296f'

function createProvider(accounts: Address[] = [address]) {
  return {
    addListener: vi.fn(),
    getAccounts: vi.fn(async () => accounts),
    getChain: vi.fn(async () => ({
      enum: UnisatBitcoinChainEnum.BITCOIN_MAINNET,
      name: 'Bitcoin Mainnet',
      network: 'livenet' as const,
    })),
    getPublicKey: vi.fn(async () => publicKey),
    removeListener: vi.fn(),
    requestAccounts: vi.fn(async () => accounts),
    signPsbt: vi.fn(),
    switchChain: vi.fn(),
  }
}

async function createTestConnector(
  provider: ReturnType<typeof createProvider>
) {
  vi.stubGlobal('window', { unisat: provider })

  const storedValues = new Map<string, string>()
  const storage = createStorage({
    key: 'test',
    storage: {
      getItem: vi.fn((key) => storedValues.get(key)),
      removeItem: vi.fn((key) => {
        storedValues.delete(key)
      }),
      setItem: vi.fn((key, value) => {
        storedValues.set(key, value)
      }),
    },
  })
  await storage.setItem('unisat.connected', true)

  return unisat()({
    chains: [bitcoin],
    emitter: createEmitter<ConnectorEventMap>('test'),
    storage,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('unisat connector', () => {
  it('reconnects through passive account access', async () => {
    const provider = createProvider()
    const connector = await createTestConnector(provider)

    expect(await connector.isAuthorized()).toBe(true)
    const result = await connector.connect({ isReconnecting: true })

    expect(provider.requestAccounts).not.toHaveBeenCalled()
    expect(provider.getAccounts).toHaveBeenCalled()
    expect(result.accounts[0]?.address).toBe(address)
    expect(result.chainId).toBe(ChainId.BITCOIN_MAINNET)
  })

  it('requests account access for an explicit connection', async () => {
    const provider = createProvider()
    const connector = await createTestConnector(provider)

    await connector.connect()

    expect(provider.requestAccounts).toHaveBeenCalledOnce()
  })

  it('is not authorized when the extension exposes no accounts', async () => {
    const provider = createProvider([])
    const connector = await createTestConnector(provider)

    expect(await connector.isAuthorized()).toBe(false)
    expect(provider.requestAccounts).not.toHaveBeenCalled()
  })

  it('reports an account-less extension as not connected, not as a rejection', async () => {
    const provider = createProvider([])
    const connector = await createTestConnector(provider)

    // Only `requestAccounts` can be user-rejected; an extension that is
    // unlocked but exposes nothing is a different failure.
    await expect(connector.connect()).rejects.toThrow(
      ConnectorNotConnectedError
    )
  })

  it('surfaces a rejected account request as UserRejectedRequestError', async () => {
    const provider = createProvider()
    provider.requestAccounts.mockRejectedValueOnce(new Error('User rejected'))
    const connector = await createTestConnector(provider)

    await expect(connector.connect()).rejects.toThrow(UserRejectedRequestError)
  })
})
