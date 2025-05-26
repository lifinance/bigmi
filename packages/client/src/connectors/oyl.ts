import {
  type Address,
  type BtcAccount,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  type SignPsbtParameters,
  UserRejectedRequestError,
} from '@bigmi/core'
import { createConnector } from '../factories/createConnector.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type OylConnectorProperties = {
  getAccounts(): Promise<readonly (BtcAccount | Address)[]>
  onAccountsChanged(accounts: (BtcAccount | Address)[]): void
  getInternalProvider(): Promise<OylBitcoinProvider>
} & UTXOWalletProvider

type OylAddress = { address: string; publicKey: string }

type OylBitcoinProvider = {
  isConnected(): Promise<boolean>
  disconnect(): void
  getAddresses(): Promise<{
    taproot: OylAddress
    nativeSegWit: OylAddress
    nestedSegwit: OylAddress
    legacy: OylAddress
  }>
  getBalance(): Promise<{
    unconfirmed: number
    confirmed: number
    total: number
  }>
  signPsbt(params: {
    psbt: string // psbt string in hex format
    finalize?: boolean // defaults to true
    broadcast?: boolean // defaults to false
  }): Promise<{
    psbt: string // signed psbt in hex format
    txid?: string
  }>
}

oyl.type = 'UTXO' as const
export function oyl(parameters: UTXOConnectorParameters = {}) {
  const { chainId } = parameters
  let accountsChanged: ((accounts: BtcAccount[]) => void) | undefined

  return createConnector<
    UTXOWalletProvider | undefined,
    OylConnectorProperties
  >((config) => ({
    id: 'OylProvider',
    name: 'Oyl',
    type: oyl.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjQzMyIgdmlld0JveD0iMCAwIDEwMDAgNDMzIiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTUwMCAwQzU4Ni4wNTkgMCA2NjcuMDU2IDcuNTkzNDUgNzQyLjk5MSAyMi43ODA0QzgxOC45MjUgMzcuNTc3OSA4ODAuNjQ2IDYwLjk0MjQgOTI4LjE1NCA5Mi44NzM4Qzk3Ni4wNTEgMTI0LjgwNSAxMDAwIDE2NC45MTQgMTAwMCAyMTMuMjAxQzEwMDAgMjYxLjQ4OCA5NzYuMDUxIDMwMi4xODEgOTI4LjE1NCAzMzUuMjhDODgwLjI1NyAzNjcuOTkxIDgxOC4xNDYgMzkyLjMyOSA3NDEuODIyIDQwOC4yOTRDNjY1Ljg4OCA0MjQuMjYgNTg1LjI4IDQzMi4yNDMgNTAwIDQzMi4yNDNDNDEzLjk0MSA0MzIuMjQzIDMzMi45NDQgNDI0Ljg0NCAyNTcuMDA5IDQxMC4wNDdDMTgxLjA3NSAzOTQuODYgMTE5LjE1OSAzNzEuMzAxIDcxLjI2MTcgMzM5LjM2OUMyMy43NTM5IDMwNy40MzggMCAyNjcuMzI5IDAgMjE5LjA0MkMwIDE3MC43NTUgMjMuOTQ4NiAxMzAuMjU3IDcxLjg0NTggOTcuNTQ2N0MxMTkuNzQzIDY0LjQ0NzEgMTgxLjY1OSAzOS45MTQzIDI1Ny41OTMgMjMuOTQ4NkMzMzMuOTE3IDcuOTgyODcgNDE0LjcyIDAgNTAwIDBaTTUwMS4xNjggMzQ5LjI5OUM1NDIuMDU2IDM0OS4yOTkgNTgyLjk0NCAzNDUuMDE2IDYyMy44MzIgMzM2LjQ0OUM2NjUuMTA5IDMyNy44ODIgNjk5Ljc2NiAzMTMuNjY4IDcyNy44MDQgMjkzLjgwOEM3NTUuODQxIDI3My45NDkgNzY5Ljg2IDI0OC4wNTMgNzY5Ljg2IDIxNi4xMjJDNzY5Ljg2IDE4NC4xOSA3NTUuODQxIDE1OC4yOTQgNzI3LjgwNCAxMzguNDM1QzY5OS43NjYgMTE4LjU3NSA2NjUuMTA5IDEwNC4zNjEgNjIzLjgzMiA5NS43OTQ0QzU4Mi45NDQgODcuMjI3NCA1NDIuMDU2IDgyLjk0MzkgNTAxLjE2OCA4Mi45NDM5SDQ5OC44MzJDNDU3Ljk0NCA4Mi45NDM5IDQxNi44NjEgODcuMjI3NCAzNzUuNTg0IDk1Ljc5NDRDMzM0LjY5NiAxMDQuMzYxIDMwMC4yMzQgMTE4LjU3NSAyNzIuMTk2IDEzOC40MzVDMjQ0LjE1OSAxNTguMjk0IDIzMC4xNCAxODQuMTkgMjMwLjE0IDIxNi4xMjJDMjMwLjE0IDI0OC4wNTMgMjQ0LjE1OSAyNzMuOTQ5IDI3Mi4xOTYgMjkzLjgwOEMzMDAuMjM0IDMxMy42NjggMzM0LjY5NiAzMjcuODgyIDM3NS41ODQgMzM2LjQ0OUM0MTYuODYxIDM0NS4wMTYgNDU3Ljk0NCAzNDkuMjk5IDQ5OC44MzIgMzQ5LjI5OUg1MDEuMTY4WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+',

    async setup() {},

    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return undefined
      }
      if ('oyl' in window) {
        const anyWindow: any = window
        const provider = anyWindow.oyl
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
      this: OylBitcoinProvider,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, finalize } = params as SignPsbtParameters
          const { psbt: signedPsbt } = await this.signPsbt({ psbt, finalize })
          return signedPsbt
        }
        default:
          throw new MethodNotSupportedRpcError(method)
      }
    },
    async connect() {
      try {
        const accounts = await this.getAccounts()
        const chainId = await this.getChainId()

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
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
      this.disconnect()
    },
    async getAccounts() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      const accounts = await provider.getAddresses()
      return [accounts.nativeSegWit.address as Address]
    },
    async getChainId() {
      return chainId!
    },
    async isAuthorized() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      const isConnected = await provider.isConnected()
      return isConnected
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        config.emitter.emit('change', {
          accounts: accounts
            .filter((account) => (account as BtcAccount).purpose === 'payment')
            .map((account) => (account as BtcAccount).address as Address),
        })
      }
    },
    async onChainChanged(chain) {
      const chainId = Number(chain)
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect() {
      config.emitter.emit('disconnect')
    },
  }))
}
