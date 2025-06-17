import {
  type Account,
  type Address,
  type AddressPurpose,
  type AddressType,
  BaseError,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  type SignPsbtParameters,
  UserRejectedRequestError,
  base64ToHex,
  hexToBase64,
} from '@bigmi/core'

import { createConnector } from '../factories/createConnector.js'
import type { UTXOConnectorParameters, UTXOWalletProvider } from './types.js'

interface GetAccountsRequest {
  purposes: AddressPurpose[]
}

type CtrlResponse<T> =
  | {
      status: 'success'
      result: T
      error?: never
    }
  | {
      status: 'error'
      error: string
      result?: never
    }

interface CtrlSignPsbtResult {
  psbt: string
  txid: string
}

interface CtrlAccount {
  address: string
  publicKey: string
  purpose: AddressPurpose
  addressType: string
  walletType: string
}

export type CtrlBitcoinEventMap = {
  accountsChanged(accounts: Address[]): void
}

export type CtrlBitcoinEvents = {
  addListener<TEvent extends keyof CtrlBitcoinEventMap>(
    event: TEvent,
    listener: CtrlBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof CtrlBitcoinEventMap>(
    event: TEvent,
    listener: CtrlBitcoinEventMap[TEvent]
  ): void
}

type CtrlConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<CtrlBitcoinProvider>
} & UTXOWalletProvider

type CtrlBitcoinProvider = {
  signPsbt(psbtHex: string, finalise?: boolean): Promise<string>
  requestAccounts(): Promise<Address[]>
  getAccounts(): Promise<Address[]>
  request({
    method,
    params,
  }: {
    method: 'sign_psbt'
    params: {
      psbt: string
      allowedSignHash: number
      signInputs: Record<string, number[]>
      broadcast: boolean
    }
  }): Promise<CtrlResponse<CtrlSignPsbtResult>>
  request({
    method,
    params,
  }: {
    method: 'request_accounts_and_keys'
    params: GetAccountsRequest
  }): Promise<CtrlResponse<CtrlAccount[]>>
} & CtrlBitcoinEvents

ctrl.type = 'UTXO' as const
export function ctrl(parameters: UTXOConnectorParameters = {}) {
  const { chainId, shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Address[]) => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    CtrlConnectorProperties
  >((config) => ({
    id: 'io.xdefi',
    name: 'Ctrl Wallet',
    type: ctrl.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI0IiBoZWlnaHQ9IjEyNCIgdmlld0JveD0iMCAwIDEyNCAxMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8yMjA5XzQyNjUzKSI+CjxwYXRoIGQ9Ik00MS4zMzMgOTAuMzI1NVYxMTYuMzM3QzQxLjMzMyAxMjAuNTc2IDQ0Ljc2NzEgMTI0LjAwMSA0OC45OTUzIDEyNC4wMDFINzUuMDA0Qzc5LjI0MjUgMTI0LjAwMSA4Mi42NjYzIDEyMC41NjYgODIuNjY2MyAxMTYuMzM3VjEwMy4zMzFDODIuNjY2MyA5Ny42MTc1IDg0Ljk3NjQgOTIuNDUwMSA4OC43MTk5IDg4LjcxNjVDOTIuNDYzNCA4NC45NzI1IDk3LjYzMDEgODIuNjYyMiAxMDMuMzMzIDgyLjY2MjJIMTE2LjMzN0MxMjAuNTc2IDgyLjY2MjIgMTI0IDc5LjIyNzYgMTI0IDc0Ljk5ODlWNDguOTk3M0MxMjQgNDQuNzU4MiAxMjAuNTY2IDQxLjMzNCAxMTYuMzM3IDQxLjMzNEg5MC4zMzlDODYuMTAwNSA0MS4zMzQgODIuNjc2NyA0NC43Njg1IDgyLjY3NjcgNDguOTk3M1Y2Mi42MzI0QzgyLjY3NjcgNzMuNjk5MyA3My43MDQ2IDgyLjY2MjIgNjIuNjQ5NCA4Mi42NjIySDQ5LjAxNkM0NC43Nzc0IDgyLjY2MjIgNDEuMzUzNiA4Ni4wOTY3IDQxLjM1MzYgOTAuMzI1NUg0MS4zMzNaIiBmaWxsPSIjMDAxNDA1Ii8+CjxwYXRoIGQ9Ik0wIDQ4Ljk5NTdWNzUuMDA0M0MwIDc5LjI0MjggMy40MzQxMyA4Mi42NjY3IDcuNjYyMzQgODIuNjY2N0gzMy42NzFDMzcuOTA5NSA4Mi42NjY3IDQxLjMzMzMgNzkuMjMyNSA0MS4zMzMzIDc1LjAwNDNWNjJDNDEuMzMzMyA1Ni4yODY4IDQzLjY0MzQgNTEuMTIwMSA0Ny4zODY5IDQ3LjM4NjlDNTEuMTMwNCA0My42NDM0IDU2LjI5NzEgNDEuMzMzMyA2MiA0MS4zMzMzSDc1LjAwNDNDNzkuMjQyOCA0MS4zMzMzIDgyLjY2NjcgMzcuODk5MiA4Mi42NjY3IDMzLjY3MVY3LjY2MjM0QzgyLjY2NjcgMy40MjM4MiA3OS4yMzI1IDAgNzUuMDA0MyAwSDQ5LjAwNkM0NC43Njc1IDAgNDEuMzQzNiAzLjQzNDEzIDQxLjM0MzYgNy42NjIzNFYyMS4yOTU3QzQxLjM0MzYgMzIuMzYxMyAzMi4zNzE2IDQxLjMyMyAyMS4zMTY0IDQxLjMyM0g3LjY2MjM0QzMuNDIzODIgNDEuMzIzIDAgNDQuNzU3MiAwIDQ4Ljk4NTRWNDguOTk1N1oiIGZpbGw9IiMwMDE0MDUiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8yMjA5XzQyNjUzIj4KPHJlY3Qgd2lkdGg9IjEyNCIgaGVpZ2h0PSIxMjQiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      if ('xfi' in window) {
        const anyWindow: any = window
        return anyWindow.xfi?.bitcoin
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
    async request(this: CtrlBitcoinProvider, { method, params }): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters

          const psbtBase64 = hexToBase64(psbt)
          const signInputs = options.inputsToSign.reduce(
            (signInputs, input) => {
              if (!signInputs[input.address]) {
                signInputs[input.address] = []
              }
              signInputs[input.address].push(...input.signingIndexes)
              return signInputs
            },
            {} as Record<string, number[]>
          )

          const response = await this.request({
            method: 'sign_psbt',
            params: {
              psbt: psbtBase64,
              signInputs,
              allowedSignHash: 1,
              broadcast: Boolean(options.finalize),
            },
          })

          if (response.status === 'success') {
            return base64ToHex(response.result.psbt)
          }

          throw new BaseError(response.error)
        }
        default:
          throw new MethodNotSupportedRpcError(method)
      }
    },
    async connect() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      try {
        const accounts = await this.getAccounts()
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
        console.error({
          error,
        })
        throw new UserRejectedRequestError(error.message)
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
      const { status, result } = await provider.request({
        method: 'request_accounts_and_keys',
        params: {
          purposes: ['payment'],
        },
      })
      if (status === 'success') {
        return result.map((account) => ({
          address: account.address,
          addressType: account.addressType.toLowerCase() as AddressType,
          publicKey: account.publicKey,
          purpose: account.purpose,
        }))
      }
      throw new BaseError('Error getting accounts')
    },
    async getChainId() {
      return chainId!
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
        const newAccounts = await this.getAccounts()
        config.emitter.emit('change', {
          accounts: newAccounts,
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
