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

const { forward: OneKeyBitcoinNetworkChainIdMap, reverse: ChainIdToOneKeyMap } =
  createBidirectionalMap<OneKeyBitcoinNetwork, ChainId>([
    ['livenet', ChainId.BITCOIN_MAINNET],
    ['testnet', ChainId.BITCOIN_TESTNET],
  ] as const)

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
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTMiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi4wMDAxIDIyLjkxMDhDMTcuNTMwOSAyMi45MTA4IDE4Ljc3MTggMjEuNjY5OSAxOC43NzE4IDIwLjEzOTFDMTguNzcxOCAxOC42MDg0IDE3LjUzMDkgMTcuMzY3NCAxNi4wMDAxIDE3LjM2NzRDMTQuNDY5MyAxNy4zNjc0IDEzLjIyODQgMTguNjA4NCAxMy4yMjg0IDIwLjEzOTFDMTMuMjI4NCAyMS42Njk5IDE0LjQ2OTMgMjIuOTEwOCAxNi4wMDAxIDIyLjkxMDhaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2IDMyQzI3LjA0NTcgMzIgMzIgMjcuMDQ1NyAzMiAxNkMzMiA0Ljk1NDMgMjcuMDQ1NyAwIDE2IDBDNC45NTQzIDAgMCA0Ljk1NDMgMCAxNkMwIDI3LjA0NTcgNC45NTQzIDMyIDE2IDMyWk0xMi45OTQ1IDYuNzg0NTdIMTcuNDQ1NlYxNC4xMTk2SDE0LjY4NTlWOS4xNDU4M0gxMi4yMTM2TDEyLjk5NDUgNi43ODQ1N1pNMTYuMDAwMSAyNS4yMTU0QzE4LjgwMzcgMjUuMjE1NCAyMS4wNzY0IDIyLjk0MjcgMjEuMDc2NCAyMC4xMzkxQzIxLjA3NjQgMTcuMzM1NiAxOC44MDM3IDE1LjA2MjggMTYuMDAwMSAxNS4wNjI4QzEzLjE5NjUgMTUuMDYyOCAxMC45MjM4IDE3LjMzNTYgMTAuOTIzOCAyMC4xMzkxQzEwLjkyMzggMjIuOTQyNyAxMy4xOTY1IDI1LjIxNTQgMTYuMDAwMSAyNS4yMTU0WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg==',
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
