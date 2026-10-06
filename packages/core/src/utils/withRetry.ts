import type { ErrorType } from '../errors/utils.js'
import { wait } from './wait.js'

export type WithRetryParameters = {
  // The delay (in ms) between retries.
  delay?:
    | ((config: { count: number; error: Error }) => number)
    | number
    | undefined
  // The max number of times to retry.
  retryCount?: number | undefined
  // Whether or not to retry when an error is thrown.
  shouldRetry?:
    | (({
        count,
        error,
      }: {
        count: number
        error: Error
      }) => Promise<boolean> | boolean)
    | undefined
}

export type WithRetryErrorType = ErrorType

export function withRetry<data>(
  fn: () => Promise<data>,
  {
    delay: delay_ = 100,
    retryCount = 2,
    shouldRetry = () => true,
  }: WithRetryParameters = {}
): Promise<data> {
  return new Promise<data>((resolve, reject) => {
    const attemptRetry = async ({ count = 0 } = {}): Promise<void> => {
      const retry = async ({ error }: { error: Error }): Promise<void> => {
        const delay =
          typeof delay_ === 'function' ? delay_({ count, error }) : delay_
        if (delay) {
          await wait(delay)
        }
        return attemptRetry({ count: count + 1 })
      }

      try {
        const data = await fn()
        resolve(data)
      } catch (err) {
        if (
          count < retryCount &&
          (await shouldRetry({ count, error: err as Error }))
        ) {
          return retry({ error: err as Error })
        }
        reject(err)
      }
    }
    // A throw from `shouldRetry` or `delay` rejects an attempt; pass it on
    // instead of leaving the promise pending.
    attemptRetry().catch(reject)
  })
}
