import { describe, expect, it } from 'vitest'
import { LruMap } from './lru.js'

describe('LruMap', () => {
  it('makes a key that is set again the newest', () => {
    const cache = new LruMap<number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 3)
    cache.set('c', 4)

    expect([...cache.keys()]).toEqual(['a', 'c'])
    expect(cache.get('a')).toBe(3)
  })

  it.each([1, undefined])(
    'makes a key that is read the newest (value %s)',
    (value) => {
      const cache = new LruMap<number | undefined>(2)
      cache.set('a', value)
      cache.set('b', 2)
      cache.get('a')
      cache.set('c', 3)

      expect([...cache.keys()]).toEqual(['a', 'c'])
    }
  )

  it('evicts an empty-string key when it is the oldest', () => {
    const cache = new LruMap<number>(1)
    cache.set('', 1)
    cache.set('x', 2)

    expect([...cache.keys()]).toEqual(['x'])
  })

  it('keeps at most maxSize keys', () => {
    const cache = new LruMap<number>(100)
    for (let i = 0; i < 1_000; i++) {
      cache.set(`key${i}`, i)
    }

    expect(cache.size).toBe(100)
    expect(cache.has('key899')).toBe(false)
    expect(cache.has('key900')).toBe(true)
  })
})
