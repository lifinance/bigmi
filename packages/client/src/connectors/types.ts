import type {
  BtcRpcRequestFn,
  ChainId,
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
  chainId?: ChainId
}

export type ProviderRequestParams = RpcParameters<
  [...UTXOWalletSchema, ...UTXOSchema]
>
export type UTXOWalletProvider = {
  request: BtcRpcRequestFn<UTXOWalletSchema>
}
