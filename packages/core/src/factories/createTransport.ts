import type { Transport, TransportConfig } from '../types/transport.js'
import { buildRequest } from '../utils/buildRequest.js'
import { uid as uid_ } from '../utils/uid.js'

/**
 * @description Creates an transport intended to be used with a client.
 */
export function createTransport<
  type extends string,
  rpcAttributes extends Record<string, any>,
>(
  {
    key,
    methods,
    name,
    request,
    retryCount = 3,
    retryDelay = 150,
    timeout,
    type,
  }: TransportConfig<type>,
  value?: rpcAttributes | undefined
): ReturnType<Transport<type, rpcAttributes>> {
  const uid = uid_()
  return {
    config: {
      key,
      methods,
      name,
      request,
      retryCount,
      retryDelay,
      timeout,
      type,
    },
    request: buildRequest(request, { methods, retryCount, retryDelay, uid }),
    value,
  }
}
