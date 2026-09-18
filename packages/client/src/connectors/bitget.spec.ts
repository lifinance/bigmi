import { afterEach, describe, expect, it } from 'vitest'
import { bitget } from './bitget.js'

afterEach(() => {
  ;(globalThis as any).window = undefined
})

describe('bitget getInternalProvider', () => {
  it('resolves when BitKeep injects as window.bitkeep', async () => {
    const provider = { requestAccounts: async () => [] }
    ;(globalThis as any).window = { bitkeep: { unisat: provider } }
    const connector: any = bitget()({} as any)
    await expect(connector.getInternalProvider()).resolves.toBe(provider)
  })

  it('resolves when BitKeep injects only as window.unisat.isBitKeep', async () => {
    const provider = { isBitKeep: true, requestAccounts: async () => [] }
    ;(globalThis as any).window = { unisat: provider }
    const connector: any = bitget()({} as any)
    await expect(connector.getInternalProvider()).resolves.toBe(provider)
  })
})
