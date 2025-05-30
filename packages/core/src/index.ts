// Exporting actions
export { getBalance } from './actions/getBalance.js'
export { getBlock } from './actions/getBlock.js'
export type {
  GetBlockParameters,
  GetBlockReturnType,
} from './actions/getBlock.js'
export { getBlockCount } from './actions/getBlockCount.js'
export type { GetBlockCountReturnType } from './actions/getBlockCount.js'
export { getBlockStats } from './actions/getBlockStats.js'
export type {
  GetBlockStatsParameters,
  GetBlockStatsReturnType,
} from './actions/getBlockStats.js'
export { getUTXOTransaction } from './actions/getUTXOTransaction.js'
export type {
  GetUTXOTransactionParameters,
  GetUTXOTransactionReturnType,
} from './actions/getUTXOTransaction.js'
export { sendUTXOTransaction } from './actions/sendUTXOTransaction.js'
export type {
  SendUTXOTransactionParameters,
  SendUTXOTransactionReturnType,
} from './actions/sendUTXOTransaction.js'
export { signPsbt } from './actions/signPsbt.js'
export { waitForTransaction } from './actions/waitForTransaction.js'
export type {
  ReplacementReason,
  ReplacementReturnType,
  WaitForTransactionReceiptParameters,
  WaitForTransactionReceiptReturnType,
  WithRetryParameters,
} from './actions/waitForTransaction.js'
export { watchBlockNumber } from './actions/watchBlockNumber.js'
export type {
  OnBlockNumberFn,
  OnBlockNumberParameter,
  WatchBlockNumberParameters,
  WatchBlockNumberReturnType,
} from './actions/watchBlockNumber.js'
export { getUTXOs } from './actions/getUTXOs.js'
export type {
  GetUTXOsParameters,
  GetUTXOsReturnType,
} from './actions/getUTXOs.js'
export { getTransactions } from './actions/getTransactions.js'
export type {
  GetTransactionsParameters,
  GetTransactionsReturnType,
} from './actions/getTransactions.js'

// Exporting clients
export {
  type PublicActions,
  publicActions,
} from './clients/decorators/public.js'
export {
  type WalletActions,
  walletActions,
} from './clients/decorators/wallet.js'

// Exporting transports
export { ankrMethods } from './transports/ankr/methods.js'
export { blockchairMethods } from './transports/blockchair/methods.js'
export { blockcypherMethods } from './transports/blockcypher/methods.js'
export { getHttpRpcClient } from './transports/getHttpRpcClient.js'
export type {
  HttpRequestParameters,
  HttpRpcClient,
  RpcRequest,
} from './transports/getHttpRpcClient.js'
export { getRpcProviderMethods } from './transports/getRpcProviderMethods.js'
export { mempoolMethods } from './transports/mempool/methods.js'
export type {
  ErrorResult,
  RpcMethodHandler,
  RpcMethods,
  RpcResponse,
  SuccessResult,
  UTXOSchema,
  UTXOWalletSchema,
  SignPsbtParameters,
  SignPsbtReturnType,
} from './transports/types.js'
export { utxo } from './transports/utxo.js'
export { custom } from './transports/custom.js'
export { ankr } from './transports/ankr/ankr.js'
export { blockchair } from './transports/blockchair/blockchair.js'
export { blockcypher } from './transports/blockcypher/blockcypher.js'
export { mempool } from './transports/mempool/mempool.js'

// Exporting types
export type { Account } from './types/account.js'
export type { Address } from './types/address.js'
export type { BlockTag } from './types/block.js'
export type { BlockStats, BlockStatsKeys } from './types/blockStats.js'
export type {
  Chain,
  ChainConfig,
  ChainFormatter,
  ChainFormatters,
} from './types/chain.js'
export type {
  Client,
  ClientConfig,
  CreateClientErrorType,
} from './types/client.js'
export type { Hash } from './types/hash.js'
export type {
  BtcRpcRequestFn,
  BtcRpcRequestOptions,
  RpcParameters,
  RpcSchema,
  RpcSchemaOverride,
} from './types/request.js'
export type {
  BitcoinRpcMethods,
  WalletRpcSchema,
} from './types/rpc.js'
export type { UTXOTransaction } from './types/transaction.js'
export type {
  Assign,
  Compute,
  ExactPartial,
  IsNarrowable,
  IsNever,
  IsUnknown,
  LooseOmit,
  UnionStrictOmit,
} from './types/utils.js'

// Exporting utils
export { cancelTransaction } from './utils/cancelTransaction.js'
export {
  UTXOAddressType,
  UTXONetwork,
  getUTXOAddress,
} from './utils/getUTXOAddress.js'
export type { UTXOAddress } from './utils/getUTXOAddress.js'
export { isUTXOAddress } from './utils/isUTXOAddress.js'
export { modifyFee } from './utils/modifyFee.js'
export { cleanupCache, listenersCache, observe } from './utils/observe.js'
export { poll } from './utils/poll.js'
export {
  base64ToHex,
  hexToBase64,
  base64urlEncode,
  stringToHex,
} from './utils/converter.js'
export { withRetry } from './utils/withRetry.js'
export { parseAccount } from './utils/parseAccount.js'
export { deepEqual } from './utils/deepEqual.js'
export { withTimeout } from './utils/withTimeout.js'

// Exporting factories
export { createClient, rpcSchema } from './factories/createClient.js'

// Exporting chains
export { bitcoin } from './chains/bitcoin.js'
export { defineChain } from './chains/defineChain.js'

// Exporting errors
export {
  InvalidAddressError,
  type InvalidAddressErrorType,
} from './errors/address.js'
export { BaseError, type BaseErrorType } from './errors/base.js'
export { BlockNotFoundError } from './errors/block.js'
export {
  ChainNotConfiguredError,
  ConnectorAccountNotFoundError,
  ConnectorAlreadyConnectedError,
  ConnectorChainMismatchError,
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
} from './errors/config.js'
export { ProviderNotFoundError } from './errors/provider.js'
export {
  HttpRequestError,
  RpcRequestError,
  SocketClosedError,
  TimeoutError,
} from './errors/request.js'
export {
  MethodNotSupportedRpcError,
  ParseError,
  RpcErrorCode,
  UserRejectedRequestError,
} from './errors/rpc.js'
export {
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from './errors/transaction.js'
export {
  InsufficientUTXOBalanceError,
  type InsufficientUTXOBalanceErrorType,
} from './errors/utxo.js'
export { UrlRequiredError } from './errors/transport.js'
export type { ErrorType } from './errors/utils.js'

export {
  http,
  type HttpTransport,
  type HttpTransportConfig,
  type HttpTransportErrorType,
} from './transports/http.js'

export {
  fallback,
  type FallbackTransport,
  type FallbackTransportConfig,
  type FallbackTransportErrorType,
} from './transports/fallback.js'

export type { Transport } from './types/transport.js'

export type { OneOf, RemoveUndefined } from './types/utils.js'
export { uid } from './utils/uid.js'
export { version } from './version.js'
