import { afterEach, describe, expect, it, vi } from 'vitest'
import { metamask } from './metamask.js'

const address = 'bc1q8h8s4zd9y0lkrx334aqnj4ykqs220ss735a3gh'
const publicKey = new Uint8Array([3, 203, 174, 220])

const account = { address, publicKey }

function createWallet(connectSpy: ReturnType<typeof vi.fn>) {
  return {
    name: 'MetaMask',
    accounts: [account],
    features: {
      'bitcoin:connect': { connect: connectSpy },
      'bitcoin:events': { on: vi.fn(() => () => {}) },
    },
  }
}

afterEach(() => {
  ;(globalThis as any).window = undefined
})

describe('metamask connector reconnect', () => {
  it('does not open the wallet while reconnecting', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    const wallet = createWallet(connectSpy)
    ;(globalThis as any).window = {}
    const connector: any = metamask()({
      emitter: { emit: vi.fn() },
      storage: { setItem: vi.fn(), removeItem: vi.fn(), getItem: vi.fn() },
    } as any)
    connector.getInternalProvider = async () => wallet

    const result = await connector.connect({ isReconnecting: true })

    // `bitcoin:connect` opens MetaMask. Reconnect runs on page load, so it
    // must read the restored session instead.
    expect(connectSpy).not.toHaveBeenCalled()
    expect(result.accounts.map((a: any) => a.address)).toEqual([address])
  })

  it('opens the wallet for a user-initiated connect', async () => {
    const connectSpy = vi.fn(async () => ({ accounts: [account] }))
    const wallet = createWallet(connectSpy)
    ;(globalThis as any).window = {}
    const connector: any = metamask()({
      emitter: { emit: vi.fn() },
      storage: { setItem: vi.fn(), removeItem: vi.fn(), getItem: vi.fn() },
    } as any)
    connector.getInternalProvider = async () => wallet

    await connector.connect()
    expect(connectSpy).toHaveBeenCalledOnce()
  })
})
