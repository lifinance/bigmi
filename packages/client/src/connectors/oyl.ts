import {
  type Account,
  AddressType,
  getAddressChainId,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  type SignPsbtParameters,
  UserRejectedRequestError,
} from '@bigmi/core'
import { ConnectorChainIdDetectionError } from '../errors/connectors.js'
import { createConnector } from '../factories/createConnector.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type OylConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Account[]): void
  getInternalProvider(): Promise<OylBitcoinProvider>
} & UTXOWalletProvider

type OylAddress = { address: string; publicKey: string }

type OylBitcoinProvider = {
  isConnected(): Promise<boolean>
  disconnect(): void
  getAddresses(): Promise<{
    taproot: OylAddress
    nativeSegwit: OylAddress
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
  const { chainId, shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Account[]) => void) | undefined

  return createConnector<
    UTXOWalletProvider | undefined,
    OylConnectorProperties
  >((config) => ({
    id: 'OylProvider',
    name: 'Oyl',
    type: oyl.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiB2aWV3Qm94PSIwIDAgMzIwIDMyMCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSJibGFjayIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfNV8yKSI+CjxwYXRoIGQ9Ik0xNjAgMjA0QzE3Ny41NTYgMjA0IDE5NC4wNzkgMjAyLjQzOSAyMDkuNTcgMTk5LjMxOEMyMjUuMDYxIDE5Ni4yNzYgMjM3LjY1MiAxOTEuNDc0IDI0Ny4zNDMgMTg0LjkxQzI1Ny4xMTQgMTc4LjM0NyAyNjIgMTcwLjEwMyAyNjIgMTYwLjE3OEMyNjIgMTUwLjI1MyAyNTcuMTE0IDE0MS44ODkgMjQ3LjM0MyAxMzUuMDg2QzIzNy41NzIgMTI4LjM2MiAyMjQuOTAyIDEyMy4zNiAyMDkuMzMyIDEyMC4wNzhDMTkzLjg0MSAxMTYuNzk2IDE3Ny4zOTcgMTE1LjE1NiAxNjAgMTE1LjE1NkMxNDIuNDQ0IDExNS4xNTYgMTI1LjkyMSAxMTYuNjc2IDExMC40MyAxMTkuNzE4Qzk0LjkzOTMgMTIyLjgzOSA4Mi4zMDg0IDEyNy42ODIgNzIuNTM3NCAxMzQuMjQ1QzYyLjg0NTggMTQwLjgwOCA1OCAxNDkuMDUyIDU4IDE1OC45NzhDNTggMTY4LjkwMyA2Mi44ODU1IDE3Ny4yMjcgNzIuNjU2NSAxODMuOTVDODIuNDI3NiAxOTAuNzUzIDk1LjA1ODQgMTk1Ljc5NiAxMTAuNTQ5IDE5OS4wNzhDMTI2LjExOSAyMDIuMzU5IDE0Mi42MDMgMjA0IDE2MCAyMDRaTTE2MC4yMzggMTMyLjIwNEMxNjguNTc5IDEzMi4yMDQgMTc2LjkyMSAxMzMuMDg0IDE4NS4yNjIgMTM0Ljg0NUMxOTMuNjgyIDEzNi42MDYgMjAwLjc1MiAxMzkuNTI4IDIwNi40NzIgMTQzLjYxQzIxMi4xOTIgMTQ3LjY5MiAyMTUuMDUxIDE1My4wMTUgMjE1LjA1MSAxNTkuNTc4QzIxNS4wNTEgMTY2LjE0MSAyMTIuMTkyIDE3MS40NjQgMjA2LjQ3MiAxNzUuNTQ2QzIwMC43NTIgMTc5LjYyOCAxOTMuNjgyIDE4Mi41NDkgMTg1LjI2MiAxODQuMzFDMTc2LjkyMSAxODYuMDcxIDE2OC41NzkgMTg2Ljk1MSAxNjAuMjM4IDE4Ni45NTFIMTU5Ljc2MkMxNTEuNDIxIDE4Ni45NTEgMTQzLjA0IDE4Ni4wNzEgMTM0LjYxOSAxODQuMzFDMTI2LjI3OCAxODIuNTQ5IDExOS4yNDggMTc5LjYyOCAxMTMuNTI4IDE3NS41NDZDMTA3LjgwOCAxNzEuNDY0IDEwNC45NDkgMTY2LjE0MSAxMDQuOTQ5IDE1OS41NzhDMTA0Ljk0OSAxNTMuMDE1IDEwNy44MDggMTQ3LjY5MiAxMTMuNTI4IDE0My42MUMxMTkuMjQ4IDEzOS41MjggMTI2LjI3OCAxMzYuNjA2IDEzNC42MTkgMTM0Ljg0NUMxNDMuMDQgMTMzLjA4NCAxNTEuNDIxIDEzMi4yMDQgMTU5Ljc2MiAxMzIuMjA0SDE2MC4yMzhaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzVfMiI+CjxyZWN0IHdpZHRoPSIyMDQiIGhlaWdodD0iODkiIGZpbGw9IndoaXRlIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAtMSA1OCAyMDQpIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+',

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
        const chainId = getAddressChainId(accounts[0].address)

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
        }

        if (shimDisconnect) {
          await Promise.all([
            config.storage?.setItem(`${this.id}.connected`, true),
            config.storage?.removeItem(`${this.id}.disconnected`),
          ])
        }

        return { accounts, chainId }
      } catch (error: any) {
        this.disconnect()
        throw new UserRejectedRequestError(error.message)
      }
    },
    async disconnect() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      provider.disconnect()
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

      const accounts = await provider.getAddresses()

      return [
        {
          address: accounts.nativeSegwit.address,
          addressType: AddressType.p2wpkh,
          publicKey: accounts.nativeSegwit.publicKey,
          purpose: 'payment',
        },
      ]
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
        const provider = await this.getInternalProvider()
        if (!provider) {
          throw new ProviderNotFoundError()
        }
        const providerIsConnected = await provider.isConnected()
        const isConnected =
          providerIsConnected &&
          shimDisconnect &&
          Boolean(await config.storage?.getItem(`${this.id}.connected`))

        return isConnected
      } catch (_error) {
        return false
      }
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        config.emitter.emit('change', {
          accounts: accounts.filter((account) => account.purpose === 'payment'),
        })
      }
    },
    async onChainChanged(chainId) {
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect() {
      config.emitter.emit('disconnect')
    },
  }))
}
