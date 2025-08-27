import type { Account, AddressPurpose, SignPsbtParameters } from '@bigmi/core'
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

export type XverseBitcoinNetwork = 'Mainnet' | 'Testnet' | 'Testnet4' | 'Signet'
export type XverseStacksNetwork = 'Mainnet' | 'Testnet'

export type XverseNetworkChangeEventParams = {
  type: 'network_change'
  bitcoin: { name: XverseBitcoinNetwork }
  stacks: { name: XverseStacksNetwork }
  addresses: Account[]
}

export type XverseBitcoinEventMap = {
  accountChange(accounts: Account[]): void
  networkChange(event: XverseNetworkChangeEventParams): void
}

export type XverseBitcoinEvents = {
  addListener<TEvent extends keyof XverseBitcoinEventMap>(
    event: TEvent,
    listener: XverseBitcoinEventMap[TEvent]
  ): void
  removeListener?<TEvent extends keyof XverseBitcoinEventMap>(
    event: TEvent,
    listener: XverseBitcoinEventMap[TEvent]
  ): void
}

type XverseConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Account[]): void
  getInternalProvider(): Promise<XverseBitcoinProvider>
} & UTXOWalletProvider

type Error = { code: number; message: string }

// Define the shape of the request parameters
interface GetAccountsRequest {
  purposes: AddressPurpose[]
}

interface GetAccountsResponse {
  result?: { addresses: Account[] }
  error?: Error
}

interface RequestPermissionsResponse {
  result?: boolean
  error?: Error
}

interface GetNetworkResponse {
  result?: {
    bitcoin: { name: XverseBitcoinNetwork }
    stacks: { name: XverseStacksNetwork }
  }
  error?: Error
}

type XverseBitcoinProvider = {
  request(
    method: 'signPsbt',
    options: {
      psbt: string
      allowedSignHash: number
      signInputs: Record<string, number[]>
      broadcast: boolean
    }
  ): Promise<string>
  request(
    method: 'getAccounts' | 'getAddresses',
    options: GetAccountsRequest
  ): Promise<GetAccountsResponse>
  request(
    method: 'wallet_requestPermissions' | 'wallet_renouncePermissions'
  ): Promise<RequestPermissionsResponse>
  request(method: 'wallet_getNetwork'): Promise<GetNetworkResponse>
} & XverseBitcoinEvents

type ChainChangeHandler =
  | (((event: XverseNetworkChangeEventParams) => void) & {
      cancel?: () => void
    })
  | undefined

xverse.type = 'UTXO' as const
export function xverse(parameters: UTXOConnectorParameters = {}) {
  const XverseBitcoinChainIdMap: Record<XverseBitcoinNetwork, ChainId> = {
    Mainnet: ChainId.BITCOIN_MAINNET,
    Testnet: ChainId.BITCOIN_TESTNET,
    Testnet4: ChainId.BITCOIN_TESTNET4,
    Signet: ChainId.BITCOIN_SIGNET,
  }
  const { shimDisconnect = true } = parameters
  let accountChange: ((accounts: Account[]) => void) | undefined
  let chainChange: ChainChangeHandler

  return createConnector<
    UTXOWalletProvider | undefined,
    XverseConnectorProperties
  >((config) => ({
    id: 'XverseProviders.BitcoinProvider',
    name: 'Xverse Wallet',
    type: xverse.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxNzE3MTciIGQ9Ik0wIDBoNjAwdjYwMEgweiIvPjxwYXRoIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTQ0MCA0MzUuNHYtNTFjMC0yLS44LTMuOS0yLjItNS4zTDIyMCAxNjIuMmE3LjYgNy42IDAgMCAwLTUuNC0yLjJoLTUxLjFjLTIuNSAwLTQuNiAyLTQuNiA0LjZ2NDcuM2MwIDIgLjggNCAyLjIgNS40bDc4LjIgNzcuOGE0LjYgNC42IDAgMCAxIDAgNi41bC03OSA3OC43Yy0xIC45LTEuNCAyLTEuNCAzLjJ2NTJjMCAyLjQgMiA0LjUgNC42IDQuNUgyNDljMi42IDAgNC42LTIgNC42LTQuNlY0MDVjMC0xLjIuNS0yLjQgMS40LTMuM2w0Mi40LTQyLjJhNC42IDQuNiAwIDAgMSA2LjQgMGw3OC43IDc4LjRhNy42IDcuNiAwIDAgMCA1LjQgMi4yaDQ3LjVjMi41IDAgNC42LTIgNC42LTQuNloiLz48cGF0aCBmaWxsPSIjRUU3QTMwIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0zMjUuNiAyMjcuMmg0Mi44YzIuNiAwIDQuNiAyLjEgNC42IDQuNnY0Mi42YzAgNCA1IDYuMSA4IDMuMmw1OC43LTU4LjVjLjgtLjggMS4zLTIgMS4zLTMuMnYtNTEuMmMwLTIuNi0yLTQuNi00LjYtNC42TDM4NCAxNjBjLTEuMiAwLTIuNC41LTMuMyAxLjNsLTU4LjQgNTguMWE0LjYgNC42IDAgMCAwIDMuMiA3LjhaIi8+PC9nPjwvc3ZnPg==',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return undefined
      }
      if ('XverseProviders' in window) {
        const anyWindow: any = window
        const provider = anyWindow.XverseProviders.BitcoinProvider
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
      this: XverseBitcoinProvider | any,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
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
          const signedPsbt = await this.request('signPsbt', {
            psbt: psbtBase64,
            allowedSignHash: 1, // Default to Transaction.SIGHASH_ALL - 1
            signInputs: signInputs,
            broadcast: options.finalize,
          })

          if (signedPsbt?.error) {
            throw signedPsbt?.error
          }
          return base64ToHex(signedPsbt?.result?.psbt)
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
        const connected = await provider.request('wallet_requestPermissions')

        if (connected.error) {
          throw new UserRejectedRequestError(connected.error.message)
        }
      }

      const accounts = await this.getAccounts()
      const chainId = await this.getChainId()

      if (!accountChange) {
        accountChange = this.onAccountsChanged.bind(this)
        provider.addListener('accountChange', accountChange)
      }

      if (!chainChange) {
        // debounced because xverse wallet calls the event handler twice in rapid succession
        chainChange = debounce(
          (event: XverseNetworkChangeEventParams) =>
            this.onChainChanged(XverseBitcoinChainIdMap[event.bitcoin.name]),
          300
        )
        provider.addListener('networkChange', chainChange)
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
      if (accountChange) {
        provider.removeListener?.('accountChange', accountChange)
        accountChange = undefined
      }

      if (chainChange) {
        provider.removeListener?.('networkChange', chainChange)
        chainChange.cancel?.() // check for existing call and cancel
        chainChange = undefined
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
      const accounts = await provider.request('getAddresses', {
        purposes: ['payment'],
      })
      if (!accounts.result) {
        throw new UserRejectedRequestError(accounts.error?.message)
      }
      return accounts.result.addresses
    },
    async getChainId() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }
      const network = await provider.request('wallet_getNetwork')

      if (!network.result) {
        throw new UserRejectedRequestError(network.error?.message!)
      }

      return XverseBitcoinChainIdMap[network.result.bitcoin.name]
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
    async onChainChanged() {
      const { accounts, chainId } = await this.connect()
      config.emitter.emit('change', { chainId, accounts })
    },
    async onDisconnect(_error) {
      config.emitter.emit('disconnect')
    },
  }))
}
