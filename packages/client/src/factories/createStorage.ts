import type { Compute } from '@bigmi/core'

import type { Storage, StorageItemMap } from '../types/storage.js'
import { deserialize as deserialize_ } from '../utils/deserialize.js'
import { serialize as serialize_ } from '../utils/serialize.js'

export type BaseStorage = {
  getItem(
    key: string
  ): string | null | undefined | Promise<string | null | undefined>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export type CreateStorageParameters = {
  deserialize?: (<type>(value: string) => type | unknown) | undefined
  key?: string | undefined
  serialize?: (<type>(value: type | any) => string) | undefined
  storage?: Compute<BaseStorage> | undefined
}

export function createStorage<
  itemMap extends Record<string, unknown> = Record<string, unknown>,
  storageItemMap extends StorageItemMap = StorageItemMap & itemMap,
>(parameters: CreateStorageParameters): Compute<Storage<storageItemMap>> {
  const {
    deserialize = deserialize_,
    key: prefix = 'bigmi',
    serialize = serialize_,
    storage = noopStorage,
  } = parameters

  function unwrap<type>(value: type): type | Promise<type> {
    if (value instanceof Promise) {
      return value.then((x) => x).catch(() => null)
    }
    return value
  }

  return {
    ...storage,
    key: prefix,
    async getItem(key, defaultValue) {
      const value = storage.getItem(`${prefix}.${key as string}`)
      const unwrapped = await unwrap(value)
      if (unwrapped) {
        return deserialize(unwrapped) ?? null
      }
      return (defaultValue ?? null) as any
    },
    async setItem(key, value) {
      const storageKey = `${prefix}.${key as string}`
      if (value === null) {
        await unwrap(storage.removeItem(storageKey))
      } else {
        await unwrap(storage.setItem(storageKey, serialize(value)))
      }
    },
    async removeItem(key) {
      await unwrap(storage.removeItem(`${prefix}.${key as string}`))
    },
  }
}

export const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} satisfies BaseStorage

export function getDefaultStorage() {
  const storage = (() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    return noopStorage
  })()
  return {
    getItem(key) {
      return storage.getItem(key)
    },
    removeItem(key) {
      storage.removeItem(key)
    },
    setItem(key, value) {
      try {
        storage.setItem(key, value)
        // silence errors by default (QuotaExceededError, SecurityError, etc.)
      } catch {}
    },
  } satisfies BaseStorage
}
