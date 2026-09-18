import { describe, expect, it } from 'vitest'
import { isUserRejection } from './isUserRejection.js'

describe('isUserRejection', () => {
  it('matches the MetaMask Bitcoin cancellation', () => {
    // Captured from MetaMask 12.x rejecting a signTransaction confirmation.
    // The thrown error carries no `code`; its own cause is a generic -32603.
    const error = Object.assign(new Error('User canceled the confirmation'), {
      cause: Object.assign(new Error('User canceled the confirmation'), {
        code: -32603,
      }),
    })
    expect(isUserRejection(error)).toBe(true)
  })

  it.each([
    'User rejected the request',
    'User denied transaction signature',
    'user cancelled the request',
    'Request rejected by user',
    'Transaction denied by user',
  ])('matches %j', (message) => {
    expect(isUserRejection(new Error(message))).toBe(true)
  })

  it.each([
    'Internal error',
    'Request timed out',
    'Transaction rejected by the node',
    'Insufficient funds',
    'Connection denied by remote host',
    'canceled',
    '',
  ])('does not match %j', (message) => {
    expect(isUserRejection(new Error(message))).toBe(false)
  })

  it('does not match a non-error value', () => {
    expect(isUserRejection(undefined)).toBe(false)
    expect(isUserRejection('User canceled the confirmation')).toBe(false)
  })
})
