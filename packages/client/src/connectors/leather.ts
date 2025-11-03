import type { Account, Address, SignPsbtParameters } from '@bigmi/core'
import {
  getAddressChainId,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  UserRejectedRequestError,
} from '@bigmi/core'
import { ConnectorChainIdDetectionError } from '../errors/connectors.js'
import { createConnector } from '../factories/createConnector.js'

import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type LeatherBitcoinEventMap = {
  accountChange(accounts: Account[]): void
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
  getAccounts(): Promise<readonly (Account | Address)[]>
  getInternalProvider(): Promise<LeatherBitcoinProvider>
} & UTXOWalletProvider

type Error = { code: number; message: string }

interface GetAccountsResponse {
  result?: { addresses: Account[] }
  error?: Error
}

type LeatherBitcoinProvider = {
  request(
    method: 'signPsbt',
    options: {
      hex: string
      allowedSignHash: number
      signAtIndex?: number | number[]
      broadcast: boolean
    }
  ): Promise<{ result: { hex: string } }>
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
            hex: psbt,
            broadcast: options.finalize,
          })
          if (signedPsbt?.error) {
            throw signedPsbt?.error
          }
          if (!signedPsbt?.result?.hex) {
            throw new Error('Missing hex result from signed PSBT')
          }
          return signedPsbt.result.hex
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

        // Remove disconnected shim if it exists
        if (shimDisconnect) {
          await Promise.all([
            config.storage?.setItem(`${this.id}.connected`, true),
            config.storage?.setItem(
              `${this.id}.lastConnected`,
              Date.now().toString()
            ),
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
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      // Add shim signalling connector is disconnected
      if (shimDisconnect) {
        await Promise.all([
          config.storage?.setItem(`${this.id}.disconnected`, true),
          config.storage?.removeItem(`${this.id}.connected`),
          config.storage?.removeItem(`${this.id}.accounts`),
          config.storage?.removeItem(`${this.id}.lastConnected`),
        ])
      }
    },
    async getAccounts() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      if (shimDisconnect && (await this.isAuthorized())) {
        const accounts = await config.storage?.getItem(`${this.id}.accounts`)
        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
          return accounts as Account[]
        }
      }
      const accounts = await provider.request('getAddresses')

      if (!accounts.result) {
        throw new UserRejectedRequestError(accounts.error?.message!)
      }

      if (shimDisconnect) {
        await config.storage?.setItem(
          `${this.id}.accounts`,
          accounts.result.addresses
        )
      }

      return accounts.result.addresses
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
        if (!shimDisconnect) {
          return false
        }
        const lastConnected: string | undefined | null =
          await config.storage?.getItem(`${this.id}.lastConnected`)
        if (!lastConnected) {
          return false
        }

        const timestamp = parseInt(lastConnected, 10)
        if (Number.isNaN(timestamp) || timestamp <= 0) {
          // Invalid timestamp, clean up storage
          await Promise.all([
            config.storage?.setItem(`${this.id}.disconnected`, true),
            config.storage?.removeItem(`${this.id}.connected`),
            config.storage?.removeItem(`${this.id}.accounts`),
            config.storage?.removeItem(`${this.id}.lastConnected`),
          ])
          return false
        }

        const oneDayAgo = 24 * 60 * 60 * 1000 // 24 hours
        const isExpired = Date.now() - timestamp > oneDayAgo
        if (isExpired) {
          await Promise.all([
            config.storage?.setItem(`${this.id}.disconnected`, true),
            config.storage?.removeItem(`${this.id}.connected`),
            config.storage?.removeItem(`${this.id}.accounts`),
            config.storage?.removeItem(`${this.id}.lastConnected`),
          ])
          return false
        }

        return !isExpired
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
    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error) {
      config.emitter.emit('disconnect')
    },
  }))
}
