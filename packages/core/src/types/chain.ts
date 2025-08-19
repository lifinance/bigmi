export enum ChainId {
  BITCOIN_MAINNET = 'bitcoin:mainnet',
  BITCOIN_TESTNET = 'bitcoin:testnet',
  BITCOIN_TESTNET4 = 'bitcoin:testnet4',
  BITCOIN_SIGNET = 'bitcoin:signet',
  FRACTAL_BITCOIN_MAINNET = 'fractal:mainnet',
  FRACTAL_BITCOIN_TESTNET = 'fractal:testnet',
  STACKS_MAINNET = 'stacks:mainnet',
  STACKS_TESTNET = 'stacks:testnet',
}

export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Regtest = 'regtest',
}

export type Chain<
  formatters extends ChainFormatters | undefined = ChainFormatters | undefined,
  custom extends Record<string, unknown> | undefined =
    | Record<string, unknown>
    | undefined,
> = {
  /** Collection of block explorers */
  blockExplorers?:
    | {
        [key: string]: ChainBlockExplorer
        default: ChainBlockExplorer
      }
    | undefined
  /** ID in number form */
  id: ChainId
  /** Human-readable name */
  name: string
  /** Collection of RPC endpoints */
  rpcUrls: {
    [key: string]: ChainRpcUrls
    default: ChainRpcUrls
  }
  /** Flag for test networks */
  testnet?: boolean | undefined
} & ChainConfig<formatters, custom>

export type ChainConfig<
  formatters extends ChainFormatters | undefined = ChainFormatters | undefined,
  custom extends Record<string, unknown> | undefined =
    | Record<string, unknown>
    | undefined,
> = {
  /** Custom chain data. */
  custom?: custom | undefined
  /** Modifies how data is formatted and typed (e.g. blocks and transactions) */
  formatters?: formatters | undefined
}

/////////////////////////////////////////////////////////////////////
// Formatters
/////////////////////////////////////////////////////////////////////

export type ChainFormatters = {
  /** Modifies how the Block structure is formatted & typed. */
  block?: ChainFormatter<'block'> | undefined
  /** Modifies how the Transaction structure is formatted & typed. */
  transaction?: ChainFormatter<'transaction'> | undefined
  /** Modifies how the TransactionReceipt structure is formatted & typed. */
  transactionReceipt?: ChainFormatter<'transactionReceipt'> | undefined
  /** Modifies how the TransactionRequest structure is formatted & typed. */
  transactionRequest?: ChainFormatter<'transactionRequest'> | undefined
}

export type ChainFormatter<type extends string = string> = {
  format: (args: any) => any
  type: type
}

/////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////

type ChainBlockExplorer = {
  name: string
  url: string
  apiUrl?: string | undefined
}

type ChainRpcUrls = {
  http: readonly string[]
  webSocket?: readonly string[] | undefined
}
