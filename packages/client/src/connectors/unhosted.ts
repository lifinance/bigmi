import type { Account, SignPsbtParameters } from '@bigmi/core'
import {
  base64ToHex,
  ChainId,
  hexToBase64,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  UserRejectedRequestError,
} from '@bigmi/core'
import { createConnector } from '../factories/createConnector.js'
import { debounce } from '../utils/debounce.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type UnhostedBitcoinNetwork =
  | 'Mainnet'
  | 'Testnet'
  | 'Testnet4'
  | 'Signet'

export type UnhostedBitcoinEvents = {
  on(
    event: 'bitcoin:accountsChanged',
    listener: (accounts: string[]) => void
  ): void
  on(
    event: 'bitcoin:networkChanged',
    listener: (network: Network) => void
  ): void
  on(event: 'bitcoin:disconnect', listener: () => void): void
  off?(
    event: 'bitcoin:accountsChanged',
    listener: (accounts: string[]) => void
  ): void
  off?(
    event: 'bitcoin:networkChanged',
    listener: (network: Network) => void
  ): void
  off?(event: 'bitcoin:disconnect', listener: () => void): void
}

type UnhostedConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  getInternalProvider(): Promise<UnhostedBitcoinProvider>
} & UTXOWalletProvider

interface WalletAddress {
  address: string
  publicKey?: string
  purpose?: string
}

interface Network {
  name: 'Mainnet' | 'Testnet'
}

interface SignPsbtParams {
  signInputs?: Record<string, number[]> // Map of address to input indices
  broadcast?: boolean // Broadcast after signing
}

interface SignPsbtResponse {
  psbt: string // Signed PSBT in base64
  txid?: string // Present if broadcast=true
}

type Response<T> = Promise<{
  result: T
}>

type UnhostedBitcoinProvider = UnhostedBitcoinEvents & {
  wallet_connect(): Promise<{ addresses: WalletAddress[] }>
  wallet_getNetwork(): Response<{ bitcoin: Network }>
  getAccounts(): Response<WalletAddress[]>
  signPsbt(
    psbtBase64: string,
    params?: SignPsbtParams
  ): Response<SignPsbtResponse>

  isUnhosted?: boolean
}

unhosted.type = 'UTXO' as const
export function unhosted(parameters: UTXOConnectorParameters = {}) {
  const UnhostedBitcoinChainIdMap: Record<UnhostedBitcoinNetwork, ChainId> = {
    Mainnet: ChainId.BITCOIN_MAINNET,
    Testnet: ChainId.BITCOIN_TESTNET,
    Testnet4: ChainId.BITCOIN_TESTNET4,
    Signet: ChainId.BITCOIN_SIGNET,
  }
  const { shimDisconnect = true } = parameters
  let handleAccountsChanged: ReturnType<typeof debounce> | undefined
  let handleChainChanged: ((network: Network) => void) | undefined
  let handleDisconnect: (() => void) | undefined

  return createConnector<
    UTXOWalletProvider | undefined,
    UnhostedConnectorProperties
  >((config) => ({
    id: 'unhosted',
    name: 'Unhosted Wallet',
    type: unhosted.type,
    icon: 'data:image/png;base64,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',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return undefined
      }
      const anyWindow: any = window

      if ('unhosted' in window && anyWindow.unhosted?.bitcoin) {
        const provider = anyWindow.unhosted.bitcoin
        if (provider.isUnhosted) {
          return provider
        }
      }

      // Fallback to window.btc
      if ('btc' in window && anyWindow.btc) {
        const provider = anyWindow.btc
        if (provider.isUnhosted) {
          return provider
        }
      }

      // Fallback to window.BitcoinProvider
      if ('BitcoinProvider' in window && anyWindow.BitcoinProvider) {
        const provider = anyWindow.BitcoinProvider
        if (provider.isUnhosted) {
          return provider
        }
      }

      return undefined
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
      this: UnhostedBitcoinProvider | any,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      const provider = this as UnhostedBitcoinProvider
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters
          const psbtBase64 = hexToBase64(psbt)

          const { result } = await provider.signPsbt(psbtBase64, {
            broadcast: options.finalize,
          })

          if (result.psbt) {
            return base64ToHex(result.psbt)
          }
          throw new UserRejectedRequestError('Failed to sign PSBT')
        }
        default:
          throw new MethodNotSupportedRpcError(method)
      }
    },
    async connect({ isReconnecting } = {}) {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      if (!isReconnecting) {
        await provider.wallet_connect()
      }

      const accounts = await this.getAccounts()

      const chainId = await this.getChainId()

      if (!handleAccountsChanged) {
        handleAccountsChanged = debounce(this.onAccountsChanged.bind(this), 100)
        provider.on('bitcoin:accountsChanged', handleAccountsChanged)
      }

      if (!handleChainChanged) {
        handleChainChanged = (network: Network) => {
          this.onChainChanged(UnhostedBitcoinChainIdMap[network.name])
        }
        provider.on('bitcoin:networkChanged', handleChainChanged)
      }

      if (!handleDisconnect) {
        handleDisconnect = this.onDisconnect.bind(this)
        provider.on('bitcoin:disconnect', handleDisconnect)
      }

      if (shimDisconnect) {
        // Remove disconnected shim if it exists
        await Promise.all([
          config.storage?.setItem(`${this.id}.connected`, true),
          config.storage?.removeItem(`${this.id}.disconnected`),
        ])
      }

      return { accounts, chainId }
    },
    async disconnect() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      if (handleAccountsChanged) {
        provider.off?.('bitcoin:accountsChanged', handleAccountsChanged)
        handleAccountsChanged = undefined
      }

      if (handleChainChanged) {
        provider.off?.('bitcoin:networkChanged', handleChainChanged)
        handleChainChanged = undefined
      }

      if (handleDisconnect) {
        provider.off?.('bitcoin:disconnect', handleDisconnect)
        handleDisconnect = undefined
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

      const { result } = await provider.getAccounts()

      if (!result) {
        return []
      }

      return result as Account[]
    },
    async getChainId() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      const { result } = await provider.wallet_getNetwork()

      // Map network type to chain ID
      const bitcoinName = result.bitcoin.name
      return UnhostedBitcoinChainIdMap[bitcoinName]
    },
    async isAuthorized() {
      try {
        const isConnected =
          shimDisconnect &&
          // If shim exists in storage, connector is disconnected
          Boolean(await config.storage?.getItem(`${this.id}.connected`))
        return isConnected
      } catch {
        return false
      }
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        const accounts = await this.getAccounts()
        config.emitter.emit('change', {
          accounts,
        })
      }
    },
    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error) {
      config.emitter.emit('disconnect')
    },
  }))
}
