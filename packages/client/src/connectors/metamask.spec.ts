import { UserRejectedRequestError } from '@bigmi/core'
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

function createConnector(wallet: unknown, { connectedShim = true } = {}) {
  const connector: any = metamask()({
    emitter: { emit: vi.fn() },
    storage: {
      setItem: vi.fn(),
      removeItem: vi.fn(),
      // `isAuthorized` gates on this before anything else, so a stub that
      // resolves undefined would skip every branch under test.
      getItem: vi.fn(async (key: string) =>
        key.endsWith('.connected') ? connectedShim : undefined
      ),
    },
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

  it('stays authorized while the session is still restoring', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    // `accounts` is empty until the un-awaited restore resolves. Reading it
    // here would skip reconnect on every reload.
    const connector = createConnector(
      createWallet(connectSpy, { restoreAfterMs: 150 })
    )
    await expect(connector.isAuthorized()).resolves.toBe(true)
  })

  it('is not authorized without the connected shim', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector = createConnector(createWallet(connectSpy), {
      connectedShim: false,
    })
    await expect(connector.isAuthorized()).resolves.toBe(false)
  })

  it('is not authorized when the wallet is absent', async () => {
    ;(globalThis as any).window = {}
    const connector = createConnector(undefined)
    await expect(connector.isAuthorized()).resolves.toBe(false)
  })

  it('ignores an unparseable account in a change event', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    let fire: ((e: { accounts: unknown[] }) => void) | undefined
    const emit = vi.fn()
    const connector: any = metamask()({
      emitter: { emit },
      storage: {
        setItem: vi.fn(),
        removeItem: vi.fn(),
        getItem: vi.fn(async () => true),
      },
    } as any)
    connector.getInternalProvider = async () => ({
      name: 'MetaMask',
      accounts: [account],
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': {
          on: vi.fn((_event: string, handler: any) => {
            fire = handler
            return () => {}
          }),
        },
      },
    })

    await connector.connect()
    emit.mockClear()
    // A throw here escapes into MetaMask's emitter, so bigmi would never
    // learn the account changed and would keep signing the old address.
    expect(() =>
      fire?.({ accounts: [{ address: 'not-an-address' }, account] })
    ).not.toThrow()
  })

  it('disconnects when no payment account is left', async () => {
    const emit = vi.fn()
    const connector: any = metamask()({
      emitter: { emit },
      storage: {
        setItem: vi.fn(),
        removeItem: vi.fn(),
        getItem: vi.fn(async () => true),
      },
    } as any)

    // A Taproot-only selection filters to nothing. Emitting `change` with an
    // empty list leaves the store connected with no usable address.
    await connector.onAccountsChanged([
      {
        address: 'bc1p',
        addressType: 'p2tr',
        publicKey: '00',
        purpose: 'ordinals',
      },
    ])
    expect(emit).toHaveBeenCalledWith('disconnect')
  })

  it('clears the connected shim when the wallet disconnects', async () => {
    const removeItem = vi.fn()
    const connector: any = metamask()({
      emitter: { emit: vi.fn() },
      storage: {
        setItem: vi.fn(),
        removeItem,
        getItem: vi.fn(async () => true),
      },
    } as any)

    await connector.onDisconnect()
    // Otherwise `isAuthorized()` stays true forever after the user revokes
    // the site inside MetaMask.
    expect(removeItem).toHaveBeenCalledWith('io.metamask.bitcoin.connected')
  })

  it('still reports the disconnect when storage refuses', async () => {
    const emit = vi.fn()
    const connector: any = metamask()({
      emitter: { emit },
      storage: {
        setItem: vi.fn(),
        // A blocked localStorage throws here.
        removeItem: vi.fn(async () => {
          throw new Error('SecurityError')
        }),
        getItem: vi.fn(async () => true),
      },
    } as any)

    await expect(connector.onDisconnect()).resolves.toBeUndefined()
    expect(emit).toHaveBeenCalledWith('disconnect')
  })

  it('reports an empty interactive selection as not connected', async () => {
    // MetaMask resolves with no payment account when the user holds none.
    // Reading accounts[0] then throws a TypeError that the catch relabels as
    // a rejection, showing raw JavaScript text for a wallet that rejected
    // nothing.
    const connectSpy = vi.fn(async () => ({ accounts: [] }))
    ;(globalThis as any).window = {}
    const connector = createConnector({
      name: 'MetaMask',
      accounts: [],
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': { on: vi.fn(() => () => {}) },
      },
    })

    await expect(connector.connect()).rejects.toThrow(
      ConnectorNotConnectedError
    )
  })

  it('survives an accounts getter that throws during the poll', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    let throwing = true
    setTimeout(() => {
      throwing = false
    }, 100)
    const connector = createConnector({
      name: 'MetaMask',
      get accounts(): any {
        if (throwing) {
          throw new TypeError('not ready')
        }
        return [account]
      },
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': { on: vi.fn(() => () => {}) },
      },
    })

    // A throw must not end the poll this code exists to provide.
    const result = await connector.connect({ isReconnecting: true })
    expect(result.accounts.map((a: any) => a.address)).toEqual([address])
  })

  it('maps a declined interactive connect to a user rejection', async () => {
    // `bitcoin:connect` is the only step a user can reject, and consumers
    // rely on `UserRejectedRequestError` to tell a decline from a failure.
    const connectSpy = vi.fn(async () => {
      throw new Error('User rejected the request')
    })
    ;(globalThis as any).window = {}
    const connector = createConnector({
      name: 'MetaMask',
      accounts: [],
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': { on: vi.fn(() => () => {}) },
      },
    })

    await expect(connector.connect()).rejects.toBeInstanceOf(
      UserRejectedRequestError
    )
  })

  it('does not call a successful connect a rejection when storage fails', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    ;(globalThis as any).window = {}
    const connector: any = metamask()({
      emitter: { emit: vi.fn() },
      storage: {
        // A blocked localStorage in an embedded iframe throws here.
        setItem: vi.fn(async () => {
          throw new Error('SecurityError')
        }),
        removeItem: vi.fn(async () => {
          throw new Error('SecurityError')
        }),
        getItem: vi.fn(async () => true),
      },
    } as any)
    connector.getInternalProvider = async () => ({
      name: 'MetaMask',
      accounts: [account],
      features: {
        'bitcoin:connect': { connect: connectSpy },
        'bitcoin:events': { on: vi.fn(() => () => {}) },
      },
    })

    const result = await connector.connect()
    expect(result.accounts.map((a: any) => a.address)).toEqual([address])
  })

  it('keeps the shim when a slow wallet has not restored yet', async () => {
    const removeItem = vi.fn()
    ;(globalThis as any).window = {}
    const connector: any = metamask()({
      emitter: { emit: vi.fn() },
      storage: {
        setItem: vi.fn(),
        removeItem,
        getItem: vi.fn(async () => true),
      },
    } as any)
    // A cold MV3 service worker can take seconds, and the wallet retries the
    // restore on the next load. Dropping the shim would sign out a user whose
    // session is still valid, permanently.
    connector.getInternalProvider = async () => ({
      name: 'MetaMask',
      accounts: [],
      features: { 'bitcoin:events': { on: vi.fn(() => () => {}) } },
    })

    await expect(connector.connect({ isReconnecting: true })).rejects.toThrow(
      ConnectorNotConnectedError
    )
    expect(removeItem).not.toHaveBeenCalledWith('io.metamask.bitcoin.connected')
  })
})
