import type { MaybePromise } from '../types/utils.js'

type Callback = ((...args: any[]) => any) | undefined
type Callbacks = Record<string, Callback>

/** @internal */
export const listenersCache: Map<string, { id: number; fns: Callbacks }[]> =
  /*#__PURE__*/ new Map()
/** @internal */
export const cleanupCache: Map<string, () => void> = /*#__PURE__*/ new Map()

type EmitFunction<callbacks extends Callbacks> = (
  emit: callbacks
) => MaybePromise<void | (() => void)>

let callbackCount = 0

/**
 * @description Sets up an observer for a given function. If another function
 * is set up under the same observer id, the function will only be called once
 * for both instances of the observer.
 */
export function observe<callbacks extends Callbacks>(
  observerId: string,
  callbacks: callbacks,
  fn: EmitFunction<callbacks>
): () => void {
  const callbackId = ++callbackCount

  const getListeners = () => listenersCache.get(observerId) || []

  const unwatch = () => {
    const listeners = getListeners()
    // A late or repeated call must not run the cleanup of the observers that
    // are still listening.
    if (!listeners.some((cb) => cb.id === callbackId)) {
      return
    }
    const remaining = listeners.filter((cb) => cb.id !== callbackId)
    if (remaining.length > 0) {
      listenersCache.set(observerId, remaining)
      return
    }
    // The last listener is gone: drop the key and its cleanup, so neither
    // map keeps one entry per finished observer.
    const cleanup = cleanupCache.get(observerId)
    listenersCache.delete(observerId)
    cleanupCache.delete(observerId)
    cleanup?.()
  }

  const listeners = getListeners()
  listenersCache.set(observerId, [
    ...listeners,
    { id: callbackId, fns: callbacks },
  ])

  if (listeners && listeners.length > 0) {
    return unwatch
  }

  const emit: callbacks = {} as callbacks
  for (const key in callbacks) {
    emit[key] = ((
      ...args: Parameters<NonNullable<callbacks[keyof callbacks]>>
    ) => {
      const listeners = getListeners()
      if (listeners.length === 0) {
        return
      }
      for (const listener of listeners) {
        listener.fns[key]?.(...args)
      }
    }) as callbacks[Extract<keyof callbacks, string>]
  }

  const cleanup = fn(emit)
  if (typeof cleanup === 'function') {
    cleanupCache.set(observerId, cleanup)
  }

  return unwatch
}
