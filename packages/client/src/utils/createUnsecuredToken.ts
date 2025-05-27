import { base64urlEncode } from '@bigmi/core'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[]

export function createUnsecuredToken(payload: Json) {
  const header = { typ: 'JWT', alg: 'none' }
  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  return `${encodedHeader}.${encodedPayload}.`
}
