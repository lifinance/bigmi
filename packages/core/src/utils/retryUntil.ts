import { withRetry } from './withRetry.js'

/**
 * Retries a condition until it's met or timeout is reached.
 * Polls the condition function at regular intervals.
 *
 * @param condition - Function that returns a truthy value when condition is met
 * @param options - Configuration options for retry behavior
 * @returns Promise that resolves to the condition result or undefined if timeout
 *
 * @example
 * // Wait for a value to become available
 * const value = await retryUntil(
 *   async () => await checkCondition(),
 *   { timeout: 5000, interval: 100 }
 * )
 */
export async function retryUntil<T>(
  condition: () => Promise<T | undefined | null | false>,
  options: {
    /** Maximum time to wait in milliseconds (default: 5000ms) */
    timeout?: number
    /** Interval between checks in milliseconds (default: 100ms) */
    interval?: number
  } = {}
): Promise<T | undefined> {
  const { timeout = 5000, interval = 100 } = options
  const retryCount = Math.ceil(timeout / interval) - 1 // -1 because first attempt is immediate

  return Promise.race([
    // The retry logic
    withRetry(
      async () => {
        const result = await condition()
        if (!result) {
          throw new Error('Condition not met')
        }
        return result
      },
      {
        delay: interval,
        retryCount,
        shouldRetry: ({ error }) => error.message === 'Condition not met',
      }
    ).catch(() => undefined),

    // Timeout fallback
    new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), timeout)
    }),
  ])
}
