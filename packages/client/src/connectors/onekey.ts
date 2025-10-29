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

export type OneKeyBitcoinNetwork = 'livenet' | 'testnet'

export type OneKeyBitcoinEventMap = {
  accountsChanged(accounts: Address[]): void
  networkChanged(network: OneKeyBitcoinNetwork): void
}

export type OneKeyBitcoinEvents = {
  addListener<TEvent extends keyof OneKeyBitcoinEventMap>(
    event: TEvent,
    listener: OneKeyBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof OneKeyBitcoinEventMap>(
    event: TEvent,
    listener: OneKeyBitcoinEventMap[TEvent]
  ): void
}

type OneKeyConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<OneKeyBitcoinProvider>
  switchChain({ chainId }: { chainId: ChainId }): Promise<boolean>
} & UTXOWalletProvider

type OneKeyBitcoinProvider = {
  requestAccounts(): Promise<Address[]>
  getAccounts(): Promise<Address[]>
  getPublicKey(): Promise<string>
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
  getNetwork(): Promise<OneKeyBitcoinNetwork>
  switchNetwork(network: OneKeyBitcoinNetwork): Promise<OneKeyBitcoinNetwork>
} & OneKeyBitcoinEvents

onekey.type = 'UTXO' as const
export function onekey(parameters: UTXOConnectorParameters = {}) {
  const {
    forward: OneKeyBitcoinNetworkChainIdMap,
    reverse: ChainIdToOneKeyMap,
  } = createBidirectionalMap<OneKeyBitcoinNetwork, ChainId>([
    ['livenet', ChainId.BITCOIN_MAINNET],
    ['testnet', ChainId.BITCOIN_TESTNET],
  ] as const)
  const { shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Address[]) => void) | undefined
  let chainChanged: ((network: OneKeyBitcoinNetwork) => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    OneKeyConnectorProperties
  >((config) => ({
    id: 'so.onekey.app.wallet.bitcoin',
    name: 'OneKey',
    type: onekey.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNi42NjY2NyIgZmlsbD0iIzQ0RDYyQyIvPgo8cGF0aCBkPSJNMTcuNDQ1NyA2Ljc4MzJMMTIuOTk0NSA2Ljc4MzJMMTIuMjEzNiA5LjE0NDQ2SDE0LjY4NTlMMTQuNjg1OSAxNC4xMTgySDE3LjQ0NTdWNi43ODMyWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMS4wNzY0IDIwLjEzNzhDMjEuMDc2NCAyMi45NDEzIDE4LjgwMzcgMjUuMjE0MSAxNi4wMDAxIDI1LjIxNDFDMTMuMTk2NiAyNS4yMTQxIDEwLjkyMzggMjIuOTQxMyAxMC45MjM4IDIwLjEzNzhDMTAuOTIzOCAxNy4zMzQyIDEzLjE5NjYgMTUuMDYxNSAxNi4wMDAxIDE1LjA2MTVDMTguODAzNyAxNS4wNjE1IDIxLjA3NjQgMTcuMzM0MiAyMS4wNzY0IDIwLjEzNzhaTTE4Ljc3MTggMjAuMTM3OEMxOC43NzE4IDIxLjY2ODUgMTcuNTMwOSAyMi45MDk1IDE2LjAwMDEgMjIuOTA5NUMxNC40NjkzIDIyLjkwOTUgMTMuMjI4NCAyMS42Njg1IDEzLjIyODQgMjAuMTM3OEMxMy4yMjg0IDE4LjYwNyAxNC40NjkzIDE3LjM2NiAxNi4wMDAxIDE3LjM2NkMxNy41MzA5IDE3LjM2NiAxOC43NzE4IDE4LjYwNyAxOC43NzE4IDIwLjEzNzhaIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      if ('$onekey' in window) {
        const anyWindow: any = window
        return anyWindow.$onekey.btc
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
      this: OneKeyBitcoinProvider,
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
          chainChanged = (network: OneKeyBitcoinNetwork) =>
            this.onChainChanged(OneKeyBitcoinNetworkChainIdMap[network])
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
      return OneKeyBitcoinNetworkChainIdMap[network]
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
        const network = ChainIdToOneKeyMap[chainId]
        if (!network) {
          throw new ChainNotSupportedError(chainId, onekey.name)
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
