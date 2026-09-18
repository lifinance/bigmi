import { afterEach, describe, expect, it } from 'vitest'
import { binance } from './binance.js'

afterEach(() => {
  ;(globalThis as any).window = undefined
})

describe('binance getInternalProvider', () => {
  it('resolves the Binance Web3 Wallet bitcoin provider', async () => {
    const provider = { requestAccounts: async () => [] }
    ;(globalThis as any).window = { binancew3w: { bitcoin: provider } }
    const connector: any = binance()({} as any)
    await expect(connector.getInternalProvider()).resolves.toBe(provider)
  })

  it('falls back to window.unisat when binancew3w carries no bitcoin provider', async () => {
    const provider = { isBinance: true, requestAccounts: async () => [] }
    ;(globalThis as any).window = { binancew3w: {}, unisat: provider }
    const connector: any = binance()({} as any)
    await expect(connector.getInternalProvider()).resolves.toBe(provider)
  })

  it('resolves window.unisat when only that is injected', async () => {
    const provider = { isBinance: true, requestAccounts: async () => [] }
    ;(globalThis as any).window = { unisat: provider }
    const connector: any = binance()({} as any)
    await expect(connector.getInternalProvider()).resolves.toBe(provider)
  })

  it('ignores a window.unisat that is not Binance', async () => {
    ;(globalThis as any).window = { unisat: { isBitKeep: true } }
    const connector: any = binance()({} as any)
    await expect(connector.getInternalProvider()).resolves.toBeUndefined()
  })
})
