import { Block, Transaction } from 'bitcoinjs-lib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockNotFoundError } from '../errors/block.js'
import { WaitForTransactionReceiptTimeoutError } from '../errors/transaction.js'
import { createClient } from '../factories/createClient.js'
import { custom } from '../transports/custom.js'
import { cleanupCache, listenersCache } from '../utils/observe.js'
import { waitForTransaction } from './waitForTransaction.js'

const POLLING_INTERVAL = 1_000
const SENDER = 'bc1qsender'

let txSeed = 0

/**
 * A parseable non-coinbase transaction. It spends output 0 of the outpoint
 * `spends`, so two transactions with the same `spends` replace each other.
 */
function makeTx(
  spends = ++txSeed,
  outputByte = 0
): { txId: string; txHex: string } {
  const prevHash = new Uint8Array(32)
  new DataView(prevHash.buffer).setUint32(0, spends)
  const tx = new Transaction()
  tx.version = 2
  tx.addInput(prevHash, 0, 0xfffffffd)
  tx.addOutput(
    Uint8Array.from([0x00, 0x14, ...new Uint8Array(20).fill(outputByte)]),
    10_000n
  )
  return { txId: tx.getId(), txHex: tx.toHex() }
}

/** A block with a coinbase and `txs`. */
function makeBlockHex(txs: Transaction[] = []): string {
  const coinbase = new Transaction()
  coinbase.version = 1
  coinbase.addInput(
    new Uint8Array(32),
    0xffffffff,
    0xffffffff,
    Uint8Array.from([1, 1])
  )
  coinbase.addOutput(Uint8Array.from([0x6a]), 0n)
  const block = new Block()
  block.version = 1
  block.prevHash = new Uint8Array(32)
  block.merkleRoot = Block.calculateMerkleRoot([coinbase, ...txs])
  block.timestamp = 0
  block.bits = 0
  block.nonce = 0
  block.transactions = [coinbase, ...txs]
  return block.toHex()
}

type MockTx = { hex: string; confirmedAt?: number }

/**
 * A client on an in-memory chain. `state.height` is the tip, `state.txs` maps
 * a txid to its raw hex and the height it confirms at, and `state.blockHex` is
 * every block (only a coinbase by default, so no replacement is found).
 */
function createMockChain({
  fail,
}: {
  fail?: (method: string, params: unknown[]) => boolean
} = {}) {
  const state = {
    height: 100,
    txs: new Map<string, MockTx>(),
    blockHex: makeBlockHex(),
    calls: {} as Record<string, number>,
  }
  const request = async ({
    method,
    params,
  }: {
    method: string
    params: unknown[]
  }) => {
    state.calls[method] = (state.calls[method] ?? 0) + 1
    if (fail?.(method, params)) {
      throw new Error(`${method} failed`)
    }
    switch (method) {
      case 'getblockcount':
        return state.height
      case 'getrawtransaction': {
        const txId = params[0] as string
        const tx = state.txs.get(txId)
        if (!tx) {
          throw new Error('No such mempool or blockchain transaction')
        }
        const confirmed =
          tx.confirmedAt !== undefined && state.height >= tx.confirmedAt
        return confirmed
          ? { txid: txId, hex: tx.hex, blockhash: 'bh', confirmations: 1 }
          : { txid: txId, hex: tx.hex, confirmations: 0 }
      }
      case 'getblockstats':
        return { height: state.height }
      case 'getblockhash':
        return 'bh'
      case 'getblock':
        return state.blockHex
      default:
        throw new Error(`Unexpected method ${method}`)
    }
  }
  const client = createClient({
    // No transport retries: they would add timers of their own.
    transport: custom({ request }, { retryCount: 0 }),
    pollingInterval: POLLING_INTERVAL,
  })
  return { client, state }
}

type Tracked = {
  status: 'pending' | 'resolved' | 'rejected'
  error?: unknown
}

/** Records how a promise settles, so a test can check it without waiting. */
function track(promise: Promise<unknown>): Tracked {
  const tracked: Tracked = { status: 'pending' }
  promise.then(
    () => {
      tracked.status = 'resolved'
    },
    (error) => {
      tracked.status = 'rejected'
      tracked.error = error
    }
  )
  return tracked
}

/** Every observer key that `client` still holds in the shared caches. */
function cacheKeysOf(client: { uid: string }): string[] {
  const uid = JSON.stringify(client.uid)
  return [...listenersCache.keys(), ...cleanupCache.keys()].filter((key) =>
    key.includes(uid)
  )
}

const waitId = (client: { uid: string }, txId: string) =>
  JSON.stringify(['waitForTransaction', client.uid, txId])

const watchId = (client: { uid: string }) =>
  JSON.stringify(['watchBlockNumber', client.uid, true, true, POLLING_INTERVAL])

const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms)

describe('waitForTransaction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('timeout branch (count > retryCount)', () => {
    // `retryCount: 1` makes the branch come on the 3rd block callback; the
    // default (10) reaches the same branch on the 12th.
    it('keeps the shared block watcher alive when the timed-out transaction confirms in that block', async () => {
      const { client, state } = createMockChain()
      const txA = makeTx()
      const txB = makeTx()
      const txC = makeTx()
      state.txs.set(txA.txId, { hex: txA.txHex })
      state.txs.set(txB.txId, { hex: txB.txHex })
      const wait = (tx: { txId: string; txHex: string }) =>
        track(
          waitForTransaction(client, {
            ...tx,
            senderAddress: SENDER,
            onReplaced: () => {},
            retryCount: 1,
          })
        )

      // A starts the shared block watcher: callback 1 at height 100.
      const a = wait(txA)
      await advance(0)
      // Callback 2.
      state.height = 101
      await advance(POLLING_INTERVAL)
      // B joins the shared block watcher.
      const b = wait(txB)
      await advance(0)
      expect(listenersCache.get(watchId(client))).toHaveLength(2)

      // A's callback 3 times out, and A is confirmed in that same block.
      state.txs.get(txA.txId)!.confirmedAt = 102
      state.height = 102
      await advance(POLLING_INTERVAL)
      expect(a.status).toBe('rejected')
      expect(a.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)

      // B confirms in the next block.
      state.txs.get(txB.txId)!.confirmedAt = 103
      state.height = 103
      await advance(POLLING_INTERVAL)
      expect(b.status).toBe('resolved')

      // A later wait on the same client gets its own block watcher.
      state.txs.set(txC.txId, { hex: txC.txHex, confirmedAt: 0 })
      const c = wait(txC)
      await advance(POLLING_INTERVAL)
      expect(c.status).toBe('resolved')

      expect(listenersCache.get(watchId(client)) ?? []).toEqual([])
      expect(cacheKeysOf(client)).toEqual([])
    })

    it('does not settle or stop a later wait on the same txId', async () => {
      // getblockhash for height 102 (A's timeout block) always fails.
      const { client, state } = createMockChain({
        fail: (method, params) =>
          method === 'getblockhash' && params[0] === 102,
      })
      const tx = makeTx()
      const txC = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex })
      const wait = (t: { txId: string; txHex: string }) =>
        track(
          waitForTransaction(client, {
            ...t,
            senderAddress: SENDER,
            onReplaced: () => {},
            retryCount: 1,
            retryDelay: 300,
          })
        )

      // Callbacks 1 and 2 at heights 100 and 101.
      const a = wait(tx)
      await advance(0)
      state.height = 101
      await advance(POLLING_INTERVAL)
      // Callback 3 times out.
      state.height = 102
      await advance(POLLING_INTERVAL)
      expect(a.status).toBe('rejected')
      expect(a.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)

      // The route is resumed: a wait on the same txId, inside the 300 ms in
      // which A's timeout callback could still retry getBlock(102).
      state.height = 103
      const b = wait(tx)
      await advance(400)
      expect(b.error).not.toBeInstanceOf(BlockNotFoundError)
      expect(b.status).toBe('pending')

      // B's transaction confirms in the next block.
      state.txs.get(tx.txId)!.confirmedAt = 104
      state.height = 104
      await advance(POLLING_INTERVAL)
      expect(b.status).toBe('resolved')

      // A later wait on the same client.
      state.txs.set(txC.txId, { hex: txC.txHex, confirmedAt: 0 })
      state.height = 105
      const c = wait(txC)
      await advance(POLLING_INTERVAL)
      expect(c.status).toBe('resolved')

      expect(listenersCache.get(watchId(client)) ?? []).toEqual([])
      expect(cacheKeysOf(client)).toEqual([])
    })
  })

  describe('observer cleanup', () => {
    it('removes every wait on one txId when the transaction confirms', async () => {
      const { client, state } = createMockChain()
      const tx = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex })
      const id = waitId(client, tx.txId)
      const wait = () =>
        track(
          waitForTransaction(client, {
            ...tx,
            senderAddress: SENDER,
            onReplaced: () => {},
          })
        )

      // A drives the observer; B (a resumed run) joins it.
      const a = wait()
      await advance(0)
      const b = wait()
      await advance(0)
      expect(listenersCache.get(id)).toHaveLength(2)

      state.txs.get(tx.txId)!.confirmedAt = 101
      state.height = 101
      await advance(POLLING_INTERVAL)
      expect(a.status).toBe('resolved')
      expect(b.status).toBe('resolved')
      expect(listenersCache.has(id)).toBe(false)

      // A third wait on the same txId starts its own observer and settles.
      const c = wait()
      await advance(POLLING_INTERVAL)
      expect(c.status).toBe('resolved')

      expect(cacheKeysOf(client)).toEqual([])
    })

    it('leaves no key behind for waits on distinct txIds', async () => {
      const { client, state } = createMockChain()
      const waits: Tracked[] = []
      for (let i = 0; i < 100; i++) {
        const tx = makeTx()
        state.txs.set(tx.txId, { hex: tx.txHex, confirmedAt: 0 })
        waits.push(
          track(
            waitForTransaction(client, {
              ...tx,
              senderAddress: SENDER,
              onReplaced: () => {},
            })
          )
        )
      }

      await advance(POLLING_INTERVAL)
      expect(waits.every((wait) => wait.status === 'resolved')).toBe(true)

      const waitKeys = cacheKeysOf(client).filter((key) =>
        key.includes('waitForTransaction')
      )
      expect(waitKeys).toEqual([])
      expect(cacheKeysOf(client)).toEqual([])
    })
  })

  describe('timeout option', () => {
    it('stops polling when the timeout expires', async () => {
      const { client, state } = createMockChain({
        fail: (method) => method === 'getblockcount',
      })
      const tx = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex })

      const wait = track(
        waitForTransaction(client, {
          ...tx,
          senderAddress: SENDER,
          onReplaced: () => {},
          // Off the polling grid, so the deadline is not on a poll tick.
          timeout: 10_500,
        })
      )

      await advance(10_499)
      expect(wait.status).toBe('pending')
      expect(state.calls.getblockcount).toBeGreaterThan(0)

      await advance(1)
      expect(wait.status).toBe('rejected')
      expect(wait.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)

      const calls = state.calls.getblockcount
      await advance(POLLING_INTERVAL * 5)
      expect(state.calls.getblockcount).toBe(calls)
      expect(vi.getTimerCount()).toBe(0)
      expect(cacheKeysOf(client)).toEqual([])
    })

    it('clears the timer when the transaction confirms first', async () => {
      const { client, state } = createMockChain()
      const tx = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex, confirmedAt: 0 })

      const wait = track(
        waitForTransaction(client, {
          ...tx,
          senderAddress: SENDER,
          onReplaced: () => {},
          timeout: 60_000,
        })
      )
      await advance(POLLING_INTERVAL)

      expect(wait.status).toBe('resolved')
      expect(vi.getTimerCount()).toBe(0)
      expect(cacheKeysOf(client)).toEqual([])
    })

    it('rejects only the joined wait when its own timeout expires', async () => {
      const { client, state } = createMockChain()
      const tx = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex })
      const id = waitId(client, tx.txId)
      const wait = (timeout?: number) =>
        track(
          waitForTransaction(client, {
            ...tx,
            senderAddress: SENDER,
            onReplaced: () => {},
            timeout,
          })
        )

      // A drives the observer with no timeout; B joins it with one.
      const a = wait()
      await advance(0)
      const b = wait(5_500)
      await advance(5_500)
      expect(b.status).toBe('rejected')
      expect(b.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)
      expect(a.status).toBe('pending')
      expect(listenersCache.get(id)).toHaveLength(1)

      state.txs.get(tx.txId)!.confirmedAt = 101
      state.height = 101
      await advance(POLLING_INTERVAL)
      expect(a.status).toBe('resolved')
      expect(cacheKeysOf(client)).toEqual([])
    })

    it('clears every timer when the retryCount timeout settles a driver and a joiner', async () => {
      const { client, state } = createMockChain()
      const tx = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex })
      const wait = (timeout: number) =>
        track(
          waitForTransaction(client, {
            ...tx,
            senderAddress: SENDER,
            onReplaced: () => {},
            retryCount: 1,
            timeout,
          })
        )

      // A drives the observer; B joins it. Both set a long timeout.
      const a = wait(3_600_000)
      await advance(0)
      const b = wait(7_200_000)
      await advance(0)
      // A's callback 3 (count 2 > retryCount 1) rejects every wait.
      state.height = 101
      await advance(POLLING_INTERVAL)
      state.height = 102
      await advance(POLLING_INTERVAL)
      expect(a.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)
      expect(b.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)

      // Let the stopped poll's last sleep run out.
      await advance(POLLING_INTERVAL * 3)
      expect(vi.getTimerCount()).toBe(0)
      expect(cacheKeysOf(client)).toEqual([])
    })

    it('does not settle a newer wait on the same txId when an in-flight callback fails after the timeout', async () => {
      // getblockhash for height 100 always fails, so A's first callback
      // retries getBlock(100) until about 6 s.
      const { client, state } = createMockChain({
        fail: (method, params) =>
          method === 'getblockhash' && params[0] === 100,
      })
      const tx = makeTx()
      state.txs.set(tx.txId, { hex: tx.txHex })

      const a = track(
        waitForTransaction(client, {
          ...tx,
          senderAddress: SENDER,
          onReplaced: () => {},
          retryCount: 3,
          retryDelay: 2_000,
          timeout: 1_500,
        })
      )
      await advance(1_500)
      expect(a.status).toBe('rejected')
      expect(a.error).toBeInstanceOf(WaitForTransactionReceiptTimeoutError)

      // A resumed run: C starts a new observer on the same txId. Its first
      // callback is at height 101, so only A's callback touches block 100.
      state.height = 101
      const c = track(
        waitForTransaction(client, {
          ...tx,
          senderAddress: SENDER,
          onReplaced: () => {},
        })
      )
      // A's getBlock(100) retries end with BlockNotFoundError.
      await advance(8_000)
      expect(c.error).toBeUndefined()
      expect(c.status).toBe('pending')

      state.txs.get(tx.txId)!.confirmedAt = 102
      state.height = 102
      await advance(POLLING_INTERVAL)
      expect(c.status).toBe('resolved')

      await advance(POLLING_INTERVAL * 3)
      expect(vi.getTimerCount()).toBe(0)
      expect(cacheKeysOf(client)).toEqual([])
    })
  })

  describe('replacement', () => {
    it('rejects with the error that onReplaced throws', async () => {
      const { client, state } = createMockChain()
      const spends = ++txSeed
      const original = makeTx(spends)
      const replacement = makeTx(spends, 1)
      // The original left the mempool; its replacement is in the tip block.
      state.txs.set(replacement.txId, {
        hex: replacement.txHex,
        confirmedAt: 0,
      })
      state.blockHex = makeBlockHex([Transaction.fromHex(replacement.txHex)])
      const error = new Error('onReplaced failed')

      const wait = track(
        waitForTransaction(client, {
          ...original,
          senderAddress: SENDER,
          onReplaced: () => {
            throw error
          },
          retryCount: 0,
        })
      )
      await advance(POLLING_INTERVAL)

      expect(wait.status).toBe('rejected')
      expect(wait.error).toBe(error)
      expect(listenersCache.get(watchId(client)) ?? []).toEqual([])
      expect(cacheKeysOf(client)).toEqual([])
    })
  })
})
