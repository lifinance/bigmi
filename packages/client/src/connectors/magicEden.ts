import {
  type Account,
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
import { createUnsecuredToken } from '../utils/createUnsecuredToken.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type MagicEdenBitcoinEventMap = {
  accountsChanged(accounts: Account[]): void
}

export type MagicEdenBitcoinEvents = {
  addListener<TEvent extends keyof MagicEdenBitcoinEventMap>(
    event: TEvent,
    listener: MagicEdenBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof MagicEdenBitcoinEventMap>(
    event: TEvent,
    listener: MagicEdenBitcoinEventMap[TEvent]
  ): void
}

type MagicEdenConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Account[]): void
  getInternalProvider(): Promise<MagicEdenBitcoinProvider>
} & UTXOWalletProvider

type MagicEdenBitcoinProvider = {
  connect(encodedRequest: string): Promise<{ addresses: Account[] }>
  signTransaction(encodedRequest: string): Promise<{
    psbtBase64: string
    txId?: string
  }>
} & MagicEdenBitcoinEvents

magicEden.type = 'UTXO' as const
export function magicEden(parameters: UTXOConnectorParameters = {}) {
  const { chainId, shimDisconnect = true } = parameters
  let accountsChanged: ((accounts: Account[]) => void) | undefined

  return createConnector<
    UTXOWalletProvider | undefined,
    MagicEdenConnectorProperties
  >((config) => ({
    id: 'app.magiceden.bitcoin',
    name: 'Magic Eden',
    type: magicEden.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjMDcwQzM0Ii8+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF84XzIpIj4KPHBhdGggZD0iTTE5NS44MSAxMzQuNUwyMDUuOTYgMTQ2LjQzQzIwNy4xMyAxNDcuNzcgMjA4LjE1IDE0OC44NyAyMDguNTggMTQ5LjVDMjExLjYyIDE1Mi41MiAyMTMuMzIgMTU2LjU5IDIxMy4zMiAxNjAuODRDMjEzLjA0IDE2NS44NiAyMDkuNzYgMTY5LjI3IDIwNi43NSAxNzIuOTNMMTk5LjY1IDE4MS4yN0wxOTUuOTQgMTg1LjU5QzE5NS44MSAxODUuNzQgMTk1LjcyIDE4NS45MiAxOTUuNjkgMTg2LjEyQzE5NS42NiAxODYuMzIgMTk1LjY5IDE4Ni41MiAxOTUuNzggMTg2LjdDMTk1Ljg2IDE4Ni44OCAxOTYgMTg3LjAzIDE5Ni4xOCAxODcuMTRDMTk2LjM2IDE4Ny4yNSAxOTYuNTYgMTg3LjI5IDE5Ni43NiAxODcuMjhIMjMzLjhDMjM5LjQ1IDE4Ny4yOCAyNDYuNTggMTkyLjA0IDI0Ni4xNyAxOTkuMjVDMjQ2LjE3IDIwMi41MiAyNDQuODMgMjA1LjY3IDI0Mi40OCAyMDcuOTlDMjQwLjEyIDIxMC4zMSAyMzYuOTMgMjExLjYyIDIzMy42MSAyMTEuNjNIMTc1LjYxQzE3MS43OSAyMTEuNjMgMTYxLjUzIDIxMi4wNCAxNTguNjYgMjAzLjI5QzE1OC4wNSAyMDEuNDYgMTU3Ljk3IDE5OS41IDE1OC40MiAxOTcuNjJDMTU5LjI2IDE5NC44NSAxNjAuNTggMTkyLjI1IDE2Mi4zMiAxODkuOTNDMTY1LjI0IDE4NS42MSAxNjguNCAxODEuMjggMTcxLjUxIDE3Ny4wOUMxNzUuNTMgMTcxLjYgMTc5LjY1IDE2Ni4yOSAxODMuNyAxNjAuNjlDMTgzLjg0IDE2MC41MSAxODMuOTIgMTYwLjI4IDE4My45MiAxNjAuMDVDMTgzLjkyIDE1OS44MiAxODMuODQgMTU5LjU5IDE4My43IDE1OS40MUwxNjguOTYgMTQyLjEyQzE2OC44NyAxNDEuOTkgMTY4Ljc0IDE0MS45IDE2OC41OSAxNDEuODNDMTY4LjQ1IDE0MS43NiAxNjguMyAxNDEuNzIgMTY4LjEzIDE0MS43MkMxNjcuOTYgMTQxLjcyIDE2Ny44MSAxNDEuNzYgMTY3LjY3IDE0MS44M0MxNjcuNTMgMTQxLjkgMTY3LjQgMTQyLjAxIDE2Ny4zIDE0Mi4xMkMxNjMuMzUgMTQ3LjM3IDE0Ni4wNyAxNzAuNjMgMTQyLjM5IDE3NS4zNEMxMzguNzEgMTgwLjA1IDEyOS42MyAxODAuMzEgMTI0LjYgMTc1LjM0TDEwMS41NSAxNTIuNTNDMTAxLjQxIDE1Mi4zOSAxMDEuMjIgMTUyLjI4IDEwMS4wMSAxNTIuMjVDMTAwLjgxIDE1Mi4yMSAxMDAuNiAxNTIuMjMgMTAwLjQgMTUyLjMxQzEwMC4yMSAxNTIuMzkgMTAwLjA1IDE1Mi41MiA5OS45MyAxNTIuN0M5OS44MSAxNTIuODggOTkuNzUgMTUzLjA4IDk5Ljc1IDE1My4yOFYxOTcuMTJDOTkuODEgMjAwLjIzIDk4Ljg3IDIwMy4yOCA5Ny4wOCAyMDUuODVDOTUuMjkgMjA4LjQxIDkyLjcyIDIxMC4zNiA4OS43NSAyMTEuNDFDODcuODUgMjEyLjA2IDg1LjgzIDIxMi4yNiA4My44NCAyMTEuOThDODEuODUgMjExLjcgNzkuOTUgMjEwLjk2IDc4LjMyIDIwOS44MUM3Ni42OCAyMDguNjcgNzUuMzQgMjA3LjE1IDc0LjQyIDIwNS4zOUM3My41IDIwMy42MyA3My4wMSAyMDEuNjggNzMuMDEgMTk5LjdWMTIwLjg3QzczLjE0IDExOC4wMyA3NC4xOCAxMTUuMyA3NS45OCAxMTMuMDdDNzcuNzYgMTEwLjg0IDgwLjIyIDEwOS4yMyA4MyAxMDguNDdDODUuMzggMTA3Ljg1IDg3Ljg5IDEwNy44NSA5MC4yNyAxMDguNDlDOTIuNjUgMTA5LjEzIDk0LjgyIDExMC4zNyA5Ni41NSAxMTIuMTFMMTMxLjk4IDE0Ny4wN0MxMzIuMDkgMTQ3LjE4IDEzMi4yMiAxNDcuMjYgMTMyLjM2IDE0Ny4zMUMxMzIuNSAxNDcuMzYgMTMyLjY1IDE0Ny4zOCAxMzIuODEgMTQ3LjM3QzEzMi45NiAxNDcuMzYgMTMzLjEgMTQ3LjMxIDEzMy4yMyAxNDcuMjRDMTMzLjM2IDE0Ny4xNyAxMzMuNDggMTQ3LjA2IDEzMy41NiAxNDYuOTVMMTU4LjczIDExMi41OUMxNTkuOSAxMTEuMiAxNjEuMzYgMTEwLjA3IDE2My4wMSAxMDkuMjlDMTY0LjY2IDEwOC41MSAxNjYuNDYgMTA4LjEgMTY4LjMgMTA4LjA4SDIzMy43OEMyMzUuNTcgMTA4LjA4IDIzNy4zNCAxMDguNDcgMjM4Ljk3IDEwOS4yQzI0MC42IDEwOS45MyAyNDIuMDYgMTExIDI0My4yMyAxMTIuMzNDMjQ0LjQxIDExMy42NiAyNDUuMjkgMTE1LjIzIDI0NS44MSAxMTYuOTFDMjQ2LjMzIDExOC42MSAyNDYuNDcgMTIwLjM4IDI0Ni4yMyAxMjIuMTNDMjQ1Ljc3IDEyNS4xNyAyNDQuMiAxMjcuOTQgMjQxLjgyIDEyOS45MkMyMzkuNDQgMTMxLjkxIDIzNi40MiAxMzIuOTggMjMzLjMgMTMyLjk0SDE5Ni42M0MxOTYuNDQgMTMyLjk0IDE5Ni4yNiAxMzMgMTk2LjExIDEzMy4wOUMxOTUuOTYgMTMzLjE4IDE5NS44MyAxMzMuMzMgMTk1Ljc0IDEzMy40OEMxOTUuNjYgMTMzLjY0IDE5NS42MSAxMzMuODIgMTk1LjYyIDEzNEMxOTUuNjIgMTM0LjE4IDE5NS42OSAxMzQuMzUgMTk1LjggMTM0LjUxSDE5NS43OUwxOTUuODEgMTM0LjVaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfOF8yKSIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfOF8yIiB4MT0iNDQuMjIiIHkxPSI5My40MyIgeDI9IjIzOC42NCIgeTI9IjIwNS42OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAuMjMiIHN0b3AtY29sb3I9IiNGRjAwNzUiLz4KPHN0b3Agb2Zmc2V0PSIwLjI3IiBzdG9wLWNvbG9yPSIjRkYwNTY5Ii8+CjxzdG9wIG9mZnNldD0iMC4zNCIgc3RvcC1jb2xvcj0iI0ZGMTM0OSIvPgo8c3RvcCBvZmZzZXQ9IjAuNDEiIHN0b3AtY29sb3I9IiNGRjIyMjgiLz4KPHN0b3Agb2Zmc2V0PSIwLjUxIiBzdG9wLWNvbG9yPSIjRkY0QTE1Ii8+CjxzdG9wIG9mZnNldD0iMC42MSIgc3RvcC1jb2xvcj0iI0ZGNkMwNSIvPgo8c3RvcCBvZmZzZXQ9IjAuNjYiIHN0b3AtY29sb3I9IiNGRjc5MDAiLz4KPHN0b3Agb2Zmc2V0PSIwLjciIHN0b3AtY29sb3I9IiNGRjg4MEMiLz4KPHN0b3Agb2Zmc2V0PSIwLjgyIiBzdG9wLWNvbG9yPSIjRkZBQzJCIi8+CjxzdG9wIG9mZnNldD0iMC45MiIgc3RvcC1jb2xvcj0iI0ZGQzIzRSIvPgo8c3RvcCBvZmZzZXQ9IjAuOTgiIHN0b3AtY29sb3I9IiNGRkNCNDUiLz4KPC9saW5lYXJHcmFkaWVudD4KPGNsaXBQYXRoIGlkPSJjbGlwMF84XzIiPgo8cmVjdCB3aWR0aD0iMTczLjM1IiBoZWlnaHQ9IjEwNC4xMSIgZmlsbD0id2hpdGUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDczIDEwOCkiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      if ('magicEden' in window) {
        const anyWindow: any = window
        if (anyWindow?.magicEden?.bitcoin?.isMagicEden) {
          return anyWindow.magicEden.bitcoin
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
    async request(
      this: MagicEdenBitcoinProvider,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters

          const requestParams = {
            network: { type: 'Mainnet' },
            psbtBase64: hexToBase64(psbt),
            inputsToSign: options.inputsToSign,
          }
          const request = encodeParams(requestParams)
          const signedPsbt = await this.signTransaction(request)
          return base64ToHex(signedPsbt.psbtBase64)
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
        // remove outdated shims and clean up events
        await this.disconnect()
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
      const params = { purposes: ['payment'] }
      const request = encodeParams(params)

      const { addresses } = await provider.connect(request)

      return addresses.filter((account) => account.purpose === 'payment')
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
        if (shimDisconnect) {
          return Boolean(await config.storage?.getItem(`${this.id}.connected`))
        }
        const accounts = await this.getAccounts()
        return !!accounts.length
      } catch {
        return false
      }
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        const filteredAccounts = (accounts as Account[]).filter(
          (account) => account.purpose === 'payment'
        )

        config.emitter.emit('change', {
          accounts: filteredAccounts,
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

function encodeParams(params: any) {
  const token = createUnsecuredToken(params)
  return token
}
