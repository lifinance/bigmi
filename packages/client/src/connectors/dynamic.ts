import type { SignPsbtParameters, UTXOWalletProvider } from '@bigmi/core'

import {
  type Address,
  MethodNotSupportedRpcError,
  UserRejectedRequestError,
} from 'viem'
import { type Connection, ProviderNotFoundError, createConnector } from 'wagmi'
import type { UTXOConnectorParameters } from './types.js'

export type DynamicWalletConnectorEventMap = {
  accountChange(props: { accounts: string[] }): void
}

export type DynamicWalletConnectorEvents = {
  addListener<TEvent extends keyof DynamicWalletConnectorEventMap>(
    event: TEvent,
    listener: DynamicWalletConnectorEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof DynamicWalletConnectorEventMap>(
    event: TEvent,
    listener: DynamicWalletConnectorEventMap[TEvent]
  ): void
}

export type DynamicWalletConnector = {
  providerId: string
  name: string
  id: string
  signPsbt(parameters: {
    unsignedPsbtBase64: string
    allowedSighash: number[]
  }): Promise<any>
  getAddress(): string
  _metadata: {
    icon?: string
  }
} & DynamicWalletConnectorEvents

type DynamicBitcoinWallet = {
  connector: DynamicWalletConnector
  address: string
  isAuthenticated: boolean
}

type DynamicConnectorProperties = {
  getAccounts(): Promise<readonly Address[]>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<DynamicWalletConnector>
} & UTXOWalletProvider

type DynamicConnectorParameters = {
  wallet: DynamicBitcoinWallet
} & UTXOConnectorParameters

dynamic.type = 'UTXO' as const

export function dynamic(parameters: DynamicConnectorParameters) {
  const { chainId, shimDisconnect = true, wallet } = parameters
  let accountChanged: ((accounts: string[]) => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    DynamicConnectorProperties
  >((config) => ({
    id: wallet.connector.providerId,
    name: wallet.connector.name,
    type: dynamic.type,
    icon: wallet.connector._metadata?.icon,
    emitter: config.emitter,

    async isAuthorized() {
      return wallet.isAuthenticated
    },
    async request(
      this: DynamicBitcoinWallet,
      { method, params }
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters
          const allowedSighash: number[] = options.inputsToSign.map((input) =>
            Number(input.sigHash)
          )
          const signedPsbt = await wallet.connector.signPsbt({
            unsignedPsbtBase64: psbt,
            allowedSighash,
          })
          return signedPsbt
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
    async setup() {
      //
    },
    async getProvider() {
      const internalProvider = await this.getInternalProvider()
      if (!internalProvider) {
        throw new ProviderNotFoundError()
      }
      const provider = {
        request: this.request.bind(internalProvider),
      }
      return provider
    },
    async connect() {
      if (!wallet.connector) {
        throw new Error('DynamicWalletConnector not defined')
      }
      try {
        const accounts = await this.getAccounts()
        const chainId = await this.getChainId()

        if (!accountChanged) {
          accountChanged = this.onAccountsChanged.bind(this)
          wallet.connector.addListener('accountChange', ({ accounts }) =>
            accountChanged?.(accounts)
          )
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
      const provider = wallet.connector
      if (accountChanged) {
        provider.removeListener('accountChange', ({ accounts }) =>
          accountChanged?.(accounts)
        )
        accountChanged = undefined
      }

      if (shimDisconnect) {
        await Promise.all([
          config.storage?.setItem(`${this.id}.disconnected`, true),
          config.storage?.removeItem(`${this.id}.connected`),
        ])
      }
    },
    async getAccounts() {
      return [wallet.address] as Address[]
    },
    async getChainId() {
      return chainId!
    },
    async getInternalProvider() {
      return wallet.connector
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
