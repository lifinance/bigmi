import {
  type Account,
  type Address,
  AddressType,
  BaseError,
  base64ToHex,
  getAddressChainId,
  hexToBase64,
  MethodNotSupportedRpcError,
  type SignPsbtParameters,
  UserRejectedRequestError,
} from '@bigmi/core'
import {
  ConnectorChainIdDetectionError,
  ProviderNotFoundError,
} from '../errors/connectors.js'
import { createConnector } from '../factories/createConnector.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

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

  getAddress(): string
  _metadata: {
    icon?: string
  }
} & DynamicWalletConnectorEvents

type BitcoinAddress = {
  address: string
  type: 'ordinals' | 'payment'
  publicKey: string
}

export type BitcoinSignPsbtRequestSignature = {
  address: string
  signingIndexes: number[] | undefined
  disableAddressValidation?: boolean
}

type BitcoinSignPsbtRequest = {
  allowedSighash: number[]
  unsignedPsbtBase64: string
  signature?: BitcoinSignPsbtRequestSignature[]
}

type BitcoinSignPsbtResponse = {
  signedPsbt: string
}

type DynamicBitcoinWallet = {
  connector: DynamicWalletConnector
  additionalAddresses: BitcoinAddress[]
  address: string
  isAuthenticated: boolean
  signPsbt(
    parameters: BitcoinSignPsbtRequest
  ): Promise<BitcoinSignPsbtResponse | undefined>
}

type DynamicConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
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
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          try {
            const { psbt, ...options } = params as SignPsbtParameters
            const allowedSighash: number[] = options.inputsToSign.map((input) =>
              Number(input.sigHash)
            )
            const psbtBase64 = hexToBase64(psbt)

            const response = await wallet.signPsbt({
              allowedSighash,
              unsignedPsbtBase64: psbtBase64,
              signature: options.inputsToSign,
            })
            if (!response) {
              throw new Error('Error signing the transaction')
            }

            const { signedPsbt } = response

            const signedPsbtHex = base64ToHex(signedPsbt)

            return signedPsbtHex
          } catch (error: any) {
            throw new UserRejectedRequestError(error.message)
          }
        }
        default:
          throw new MethodNotSupportedRpcError()
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
        const chainId = getAddressChainId(accounts[0].address)

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
        throw new UserRejectedRequestError(error.message)
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
      const account = wallet.additionalAddresses.find(
        (wallet) => wallet.type === 'payment'
      )
      if (!account) {
        throw new BaseError('Please connect a wallet with a segwit address')
      }
      return [
        {
          address: account.address,
          publicKey: account.publicKey,
          addressType: AddressType.p2pkh,
          purpose: account.type,
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
    async getInternalProvider() {
      return wallet.connector
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
