import { describe, expect, it } from 'vitest'
import { withRetry } from './withRetry.js'

type Outcome = {
  status: 'pending' | 'resolved' | 'rejected'
  value?: unknown
  error?: unknown
  /** Every unhandled rejection while the promise ran. */
  unhandled: unknown[]
}

/**
 * Records how `promise` settles. With no delay, `withRetry` runs on
 * microtasks only, so a timer later it has settled or never will, and Node
 * has reported every unhandled rejection.
 */
async function outcomeOf(promise: Promise<unknown>): Promise<Outcome> {
  const outcome: Outcome = { status: 'pending', unhandled: [] }
  const onUnhandled = (reason: unknown) => {
    outcome.unhandled.push(reason)
  }
  process.on('unhandledRejection', onUnhandled)
  promise.then(
    (value) => {
      outcome.status = 'resolved'
      outcome.value = value
    },
    (error) => {
      outcome.status = 'rejected'
      outcome.error = error
    }
  )
  try {
    await new Promise((resolve) => setTimeout(resolve, 10))
    return outcome
  } finally {
    process.off('unhandledRejection', onUnhandled)
  }
}

/** A function that fails `failures` times, then returns `'ok'`. */
function failing(failures = Number.POSITIVE_INFINITY) {
  let calls = 0
  const fn = async () => {
    calls++
    if (calls <= failures) {
      throw new Error(`fn failed ${calls}`)
    }
    return 'ok'
  }
  return { fn, calls: () => calls }
}

describe('withRetry', () => {
  it('rejects with the error that shouldRetry throws after a retry', async () => {
    const error = new Error('shouldRetry failed')
    const outcome = await outcomeOf(
      withRetry(failing().fn, {
        delay: 0,
        shouldRetry: ({ count }) => {
          if (count === 0) {
            return true
          }
          throw error
        },
      })
    )

    expect(outcome.status).toBe('rejected')
    expect(outcome.error).toBe(error)
    expect(outcome.unhandled).toEqual([])
  })

  it('rejects with the error that an async shouldRetry rejects with', async () => {
    const error = new Error('shouldRetry failed')
    const outcome = await outcomeOf(
      withRetry(failing().fn, {
        delay: 0,
        shouldRetry: async ({ count }) => {
          if (count === 0) {
            return true
          }
          throw error
        },
      })
    )

    expect(outcome.status).toBe('rejected')
    expect(outcome.error).toBe(error)
    expect(outcome.unhandled).toEqual([])
  })

  it('rejects with the error that the delay function throws after a retry', async () => {
    const error = new Error('delay failed')
    const outcome = await outcomeOf(
      withRetry(failing().fn, {
        delay: ({ count }) => {
          if (count === 0) {
            return 0
          }
          throw error
        },
      })
    )

    expect(outcome.status).toBe('rejected')
    expect(outcome.error).toBe(error)
    expect(outcome.unhandled).toEqual([])
  })

  it('retries and then resolves', async () => {
    const { fn, calls } = failing(2)
    const delays: number[] = []
    const outcome = await outcomeOf(
      withRetry(fn, {
        delay: ({ count }) => {
          delays.push(count)
          return 0
        },
        retryCount: 2,
      })
    )

    expect(outcome.status).toBe('resolved')
    expect(outcome.value).toBe('ok')
    expect(calls()).toBe(3)
    expect(delays).toEqual([0, 1])
  })

  it('rejects with the last error when the retries run out', async () => {
    const { fn, calls } = failing()
    const outcome = await outcomeOf(withRetry(fn, { delay: 0, retryCount: 2 }))

    expect(outcome.status).toBe('rejected')
    expect((outcome.error as Error).message).toBe('fn failed 3')
    expect(calls()).toBe(3)
    expect(outcome.unhandled).toEqual([])
  })

  it('does not retry when shouldRetry returns false', async () => {
    const { fn, calls } = failing()
    const outcome = await outcomeOf(
      withRetry(fn, { delay: 0, shouldRetry: () => false })
    )

    expect(outcome.status).toBe('rejected')
    expect((outcome.error as Error).message).toBe('fn failed 1')
    expect(calls()).toBe(1)
  })
})
