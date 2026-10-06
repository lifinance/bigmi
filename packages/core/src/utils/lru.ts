/**
 * Map with a LRU (Least recently used) policy.
 *
 * @link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
 */
export class LruMap<value = unknown> extends Map<string, value> {
  maxSize: number

  constructor(size: number) {
    super()
    this.maxSize = size
  }

  override get(key: string): value | undefined {
    const value = super.get(key)

    if (super.has(key)) {
      super.delete(key)
      super.set(key, value as value)
    }

    return value
  }

  override set(key: string, value: value): this {
    // Delete first, so a key that is set again becomes the newest.
    if (super.has(key)) {
      super.delete(key)
    }
    super.set(key, value)
    if (this.maxSize && this.size > this.maxSize) {
      // viem reports a stale iterator of a Map subclass on iOS 18
      // JavaScriptCore; `super` avoids it. An empty string is a key too.
      const firstKey = super.keys().next().value
      if (firstKey !== undefined) {
        super.delete(firstKey)
      }
    }
    return this
  }
}
