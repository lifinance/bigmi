import type { SignPsbtParameters, UTXOWalletProvider } from '@bigmi/core'
import {
  type Address,
  MethodNotSupportedRpcError,
  UserRejectedRequestError,
  withRetry,
} from 'viem'
import { ProviderNotFoundError, createConnector } from 'wagmi'
import type { UTXOConnectorParameters } from './types.js'

export type OKXBitcoinEventMap = {
  accountsChanged(accounts: Address[]): void
}

export type OKXBitcoinEvents = {
  addListener<TEvent extends keyof OKXBitcoinEventMap>(
    event: TEvent,
    listener: OKXBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof OKXBitcoinEventMap>(
    event: TEvent,
    listener: OKXBitcoinEventMap[TEvent]
  ): void
}

type OKXConnectorProperties = {
  getAccounts(): Promise<readonly Address[]>
  getPublicKey(): Promise<string>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<OKXBitcoinProvider>
} & UTXOWalletProvider

type OKXBitcoinProvider = {
  requestAccounts(): Promise<Address[]>
  getAccounts(): Promise<Address[]>
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
  getPublicKey(): Promise<string>
} & OKXBitcoinEvents

okx.type = 'UTXO' as const
export function okx(parameters: UTXOConnectorParameters = {}) {
  const { chainId, shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Address[]) => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    OKXConnectorProperties
  >((config) => ({
    id: 'com.okex.wallet.bitcoin',
    name: 'OKX Wallet',
    type: okx.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBmaWxsPSIjMDAwIiBkPSJNMCAwaDMydjMySDB6Ii8+CiAgICA8cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTIuNiA3SDcuNGEuNC40IDAgMCAwLS40LjR2NS4yYzAgLjIyLjE3OS40LjQuNGg1LjJhLjQuNCAwIDAgMCAuNC0uNFY3LjRhLjQuNCAwIDAgMC0uNC0uNE0xOC42MDIgMTMuMDAyaC01LjJhLjQuNCAwIDAgMC0uNC40djUuMmMwIC4yMi4xNzkuNC40LjRoNS4yYS40LjQgMCAwIDAgLjQtLjR2LTUuMmEuNC40IDAgMCAwLS40LS40TTE5LjQgN2g1LjJhLjQuNCAwIDAgMSAuNC40djUuMmEuNC40IDAgMCAxLS40LjRoLTUuMmEuNC40IDAgMCAxLS40LS40VjcuNGEuNC40IDAgMCAxIC40LS40TTEyLjYgMTlINy40YS40LjQgMCAwIDAtLjQuNHY1LjJjMCAuMjIuMTc5LjQuNC40aDUuMmEuNC40IDAgMCAwIC40LS40di01LjJhLjQuNCAwIDAgMC0uNC0uNE0xOS40IDE5aDUuMmEuNC40IDAgMCAxIC40LjR2NS4yYS40LjQgMCAwIDEtLjQuNGgtNS4yYS40LjQgMCAwIDEtLjQtLjR2LTUuMmEuNC40IDAgMCAxIC40LS40Ii8+Cjwvc3ZnPgo=',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      if ('okxwallet' in window) {
        const anyWindow: any = window
        const internalProvider = anyWindow.okxwallet?.bitcoin

        if (internalProvider?.isOkxWallet) {
          return internalProvider
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
    async request(this: OKXBitcoinProvider, { method, params }): Promise<any> {
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
        case 'addressInfo': {
          const account = await this.getPublicKey()
          return {
            address: account,
            purpose: 'payment',
          }
        }
        default:
          throw new MethodNotSupportedRpcError(
            new Error(MethodNotSupportedRpcError.name),
            {
              method,
            }
          )
      }
    },
    async getPublicKey() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      return provider.getPublicKey()
    },

    async connect() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      try {
        const accounts = await provider.requestAccounts()
        const chainId = await this.getChainId()

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
          provider.addListener('accountsChanged', accountsChanged)
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
        throw new UserRejectedRequestError({
          name: UserRejectedRequestError.name,
          message: error.message,
        })
      }
    },
    async disconnect() {
      const provider = await this.getInternalProvider()

      if (accountsChanged) {
        provider?.removeListener('accountsChanged', accountsChanged)
        accountsChanged = undefined
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
      return accounts as Address[]
    },
    async getChainId() {
      return chainId!
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
        const accounts = await withRetry(() => this.getAccounts())
        return !!accounts.length
      } catch {
        return false
      }
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        config.emitter.emit('change', {
          accounts: accounts as Address[],
        })
      }
    },
    onChainChanged(chain) {
      const chainId = Number(chain)
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
