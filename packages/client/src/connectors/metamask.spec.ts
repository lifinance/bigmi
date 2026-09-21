import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConnectorNotConnectedError } from '../errors/connectors.js'
import { metamask } from './metamask.js'

const address = 'bc1q8h8s4zd9y0lkrx334aqnj4ykqs220ss735a3gh'
const publicKey = new Uint8Array([3, 203, 174, 220])

const account = { address, publicKey }

// The real MetaMaskWallet fills `accounts` from an un-awaited
// `#tryRestoringSession()`, so it reads empty until that round trip resolves.
function createWallet(
  connectSpy: ReturnType<typeof vi.fn>,
  { restoreAfterMs = 0 }: { restoreAfterMs?: number } = {}
) {
  let restored = restoreAfterMs === 0
  if (restoreAfterMs > 0) {
    setTimeout(() => {
      restored = true
    }, restoreAfterMs)
  }
  return {
    name: 'MetaMask',
    get accounts() {
      return restored ? [account] : []
    },
    features: {
      'bitcoin:connect': { connect: connectSpy },
      'bitcoin:events': { on: vi.fn(() => () => {}) },
    },
  }
}

function createConnector(wallet: unknown) {
  const connector: any = metamask()({
    emitter: { emit: vi.fn() },
    storage: { setItem: vi.fn(), removeItem: vi.fn(), getItem: vi.fn() },
  } as any)
  connector.getInternalProvider = async () => wallet
  return connector
}

afterEach(() => {
  ;(globalThis as any).window = undefined
})

describe('metamask connector reconnect', () => {
  it('does not open the wallet while reconnecting', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector = createConnector(createWallet(connectSpy))

    const result = await connector.connect({ isReconnecting: true })

    // `bitcoin:connect` opens MetaMask. Reconnect runs on page load, so it
    // must read the restored session instead.
    expect(connectSpy).not.toHaveBeenCalled()
    expect(result.accounts.map((a: any) => a.address)).toEqual([address])
  })

  it('waits for a session that is still being restored', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector = createConnector(
      createWallet(connectSpy, { restoreAfterMs: 150 })
    )

    const result = await connector.connect({ isReconnecting: true })

    expect(connectSpy).not.toHaveBeenCalled()
    expect(result.accounts.map((a: any) => a.address)).toEqual([address])
  })

  it('reports an absent session as not connected, not as a rejection', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector = createConnector({
      name: 'MetaMask',
      accounts: [],
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': { on: vi.fn(() => () => {}) },
      },
    })

    // Nothing was ever shown to the user, so this is not a user rejection.
    await expect(connector.connect({ isReconnecting: true })).rejects.toThrow(
      ConnectorNotConnectedError
    )
    expect(connectSpy).not.toHaveBeenCalled()
  })

  it('opens the wallet for a user-initiated connect', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector = createConnector(createWallet(connectSpy))

    await connector.connect()
    expect(connectSpy).toHaveBeenCalledOnce()
  })

  it('skips an account it cannot parse instead of giving up', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector = createConnector({
      name: 'MetaMask',
      // A half-initialized entry alongside a usable one.
      accounts: [{ address: 'not-an-address' }, account],
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': { on: vi.fn(() => () => {}) },
      },
    })

    const result = await connector.connect({ isReconnecting: true })
    expect(result.accounts.map((a: any) => a.address)).toEqual([address])
  })

  it('is not authorized when the session holds no account', async () => {
    ;(globalThis as any).window = {}
    const connector = createConnector({
      name: 'MetaMask',
      accounts: [],
      features: { 'bitcoin:events': { on: vi.fn(() => () => {}) } },
    })
    connector.config = undefined
    await expect(connector.isAuthorized()).resolves.toBe(false)
  })
})
