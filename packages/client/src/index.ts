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
} from './actions/connect.js'
export {
  disconnect,
  type DisconnectParameters,
  type DisconnectReturnType,
} from './actions/disconnect.js'

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

export type { State } from './types/state.js'
export { type Config, createConfig } from './factories/createConfig.js'
export type { CreateConnectorFn, Connector } from './types/connector.js'
