import { describe, expect, it, vi } from 'vitest'
import { createClient } from '../factories/createClient.js'
import { custom } from '../transports/custom.js'
import type { SignPsbtParameters } from '../transports/types.js'
import { signPsbt } from './signPsbt.js'

const params: SignPsbtParameters = {
  psbt: '70736274ff01',
  inputsToSign: [{ address: 'bc1qsender', signingIndexes: [0] }],
  finalize: false,
}

/**
 * A wallet client as an app builds it with `custom`: the transport keeps the
 * default retryCount (3).
 */
const walletClient = (request: (args: unknown) => Promise<unknown>) =>
  createClient({ transport: custom({ request }) })

describe('signPsbt', () => {
  it('asks the wallet once when the wallet rejects', async () => {
    // A wallet cancel without a code. bigmi wraps it as "Unknown Error",
    // which has no numeric code, so the client would retry it, and each
    // retry opens the wallet prompt again.
    const request = vi.fn(async () => {
      throw new Error('Transaction canceled')
    })

    await expect(signPsbt(walletClient(request), params)).rejects.toMatchObject(
      {
        shortMessage: 'Unknown Error',
        details: 'Transaction canceled',
      }
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('returns the signed PSBT of the wallet', async () => {
    const request = vi.fn(async () => '70736274ff02')

    await expect(signPsbt(walletClient(request), params)).resolves.toBe(
      '70736274ff02'
    )
    expect(request.mock.calls).toEqual([[{ method: 'signPsbt', params }]])
  })

  it('asks the wallet once for two identical requests at the same time', async () => {
    const request = vi.fn(async () => '70736274ff02')
    const client = walletClient(request)

    await expect(
      Promise.all([signPsbt(client, params), signPsbt(client, params)])
    ).resolves.toEqual(['70736274ff02', '70736274ff02'])
    expect(request).toHaveBeenCalledTimes(1)
  })
})
