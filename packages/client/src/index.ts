// Actions
export { getAccount } from './actions/getAccount.js'
export type { GetAccountReturnType } from './actions/getAccount.js'
export { getAddress } from './actions/getAddress.js'
export { getConnectorClient } from './actions/getConnectorClient.js'
export { reconnect } from './actions/reconnect.js'
export { watchAccount } from './actions/watchAccount.js'
export {
  connect,
  type ConnectParameters,
  type ConnectReturnType,
  type ConnectErrorType,
} from './actions/connect.js'
export {
  disconnect,
  type DisconnectParameters,
  type DisconnectReturnType,
} from './actions/disconnect.js'
export {
  type GetConnectorsReturnType,
  getConnectors,
} from './actions/getConnectors.js'
export {
  type WatchConnectorsParameters,
  type WatchConnectorsReturnType,
  watchConnectors,
} from './actions/watchConnectors.js'

export { ctrl } from './connectors/ctrl.js'
export { okx } from './connectors/okx.js'
export { leather } from './connectors/leather.js'
export { onekey } from './connectors/onekey.js'
export { dynamic } from './connectors/dynamic.js'
export type {
  CtrlBitcoinEventMap,
  CtrlBitcoinEvents,
} from './connectors/ctrl.js'
export { phantom } from './connectors/phantom.js'
export type {
  PhantomBitcoinEventMap,
  PhantomBitcoinEvents,
} from './connectors/phantom.js'
export type { UTXOConnectorParameters } from './connectors/types.js'
export { unisat } from './connectors/unisat.js'
export type {
  UnisatBitcoinEventMap,
  UnisatBitcoinEvents,
} from './connectors/unisat.js'
export { xverse } from './connectors/xverse.js'
export type {
  XverseBitcoinEventMap,
  XverseBitcoinEvents,
} from './connectors/xverse.js'
export { binance } from './connectors/binance.js'
export type {
  BinanceBitcoinEventMap,
  BinanceBitcoinEvents,
} from './connectors/binance.js'
export { bitget } from './connectors/bitget.js'
export type {
  BitgetBitcoinEventMap,
  BitgetBitcoinEvents,
} from './connectors/bitget.js'
export { oyl } from './connectors/oyl.js'
export type { OylConnectorProperties } from './connectors/oyl.js'
export { magicEden } from './connectors/magicEden.js'
export type {
  MagicEdenBitcoinEventMap,
  MagicEdenBitcoinEvents,
} from './connectors/magicEden.js'

// client types
export type { State } from './types/state.js'
export { type Config, createConfig } from './factories/createConfig.js'
export type { CreateConnectorFn, Connector } from './types/connector.js'

// queries
export { hashFn } from './query/utils.js'
export type {
  ConnectData,
  ConnectMutate,
  ConnectMutateAsync,
  ConnectVariables,
} from './query/connect.js'
export { connectMutationOptions } from './query/connect.js'
