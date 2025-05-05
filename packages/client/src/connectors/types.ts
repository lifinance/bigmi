import type {
  BtcRpcRequestFn,
  RpcParameters,
  UTXOSchema,
  UTXOWalletSchema,
} from '@bigmi/core'

export type UTXOConnectorParameters = {
  /**
   * Some injected providers do not support programmatic disconnect.
   * This flag simulates the disconnect behavior by keeping track of connection status in storage.
   * @default true
   */
  shimDisconnect?: boolean
  chainId?: number
}

export type ProviderRequestParams = RpcParameters<
  [...UTXOWalletSchema, ...UTXOSchema]
>
export type UTXOWalletProvider = {
  request: BtcRpcRequestFn<UTXOWalletSchema>
}
