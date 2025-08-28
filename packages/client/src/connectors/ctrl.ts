import {
  type Account,
  type Address,
  type AddressPurpose,
  type AddressType,
  BaseError,
  base64ToHex,
  getAddressChainId,
  hexToBase64,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  type SignPsbtParameters,
  UserRejectedRequestError,
} from '@bigmi/core'
import { ConnectorChainIdDetectionError } from '../errors/connectors.js'

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
  signPsbt({
    psbt,
  }: {
    psbt: string
    broadcast: boolean
  }): Promise<CtrlResponse<CtrlSignPsbtResult>>
  requestAccounts(): Promise<Address[]>
  getAccounts(): Promise<Address[]>
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
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc1IiBoZWlnaHQ9IjE3NSIgdmlld0JveD0iMCAwIDE3NSAxNzUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNzUiIGhlaWdodD0iMTc1IiByeD0iODcuNSIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTY3LjMzMyAxMTYuMzI1VjE0Mi4zMzdDNjcuMzMzIDE0Ni41NzYgNzAuNzY3MSAxNTAuMDAxIDc0Ljk5NTMgMTUwLjAwMUgxMDEuMDA0QzEwNS4yNDIgMTUwLjAwMSAxMDguNjY2IDE0Ni41NjYgMTA4LjY2NiAxNDIuMzM3VjEyOS4zMzFDMTA4LjY2NiAxMjMuNjE3IDExMC45NzYgMTE4LjQ1IDExNC43MiAxMTQuNzE2QzExOC40NjMgMTEwLjk3MiAxMjMuNjMgMTA4LjY2MiAxMjkuMzMzIDEwOC42NjJIMTQyLjMzN0MxNDYuNTc2IDEwOC42NjIgMTUwIDEwNS4yMjggMTUwIDEwMC45OTlWNzQuOTk3M0MxNTAgNzAuNzU4MiAxNDYuNTY2IDY3LjMzNCAxNDIuMzM3IDY3LjMzNEgxMTYuMzM5QzExMi4xIDY3LjMzNCAxMDguNjc3IDcwLjc2ODUgMTA4LjY3NyA3NC45OTczVjg4LjYzMjRDMTA4LjY3NyA5OS42OTkzIDk5LjcwNDYgMTA4LjY2MiA4OC42NDk0IDEwOC42NjJINzUuMDE2QzcwLjc3NzQgMTA4LjY2MiA2Ny4zNTM2IDExMi4wOTcgNjcuMzUzNiAxMTYuMzI1SDY3LjMzM1oiIGZpbGw9IiMwMDE0MDUiLz4KPHBhdGggZD0iTTI2IDc0Ljk5NTdWMTAxLjAwNEMyNiAxMDUuMjQzIDI5LjQzNDEgMTA4LjY2NyAzMy42NjIzIDEwOC42NjdINTkuNjcxQzYzLjkwOTUgMTA4LjY2NyA2Ny4zMzMzIDEwNS4yMzMgNjcuMzMzMyAxMDEuMDA0Vjg4QzY3LjMzMzMgODIuMjg2OCA2OS42NDM0IDc3LjEyMDEgNzMuMzg2OSA3My4zODY5Qzc3LjEzMDQgNjkuNjQzNCA4Mi4yOTcxIDY3LjMzMzMgODggNjcuMzMzM0gxMDEuMDA0QzEwNS4yNDMgNjcuMzMzMyAxMDguNjY3IDYzLjg5OTIgMTA4LjY2NyA1OS42NzFWMzMuNjYyM0MxMDguNjY3IDI5LjQyMzggMTA1LjIzMyAyNiAxMDEuMDA0IDI2SDc1LjAwNkM3MC43Njc1IDI2IDY3LjM0MzYgMjkuNDM0MSA2Ny4zNDM2IDMzLjY2MjNWNDcuMjk1N0M2Ny4zNDM2IDU4LjM2MTMgNTguMzcxNiA2Ny4zMjMgNDcuMzE2NCA2Ny4zMjNIMzMuNjYyM0MyOS40MjM4IDY3LjMyMyAyNiA3MC43NTcyIDI2IDc0Ljk4NTRWNzQuOTk1N1oiIGZpbGw9IiMwMDE0MDUiLz4KPC9zdmc+Cg==',
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

          const psbt64 = hexToBase64(psbt)
          const response = await this.signPsbt({
            psbt: psbt64,
            broadcast: Boolean(options.finalize),
          })

          if (response.status === 'success') {
            const signedHex = base64ToHex(response.result.psbt)
            return signedHex
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
        const chainId = getAddressChainId(accounts[0].address)

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
      if (chainId) {
        return chainId
      }

      const accounts = await this.getAccounts()
      if (accounts.length === 0) {
        throw new ConnectorChainIdDetectionError({ connector: this.name })
      }
      return getAddressChainId(accounts[0].address)
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
