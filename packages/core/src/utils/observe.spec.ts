import { describe, expect, it, vi } from 'vitest'
import { cleanupCache, listenersCache, observe } from './observe.js'

let observerCount = 0

/** Two listeners on one observer id; the first one starts `fn`. */
function setup() {
  const id = `observe.spec.${++observerCount}`
  const cleanup = vi.fn()
  let emit: { onData: (data: number) => void } | undefined
  const fn = vi.fn((emit_: { onData: (data: number) => void }) => {
    emit = emit_
    return cleanup
  })
  const onDataA = vi.fn()
  const onDataB = vi.fn()
  const unwatchA = observe(id, { onData: onDataA }, fn)
  const unwatchB = observe(id, { onData: onDataB }, fn)
  return { id, cleanup, emit: emit!, fn, onDataA, onDataB, unwatchA, unwatchB }
}

describe('observe', () => {
  it('runs the cleanup and drops the key when the last listener leaves', () => {
    const { id, cleanup, fn, unwatchA, unwatchB } = setup()
    expect(fn).toHaveBeenCalledTimes(1)

    unwatchA()
    expect(cleanup).not.toHaveBeenCalled()
    expect(listenersCache.get(id)).toHaveLength(1)

    unwatchB()
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(listenersCache.has(id)).toBe(false)
    expect(cleanupCache.has(id)).toBe(false)
  })

  it('ignores a repeated unwatch', () => {
    const { id, cleanup, emit, onDataB, unwatchA, unwatchB } = setup()

    unwatchA()
    unwatchA()
    expect(cleanup).not.toHaveBeenCalled()
    expect(listenersCache.get(id)).toHaveLength(1)
    emit.onData(1)
    expect(onDataB).toHaveBeenCalledWith(1)

    unwatchB()
    unwatchB()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('starts a new observer on the same id after the last listener leaves', () => {
    const { id, cleanup, fn, unwatchA, unwatchB } = setup()
    unwatchA()
    unwatchB()

    const unwatchC = observe(id, { onData: vi.fn() }, fn)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(cleanupCache.get(id)).toBe(cleanup)

    unwatchC()
    expect(cleanup).toHaveBeenCalledTimes(2)
    expect(listenersCache.has(id)).toBe(false)
  })
})
