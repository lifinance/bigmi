import { RpcErrorCode } from '../../errors/rpc.js'

export function getRpcErrorCode(error: string): RpcErrorCode {
  if (error.toLowerCase().startsWith('rate limit exceeded')) {
    return RpcErrorCode.ACCESS_DENIED
  }
  return RpcErrorCode.MISC_ERROR
}
