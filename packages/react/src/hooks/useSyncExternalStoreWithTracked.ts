'use client'
import { deepEqual } from '@bigmi/core'
import { useMemo, useRef, useSyncExternalStore } from 'react'

const isPlainObject = (obj: unknown): obj is Record<string, any> =>
  typeof obj === 'object' && !Array.isArray(obj)

export function useSyncExternalStoreWithTracked<
  Snapshot extends Selection,
  Selection = Snapshot,
>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: (() => Snapshot) | undefined = getSnapshot,
  isEqual: (a: Selection, b: Selection) => boolean = deepEqual
) {
  const trackedKeys = useRef<Set<string>>(new Set())
  const previousResult = useRef<Selection | undefined>(undefined)
  const snapshotCache = useRef(getSnapshot())

  const snapshot = useSyncExternalStore(
    (onChange) =>
      subscribe(() => {
        snapshotCache.current = getSnapshot()
        onChange()
      }),
    () => snapshotCache.current!,
    getServerSnapshot
  )

  const result = useMemo(() => {
    if (!isPlainObject(snapshot)) {
      return snapshot
    }

    const trackedResult = { ...snapshot }
    Object.defineProperties(
      trackedResult,
      Object.fromEntries(
        Object.entries(trackedResult).map(([key, value]) => [
          key,
          {
            configurable: false,
            enumerable: true,
            get: () => {
              trackedKeys.current.add(key)
              return value
            },
          },
        ])
      )
    )
    return trackedResult
  }, [snapshot])

  return useMemo(() => {
    if (!trackedKeys.current.size || !previousResult.current) {
      previousResult.current = result
      return result
    }

    const hasChanged = Array.from(trackedKeys.current).some(
      (key) =>
        !isEqual(
          (result as Record<string, Selection>)[key],
          (previousResult.current as Record<string, Selection>)[key]
        )
    )

    if (!hasChanged) {
      return previousResult.current
    }
    previousResult.current = result
    return result
  }, [result, isEqual])
}
