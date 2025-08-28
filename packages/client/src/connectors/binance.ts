import {
  type Account,
  type Address,
  ChainId,
  getAddressInfo,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  type SignPsbtParameters,
  UserRejectedRequestError,
} from '@bigmi/core'
import { ChainNotSupportedError } from '../errors/connectors.js'
import { createConnector } from '../factories/createConnector.js'
import { createBidirectionalMap } from '../utils/createBidirectionalMap.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type BinanceBitcoinNetworks = 'livenet' | 'testnet' | 'signet'

export type BinanceBitcoinEventMap = {
  accountsChanged(accounts: Address[]): void
  networkChanged(network: BinanceBitcoinNetworks): void
}

export type BinanceBitcoinEvents = {
  addListener<TEvent extends keyof BinanceBitcoinEventMap>(
    event: TEvent,
    listener: BinanceBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof BinanceBitcoinEventMap>(
    event: TEvent,
    listener: BinanceBitcoinEventMap[TEvent]
  ): void
}

type BinanceConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<BinanceBitcoinProvider>
  switchChain({ chainId }: { chainId: ChainId }): Promise<boolean>
} & UTXOWalletProvider

type BinanceBitcoinProvider = {
  getPublicKey(): Promise<string>
  requestAccounts(): Promise<Address[]>
  getAccounts(): Promise<Address[]>
  getNetwork(): Promise<BinanceBitcoinNetworks>
  switchNetwork(network: BinanceBitcoinNetworks): Promise<boolean>
  signPsbt(
    psbtHex: string,
    options: {
      toSignInputs: {
        index: number
        address: string
        sighashTypes?: number[]
      }[]
      autoFinalized?: boolean
    }
  ): Promise<string>
} & BinanceBitcoinEvents

binance.type = 'UTXO' as const
export function binance(parameters: UTXOConnectorParameters = {}) {
  const {
    forward: BinanceBitcoinNetworkChainIdMap,
    reverse: ReverseChainIdMap,
  } = createBidirectionalMap<BinanceBitcoinNetworks, ChainId>([
    ['livenet', ChainId.BITCOIN_MAINNET],
    ['testnet', ChainId.BITCOIN_TESTNET],
    ['signet', ChainId.BITCOIN_SIGNET],
  ] as const)
  const { shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Address[]) => void) | undefined
  let chainChanged: ((network: BinanceBitcoinNetworks) => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    BinanceConnectorProperties
  >((config) => ({
    id: 'binance',
    name: 'Binance',
    type: binance.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczp4PSJuc19leHRlbmQ7IiB4bWxuczppPSJuc19haTsiIHhtbG5zOmdyYXBoPSJuc19ncmFwaHM7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUwIDUwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MCA1MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgogPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KICAuc3Qwe2ZpbGw6I0YwQjkwQjt9CiA8L3N0eWxlPgogPG1ldGFkYXRhPgogIDxzZncgeG1sbnM9Im5zX3NmdzsiPgogICA8c2xpY2VzPgogICA8L3NsaWNlcz4KICAgPHNsaWNlU291cmNlQm91bmRzIGJvdHRvbUxlZnRPcmlnaW49InRydWUiIGhlaWdodD0iNTAiIHdpZHRoPSI1MCIgeD0iMjQ5Ny45IiB5PSItNzEyLjIiPgogICA8L3NsaWNlU291cmNlQm91bmRzPgogIDwvc2Z3PgogPC9tZXRhZGF0YT4KIDxnPgogIDxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xMS4zLDI1bC01LjYsNS42TDAsMjVsNS43LTUuN0wxMS4zLDI1eiBNMjUsMTEuM2w5LjcsOS43bDUuNy01LjdMMjUsMEw5LjcsMTUuM2w1LjcsNS43TDI1LDExLjN6IE00NC4zLDE5LjMgICBMMzguNywyNWw1LjcsNS43TDUwLDI1TDQ0LjMsMTkuM3ogTTI1LDM4LjdMMTUuMywyOWwtNS43LDUuN0wyNSw1MGwxNS4zLTE1LjNMMzQuNywyOUwyNSwzOC43eiBNMjUsMzAuNmw1LjctNS43TDI1LDE5LjNMMTkuMywyNSAgIEwyNSwzMC42TDI1LDMwLjZ6Ij4KICA8L3BhdGg+CiA8L2c+Cjwvc3ZnPg==',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      if ('binancew3w' in window) {
        const anyWindow: any = window
        return anyWindow.binancew3w.bitcoin
      }
      if ('unisat' in window) {
        const anyWindow: any = window
        if (anyWindow.unisat.isBinance) {
          return anyWindow.unisat
        }
      }
    },
    async getProvider() {
      const internalProvider = await this.getInternalProvider()
      if (!internalProvider) {
        return
      }
      const provider = {
        request: this.request.bind(internalProvider),
      }
      return provider
    },
    async request(
      this: BinanceBitcoinProvider,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters
          const toSignInputs = options.inputsToSign.flatMap(
            ({ sigHash, address, signingIndexes }) =>
              signingIndexes.map((index) => ({
                index,
                address,
                sighashTypes: sigHash !== undefined ? [sigHash] : undefined,
              }))
          )
          const signedPsbt = await this.signPsbt(psbt, {
            toSignInputs,
            autoFinalized: options.finalize,
          })
          return signedPsbt
        }
        default:
          throw new MethodNotSupportedRpcError()
      }
    },
    async connect() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      try {
        await provider.requestAccounts()
        const accounts = await this.getAccounts()

        const chainId = await this.getChainId()

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
          provider.addListener('accountsChanged', accountsChanged)
        }

        if (!chainChanged) {
          chainChanged = (network: BinanceBitcoinNetworks) =>
            this.onChainChanged(BinanceBitcoinNetworkChainIdMap[network])
          provider.addListener('networkChanged', chainChanged)
        }

        // Remove disconnected shim if it exists
        if (shimDisconnect) {
          await Promise.all([
            config.storage?.setItem(`${this.id}.connected`, true),
            config.storage?.removeItem(`${this.id}.disconnected`),
          ])
        }
        return { accounts, chainId }
      } catch (error: any) {
        throw new UserRejectedRequestError(error.message)
      }
    },
    async disconnect() {
      const provider = await this.getInternalProvider()

      if (accountsChanged) {
        provider?.removeListener('accountsChanged', accountsChanged)
        accountsChanged = undefined
      }

      if (chainChanged) {
        provider?.removeListener('networkChanged', chainChanged)
        chainChanged = undefined
      }

      // Add shim signalling connector is disconnected
      if (shimDisconnect) {
        await Promise.all([
          config.storage?.setItem(`${this.id}.disconnected`, true),
          config.storage?.removeItem(`${this.id}.connected`),
        ])
      }
    },
    async getAccounts() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      const accounts = await provider.getAccounts()
      const address = accounts[0]
      const publicKey = await provider.getPublicKey()
      const { type, purpose } = getAddressInfo(address)

      const account: Account = {
        address,
        addressType: type,
        publicKey,
        purpose,
      }
      return [account]
    },
    async getChainId() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      const network = await provider.getNetwork()
      return BinanceBitcoinNetworkChainIdMap[network]
    },
    async isAuthorized() {
      try {
        const isDisconnected =
          shimDisconnect &&
          // If shim exists in storage, connector is disconnected
          (await config.storage?.getItem(`${this.id}.disconnected`))
        if (isDisconnected) {
          return false
        }
        const accounts = await this.getAccounts()
        return !!accounts.length
      } catch {
        return false
      }
    },
    async switchChain({ chainId }) {
      try {
        const provider = await this.getInternalProvider()
        if (!provider) {
          throw new ProviderNotFoundError()
        }
        const network = ReverseChainIdMap[chainId]
        if (!network) {
          throw new ChainNotSupportedError(chainId, binance.name)
        }
        const result = await provider.switchNetwork(network)
        return Boolean(result)
      } catch {
        return false
      }
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        const newAccounts = await this.getAccounts()
        config.emitter.emit('change', {
          accounts: newAccounts,
        })
      }
    },
    async onChainChanged(chainId: ChainId) {
      const accounts = await this.getAccounts()
      config.emitter.emit('change', { chainId, accounts })
    },
    async onDisconnect(_error) {
      // No need to remove `${this.id}.disconnected` from storage because `onDisconnect` is typically
      // only called when the wallet is disconnected through the wallet's interface, meaning the wallet
      // actually disconnected and we don't need to simulate it.
      config.emitter.emit('disconnect')
    },
  }))
}
