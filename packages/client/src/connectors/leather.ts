import type { Address, BtcAccount, SignPsbtParameters } from '@bigmi/core'
import {
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  UserRejectedRequestError,
} from '@bigmi/core'

import { createConnector } from '../factories/createConnector.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type LeatherBitcoinEventMap = {
  accountChange(accounts: BtcAccount[]): void
}

export type LeatherBitcoinEvents = {
  addListener<TEvent extends keyof LeatherBitcoinEventMap>(
    event: TEvent,
    listener: LeatherBitcoinEventMap[TEvent]
  ): void
  removeListener?<TEvent extends keyof LeatherBitcoinEventMap>(
    event: TEvent,
    listener: LeatherBitcoinEventMap[TEvent]
  ): void
}

type LeatherConnectorProperties = {
  getAccounts(): Promise<readonly (BtcAccount | Address)[]>
  getInternalProvider(): Promise<LeatherBitcoinProvider>
} & UTXOWalletProvider

type Error = { code: number; message: string }

interface GetAccountsResponse {
  result?: { addresses: BtcAccount[] }
  error?: Error
}

type LeatherBitcoinProvider = {
  request(
    method: 'signPsbt',
    options: {
      psbt: string
      allowedSignHash: number
      signInputs: Record<string, number[]>
      broadcast: boolean
    }
  ): Promise<string>
  request(method: 'getAddresses'): Promise<GetAccountsResponse>
} & LeatherBitcoinEvents

leather.type = 'UTXO' as const
export function leather(parameters: UTXOConnectorParameters = {}) {
  const { chainId, shimDisconnect = true } = parameters
  return createConnector<
    UTXOWalletProvider | undefined,
    LeatherConnectorProperties
  >((config) => ({
    id: 'LeatherProvider',
    name: 'Leather',
    type: leather.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSJub25lIj4KICAgIDxwYXRoIGZpbGw9IiMxMjEwMEYiIGQ9Ik0wIDBoMTI4djEyOEgweiIvPgogICAgPHBhdGggZmlsbD0iI0Y1RjFFRCIgZD0iTTc0LjkxNyA1Mi43MTFjNy41Ni0xLjE3IDE4LjQ5Mi05LjEzIDE4LjQ5Mi0xNS4zMzUgMC0xLjg3My0xLjUxMi0zLjE2LTMuNzIyLTMuMTYtNC4xODcgMC0xMS4yOCA2LjMyLTE0Ljc3IDE4LjQ5NU0zOS45MTEgODMuNWMtOS44ODUgMC0xMC43IDkuODMzLS44MTQgOS44MzMgNC40MiAwIDkuNzctMS43NTYgMTIuNTYtNC45MTYtNC4wNy0zLjUxMi03LjQ0My00LjkxNy0xMS43NDYtNC45MTdtNjIuOTE4LTQuMjE0Yy41ODEgMTYuNTA2LTcuNzkyIDI1Ljc1NC0yMS45OCAyNS43NTQtOC4zNzQgMC0xMi41Ni0zLjE2MS0yMS41MTYtOS4wMTQtNC42NTIgNS4xNTEtMTMuNDkgOS4wMTQtMjAuODE4IDkuMDE0LTI1LjIzNiAwLTI0LjE5LTMyLjE5MyAxLjUxMi0zMi4xOTMgNS4zNSAwIDkuODg2IDEuNDA1IDE1LjcgNS4wMzRsMy44MzktMTMuNDYyQzQzLjc0OSA2MC4wODYgMzUuODQgNDcuOTEyIDQzLjYzMyAzMC40NjloMTIuNTZjLTYuOTc4IDExLjU5LTIuMjEgMjEuMTg5IDYuNjI5IDIyLjI0MkM2Ny41OSAzNS43MzcgNzcuODI1IDIyLjUxIDkxLjQzMiAyMi41MWM3LjY3NSAwIDEzLjcyMyA1LjAzNCAxMy43MjMgMTQuMTY1IDAgMTQuNjMzLTE5LjA3MyAyNi41NzMtMzMuNDk0IDI3Ljc0NEw2NS43MyA4NS4zNzJjNi43NDUgNy44NDMgMjUuNDY5IDE1LjQ1MiAyNS40NjktNi4wODd6Ii8+Cjwvc3ZnPg==',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return undefined
      }
      if ('LeatherProvider' in window) {
        const anyWindow: any = window
        const provider = anyWindow.LeatherProvider
        return provider
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
      this: LeatherBitcoinProvider | any,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters
          const signedPsbt = await this.request('signPsbt', {
            psbt: psbt,
            broadcast: options.finalize,
          })
          if (signedPsbt?.error) {
            throw signedPsbt?.error
          }
          return signedPsbt
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

      const accounts = await this.getAccounts()
      const chainId = await this.getChainId()

      // Remove disconnected shim if it exists
      if (shimDisconnect) {
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
      const accounts = await provider.request('getAddresses')
      if (!accounts.result) {
        throw new UserRejectedRequestError(accounts.error?.message!)
      }
      return accounts.result.addresses.map(
        (account) => account.address as Address
      )
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
    async onAccountsChanged() {
      const { accounts } = await this.connect()
      config.emitter.emit('change', {
        accounts,
      })
    },
    onChainChanged(chain) {
      const chainId = Number(chain)
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error) {
      config.emitter.emit('disconnect')
    },
  }))
}
