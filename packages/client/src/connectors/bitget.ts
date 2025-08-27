import {
  type Account,
  type Address,
  BaseError,
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

export type BitgetBitcoinNetworks = 'livenet' | 'testnet' | 'signet'

export type BitgetBitcoinEventMap = {
  accountsChanged(accounts: Address[]): void
  networkChanged(network: BitgetBitcoinNetworks): void
}

export type BitgetBitcoinEvents = {
  addListener<TEvent extends keyof BitgetBitcoinEventMap>(
    event: TEvent,
    listener: BitgetBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof BitgetBitcoinEventMap>(
    event: TEvent,
    listener: BitgetBitcoinEventMap[TEvent]
  ): void
}

type BitgetConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<BitgetBitcoinProvider>
} & UTXOWalletProvider

type BitgetBitcoinProvider = {
  requestAccounts(): Promise<Address[]>
  getAccounts(): Promise<Address[]>
  getPublicKey(): Promise<string>
  getNetwork(): Promise<BitgetBitcoinNetworks>
  switchNetwork(network: BitgetBitcoinNetworks): Promise<BitgetBitcoinNetworks>
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
} & BitgetBitcoinEvents

bitget.type = 'UTXO' as const
export function bitget(parameters: UTXOConnectorParameters = {}) {
  const {
    forward: BitgetBitcoinNetworkChainIdMap,
    reverse: ChainIdToBitgetMap,
  } = createBidirectionalMap<BitgetBitcoinNetworks, ChainId>([
    ['livenet', ChainId.BITCOIN_MAINNET],
    ['testnet', ChainId.BITCOIN_TESTNET],
    ['signet', ChainId.BITCOIN_SIGNET],
  ] as const)
  const { shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Address[]) => void) | undefined
  let chainChanged: ((network: BitgetBitcoinNetworks) => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    BitgetConnectorProperties
  >((config) => ({
    id: 'bitget',
    name: 'Bitget',
    type: bitget.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMDAxRjI5Ii8+CjxwYXRoIGQ9Ik0yMTkuOTQ4IDk1LjcwMjJDMjAxLjYyMyA5NS42OTI5IDE4My4zMyA5NS42ODM1IDE2NC45NDEgOTUuNzExNkMxNTMuODIyIDk1LjcxMTYgMTQ5LjY1MSAxMDkuNjcxIDE1Ny45MjEgMTE3LjkzOUwyODMuMDk4IDI0My4xMTdDMjg3LjAwNCAyNDYuNjkgMjg5LjQ0MSAyNTAuNTc0IDI4OS41MyAyNTUuNjkzQzI4OS40NDEgMjYwLjgxMiAyODcuMDA0IDI2NC42OTYgMjgzLjA5OCAyNjguMjY5TDE1Ny45MjEgMzkzLjQ0NkMxNDkuNjUxIDQwMS43MTUgMTUzLjgyMiA0MTUuNjc0IDE2NC45NDEgNDE1LjY3NEMxODMuMzMgNDE1LjcwMiAyMDEuNjIzIDQxNS42OTMgMjE5Ljk0OCA0MTUuNjgzQzIyOS4xMjIgNDE1LjY3OSAyMzguMzA1IDQxNS42NzQgMjQ3LjUxMSA0MTUuNjc0QzI1OS41NTUgNDE1LjY3NCAyNjYuNzIgNDA5LjI0IDI3My4xNTQgNDAyLjgwNUwzODYuMDQ3IDI4OS45MTJDMzk1LjA1NyAyODAuOTAyIDQwMy4xMTkgMjY4LjkzOSA0MDMuMDA5IDI1NS42OTNDNDAzLjExOSAyNDIuNDQ3IDM5NS4wNTcgMjMwLjQ4NCAzODYuMDQ3IDIyMS40NzRMMjczLjE1NCAxMDguNThDMjY2LjcyIDEwMi4xNDYgMjU5LjU1NSA5NS43MTE2IDI0Ny41MTEgOTUuNzExNkMyMzguMzA1IDk1LjcxMTYgMjI5LjEyMiA5NS43MDY5IDIxOS45NDggOTUuNzAyMloiIGZpbGw9IiMwMEYwRkYiLz4KPC9zdmc+',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      if ('bitkeep' in window) {
        const anyWindow: any = window
        return anyWindow.bitkeep?.unisat
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
      this: BitgetBitcoinProvider,
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
        const address = await provider.requestAccounts()
        if (!address) {
          throw new BaseError('error connecting to your wallet')
        }
        const accounts = await this.getAccounts()
        const chainId = await this.getChainId()

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
          provider.addListener('accountsChanged', accountsChanged)
        }

        if (!chainChanged) {
          chainChanged = (network: BitgetBitcoinNetworks) =>
            this.onChainChanged(BitgetBitcoinNetworkChainIdMap[network])
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
        // remove outdated shims and clean up events
        await this.disconnect()
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

      if (!publicKey.length) {
        throw new BaseError('public key not found')
      }
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
      return BitgetBitcoinNetworkChainIdMap[network]
    },
    async isAuthorized() {
      try {
        if (shimDisconnect) {
          return Boolean(await config.storage?.getItem(`${this.id}.connected`))
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

        const network = ChainIdToBitgetMap[chainId]
        if (!network) {
          throw new ChainNotSupportedError(chainId, bitget.name)
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
        const provider = await this.getInternalProvider()
        if (!provider) {
          throw new ProviderNotFoundError()
        }
        const newAccounts = await this.getAccounts()
        config.emitter.emit('change', {
          accounts: newAccounts,
        })
      }
    },
    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error) {
      // No need to remove `${this.id}.disconnected` from storage because `onDisconnect` is typically
      // only called when the wallet is disconnected through the wallet's interface, meaning the wallet
      // actually disconnected and we don't need to simulate it.
      config.emitter.emit('disconnect')
    },
  }))
}
