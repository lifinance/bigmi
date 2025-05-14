export type RpcRequest = {
  jsonrpc?: '2.0' | undefined
  method: string
  params?: any | undefined
  id?: number | undefined
}

export type RpcResponse<result = any, error = any> = {
  jsonrpc: `${number}`
  id: number
} & (SuccessResult<result> | ErrorResult<error>)

type SuccessResult<result> = {
  method?: undefined
  result: result
  error?: undefined
}
type ErrorResult<error> = {
  method?: undefined
  result?: undefined
  error: error
}

export type BitcoinRpcMethods = [...WalletRpcSchema]

export type WalletRpcSchema = [
  {
    Method: 'getAddressInfo'
    Parameters?: undefined
    ReturnType: string
  },
  {
    Method: 'getBalance'
    Parameters?: undefined
    ReturnType: bigint
  },
]
