import type { Account, Address, SignPsbtParameters } from '@bigmi/core'
import {
  base64ToHex,
  getAddressChainId,
  getAddressInfo,
  hexToBase64,
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

type ReownConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Address[]): void
  getInternalProvider(): Promise<InternalReownProvider | undefined>
} & UTXOWalletProvider

type InternalReownProvider = {
  id: string
  name: string
  imageUrl?: string
  connector: BitcoinConnector
  address: Address | undefined
}

export declare enum AddressPurpose {
  Ordinal = 'ordinal',
  Payment = 'payment',
  Stacks = 'stx',
}

type BitcoinConnector = {
  connect(): Promise<string>
  getAccountAddresses(): Promise<
    Array<{
      address: string
      publicKey?: string
      purpose: AddressPurpose
    }>
  >
  signPSBT(params: {
    psbt: string
    signInputs: Array<{
      address: string
      index: number
      sighashTypes: number[]
    }>
    broadcast?: boolean
  }): Promise<{ psbt: string; txid?: string }>
}

export type ReownWalletInfo = {
  name?: string
  icon?: string
}

export type ReownConnectorParameters = {
  connector: BitcoinConnector
  address?: Address
  walletInfo?: ReownWalletInfo
} & UTXOConnectorParameters

reown.type = 'UTXO' as const

export function reown(parameters: ReownConnectorParameters) {
  const {
    chainId,
    shimDisconnect = true,
    connector,
    address,
    walletInfo,
  } = parameters

  // Generate connector id and name from wallet info
  const id = walletInfo?.name?.toLowerCase().replace(/\s+/g, '-') || 'reown'
  const name = walletInfo?.name || 'Reown Bitcoin Wallet'
  const imageUrl = walletInfo?.icon

  // Create internal provider that wraps the BitcoinConnector
  const internalProvider: InternalReownProvider = {
    id,
    name,
    imageUrl,
    connector,
    address,
  }

  return createConnector<
    UTXOWalletProvider | undefined,
    ReownConnectorProperties
  >((config) => ({
    id,
    name,
    type: reown.type,
    icon: imageUrl,
    async setup() {
      //
    },
    async getInternalProvider() {
      return internalProvider
    },
    async getProvider() {
      const provider = await this.getInternalProvider()
      if (!provider) {
        return
      }
      const walletProvider = {
        request: this.request.bind(provider),
      }
      return walletProvider
    },
    async request(
      this: InternalReownProvider,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, ...options } = params as SignPsbtParameters
          const signInputs = options.inputsToSign.flatMap(
            ({ address, signingIndexes, sigHash }) =>
              signingIndexes.map((index) => ({
                address,
                index,
                sighashTypes: sigHash !== undefined ? [sigHash] : [],
              }))
          )

          // Convert hex PSBT to base64 for Reown connector
          const psbtBase64 = hexToBase64(psbt)

          const result = await this.connector.signPSBT({
            psbt: psbtBase64,
            signInputs,
            broadcast: false,
          })

          // Convert base64 result back to hex
          const signedPsbtHex = base64ToHex(result.psbt)
          return signedPsbtHex
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
        await provider.connector.connect()
        const accounts = await this.getAccounts()
        const detectedChainId = getAddressChainId(accounts[0].address)

        // Remove disconnected shim if it exists
        if (shimDisconnect) {
          await Promise.all([
            config.storage?.setItem(`${this.id}.connected`, true),
            config.storage?.removeItem(`${this.id}.disconnected`),
          ])
        }
        return { accounts, chainId: chainId ?? detectedChainId }
      } catch (error: any) {
        throw new UserRejectedRequestError(error.message)
      }
    },
    async disconnect() {
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

      // Try to get account info from connector's getAccountAddresses
      try {
        const accounts = await provider.connector.getAccountAddresses()
        const paymentAccount = accounts.find((acc) => acc.purpose === 'payment')

        if (paymentAccount) {
          const { type, purpose } = getAddressInfo(paymentAccount.address)
          const account: Account = {
            address: paymentAccount.address,
            addressType: type,
            publicKey: paymentAccount.publicKey ?? '',
            purpose,
          }
          return [account]
        }
      } catch {
        // getAccountAddresses not supported, fall back to address parameter
      }

      // Fall back to provided address
      if (provider.address) {
        const { type, purpose } = getAddressInfo(provider.address)
        const account: Account = {
          address: provider.address,
          addressType: type,
          publicKey: '',
          purpose,
        }
        return [account]
      }

      throw new ProviderNotFoundError()
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
          // Check storage to see if a connection exists already
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
    async onDisconnect(_error?) {
      // No need to remove `${this.id}.disconnected` from storage because `onDisconnect` is typically
      // only called when the wallet is disconnected through the wallet's interface, meaning the wallet
      // actually disconnected and we don't need to simulate it.
      config.emitter.emit('disconnect')
    },
  }))
}
