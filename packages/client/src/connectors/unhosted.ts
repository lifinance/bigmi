import type { Account, SignPsbtParameters } from '@bigmi/core'
import {
  BaseError,
  base64ToHex,
  ChainId,
  getAddressInfo,
  hexToBase64,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  UserRejectedRequestError,
} from '@bigmi/core'
import { ConnectorChainIdDetectionError } from '../errors/connectors.js'
import { createConnector } from '../factories/createConnector.js'
import { debounce } from '../utils/debounce.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

export type UnhostedBitcoinNetwork =
  | 'Mainnet'
  | 'Testnet'
  | 'Testnet4'
  | 'Signet'

interface WalletAccount {
  address: string
  publicKey: string
}

interface Network {
  name: UnhostedBitcoinNetwork
}

export type UnhostedBitcoinEvents = {
  on(
    event: 'bitcoin:accountsChanged',
    listener: (accounts: WalletAccount[]) => void
  ): void
  on(
    event: 'bitcoin:networkChanged',
    listener: (network: Network) => void
  ): void
  on(event: 'bitcoin:disconnect', listener: () => void): void
  off?(
    event: 'bitcoin:accountsChanged',
    listener: (accounts: WalletAccount[]) => void
  ): void
  off?(
    event: 'bitcoin:networkChanged',
    listener: (network: Network) => void
  ): void
  off?(event: 'bitcoin:disconnect', listener: () => void): void
}

type UnhostedConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  getInternalProvider(): Promise<UnhostedBitcoinProvider | undefined>
} & UTXOWalletProvider

interface SignPsbtParams {
  signInputs?: Record<string, number[]> // Map of address to input indices
  broadcast?: boolean // Broadcast after signing
}

interface SignPsbtResponse {
  psbt: string // Signed PSBT in base64
  txid?: string // Present if broadcast=true
}

type Response<T> = Promise<{
  result: T
}>

type UnhostedBitcoinProvider = UnhostedBitcoinEvents & {
  wallet_connect(): Promise<{ addresses: WalletAccount[] }>
  wallet_getNetwork(): Response<{ bitcoin: Network }>
  getAccounts(): Response<WalletAccount[]>
  signPsbt(
    psbtBase64: string,
    params?: SignPsbtParams
  ): Response<SignPsbtResponse>

  isUnhosted?: boolean
}

unhosted.type = 'UTXO' as const
export function unhosted(parameters: UTXOConnectorParameters = {}) {
  const UnhostedBitcoinChainIdMap: Record<UnhostedBitcoinNetwork, ChainId> = {
    Mainnet: ChainId.BITCOIN_MAINNET,
    Testnet: ChainId.BITCOIN_TESTNET,
    Testnet4: ChainId.BITCOIN_TESTNET4,
    Signet: ChainId.BITCOIN_SIGNET,
  }
  const { chainId, shimDisconnect = true } = parameters
  let handleAccountsChanged: ReturnType<typeof debounce> | undefined
  let handleChainChanged: ((network: Network) => void) | undefined
  let handleDisconnect: (() => void) | undefined

  return createConnector<
    UTXOWalletProvider | undefined,
    UnhostedConnectorProperties
  >((config) => ({
    id: 'unhosted.bitcoin',
    name: 'Unhosted Wallet',
    type: unhosted.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjU4IiBmaWxsPSIjMDQwNDA1Ii8+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ4LjI1LDIyLjc1KSBzY2FsZSgxLjUpIj4KPHBhdGggZD0iTTE1LjQ1ODggNDQuODMyNUMxNS40NTg4IDQ2LjM2MTYgMTUuMDIyOSA0Ny41NzE1IDE0LjE1NSA0OC40NTQyQzEzLjI4MzIgNDkuMzQxIDEyLjAyNjYgNDkuNzgyNCAxMC4zODUgNDkuNzgyNEM4Ljc0MzQ5IDQ5Ljc4MjQgNy40ODI4OSA0OS4zNDEgNi42MTUgNDguNDU0MkM1Ljc0MzE4IDQ3LjU3MTUgNS4zMTEyIDQ2LjM2MTYgNS4zMTEyIDQ0LjgzMjVWMjguNDA2NUgwLjU5MDgyVjQ0LjY4NjdDMC41OTA4MiA0Ni41OTggMC45Nzk2MDQgNDguMjUzMyAxLjc1MzI0IDQ5LjY1MjNDMi41MjY4OCA1MS4wNTE0IDMuNjQ2MTEgNTIuMTI3MiA1LjExMDkyIDUyLjg4QzYuNTc1NzMgNTMuNjMyNyA4LjMzMTE1IDU0LjAxMSAxMC4zODExIDU0LjAxMUMxMi40MzEgNTQuMDExIDE0LjE4NjUgNTMuNjMyNyAxNS42NTEzIDUyLjg4QzE3LjExNjEgNTIuMTI3MiAxOC4yMzUzIDUxLjA1MTQgMTkuMDA5IDQ5LjY1MjNDMTkuNzgyNiA0OC4yNTMzIDIwLjE3MTQgNDYuNTk4IDIwLjE3MTQgNDQuNjg2N1YyOC40MDY1SDE1LjQ1NDlWNDQuODMyNUgxNS40NTg4WiIgZmlsbD0iI0U5MzUzQSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIwLjY3Mjk4IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiLz4KPHBhdGggZD0iTTE1LjQ1ODggNDAuODkxNkMxNS40NTg4IDQyLjQyMDcgMTUuMDIyOSA0My42MzA2IDE0LjE1NSA0NC41MTMzQzEzLjI4MzIgNDUuNDAwMSAxMi4wMjY2IDQ1Ljg0MTUgMTAuMzg1IDQ1Ljg0MTVDOC43NDM0OSA0NS44NDE1IDcuNDgyODkgNDUuNDAwMSA2LjYxNSA0NC41MTMzQzUuNzQzMTggNDMuNjMwNiA1LjMxMTIgNDIuNDIwNyA1LjMxMTIgNDAuODkxNlYyNC40NjU2SDAuNTkwODJWNDAuNzQ1OEMwLjU5MDgyIDQyLjY1NzEgMC45Nzk2MDQgNDQuMzEyNCAxLjc1MzI0IDQ1LjcxMTRDMi41MjY4OCA0Ny4xMTA1IDMuNjQ2MTEgNDguMTg2MyA1LjExMDkyIDQ4LjkzOTFDNi41NzU3MyA0OS42OTE4IDguMzMxMTUgNTAuMDcwMSAxMC4zODExIDUwLjA3MDFDMTIuNDMxIDUwLjA3MDEgMTQuMTg2NSA0OS42OTE4IDE1LjY1MTMgNDguOTM5MUMxNy4xMTYxIDQ4LjE4NjMgMTguMjM1MyA0Ny4xMTA1IDE5LjAwOSA0NS43MTE0QzE5Ljc4MjYgNDQuMzEyNCAyMC4xNzE0IDQyLjY1NzEgMjAuMTcxNCA0MC43NDU4VjI0LjQ2NTZIMTUuNDU0OVY0MC44OTE2SDE1LjQ1ODhaIiBmaWxsPSIjRUE1OUY3IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjAuNjcyOTgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIvPgo8cGF0aCBkPSJNMTUuNDU4OCAzNi45NTA1QzE1LjQ1ODggMzguNDc5NiAxNS4wMjI5IDM5LjY4OTUgMTQuMTU1IDQwLjU3MjNDMTMuMjgzMiA0MS40NTkgMTIuMDI2NiA0MS45MDA0IDEwLjM4NSA0MS45MDA0QzguNzQzNDkgNDEuOTAwNCA3LjQ4Mjg5IDQxLjQ1OSA2LjYxNSA0MC41NzIzQzUuNzQzMTggMzkuNjg5NSA1LjMxMTIgMzguNDc5NiA1LjMxMTIgMzYuOTUwNVYyMC41MjQ1SDAuNTkwODJWMzYuODA0N0MwLjU5MDgyIDM4LjcxNjEgMC45Nzk2MDQgNDAuMzcxMyAxLjc1MzI0IDQxLjc3MDNDMi41MjY4OCA0My4xNjk0IDMuNjQ2MTEgNDQuMjQ1MyA1LjExMDkyIDQ0Ljk5OEM2LjU3NTczIDQ1Ljc1MDcgOC4zMzExNSA0Ni4xMjkxIDEwLjM4MTEgNDYuMTI5MUMxMi40MzEgNDYuMTI5MSAxNC4xODY1IDQ1Ljc1MDcgMTUuNjUxMyA0NC45OThDMTcuMTE2MSA0NC4yNDUzIDE4LjIzNTMgNDMuMTY5NCAxOS4wMDkgNDEuNzcwM0MxOS43ODI2IDQwLjM3MTMgMjAuMTcxNCAzOC43MTYxIDIwLjE3MTQgMzYuODA0N1YyMC41MjQ1SDE1LjQ1NDlWMzYuOTUwNUgxNS40NTg4WiIgZmlsbD0iIzYzMzNENyIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIwLjY3Mjk4IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiLz4KPHBhdGggZD0iTTE1LjQ1ODggMzMuMDA5NkMxNS40NTg4IDM0LjUzODcgMTUuMDIyOSAzNS43NDg2IDE0LjE1NSAzNi42MzE0QzEzLjI4MzIgMzcuNTE4MSAxMi4wMjY2IDM3Ljk1OTUgMTAuMzg1IDM3Ljk1OTVDOC43NDM0OSAzNy45NTk1IDcuNDgyODkgMzcuNTE4MSA2LjYxNSAzNi42MzE0QzUuNzQzMTggMzUuNzQ4NiA1LjMxMTIgMzQuNTM4NyA1LjMxMTIgMzMuMDA5NlYxNi41ODM2SDAuNTkwODJWMzIuODYzOEMwLjU5MDgyIDM0Ljc3NTIgMC45Nzk2MDQgMzYuNDMwNCAxLjc1MzI0IDM3LjgyOTRDMi41MjY4OCAzOS4yMjg1IDMuNjQ2MTEgNDAuMzA0NCA1LjExMDkyIDQxLjA1NzFDNi41NzU3MyA0MS44MDk4IDguMzMxMTUgNDIuMTg4MiAxMC4zODExIDQyLjE4ODJDMTIuNDMxIDQyLjE4ODIgMTQuMTg2NSA0MS44MDk4IDE1LjY1MTMgNDEuMDU3MUMxNy4xMTYxIDQwLjMwNDQgMTguMjM1MyAzOS4yMjg1IDE5LjAwOSAzNy44Mjk0QzE5Ljc4MjYgMzYuNDMwNCAyMC4xNzE0IDM0Ljc3NTIgMjAuMTcxNCAzMi44NjM4VjE2LjU4MzZIMTUuNDU0OVYzMy4wMDk2SDE1LjQ1ODhaIiBmaWxsPSIjMjI4N0VEIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjAuNjcyOTgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIvPgo8cGF0aCBkPSJNMTUuNDU4OCAyOS4wNjg4QzE1LjQ1ODggMzAuNTk3OSAxNS4wMjI5IDMxLjgwNzcgMTQuMTU1IDMyLjY5MDVDMTMuMjgzMiAzMy41NzcyIDEyLjAyNjYgMzQuMDE4NiAxMC4zODUgMzQuMDE4NkM4Ljc0MzQ5IDM0LjAxODYgNy40ODI4OSAzMy41NzcyIDYuNjE1IDMyLjY5MDVDNS43NDMxOCAzMS44MDc3IDUuMzExMiAzMC41OTc5IDUuMzExMiAyOS4wNjg4VjEyLjY0MjdIMC41OTA4MlYyOC45MjI5QzAuNTkwODIgMzAuODM0MyAwLjk3OTYwNCAzMi40ODk1IDEuNzUzMjQgMzMuODg4NkMyLjUyNjg4IDM1LjI4NzYgMy42NDYxMSAzNi4zNjM1IDUuMTEwOTIgMzcuMTE2MkM2LjU3NTczIDM3Ljg2OSA4LjMzMTE1IDM4LjI0NzMgMTAuMzgxMSAzOC4yNDczQzEyLjQzMSAzOC4yNDczIDE0LjE4NjUgMzcuODY5IDE1LjY1MTMgMzcuMTE2MkMxNy4xMTYxIDM2LjM2MzUgMTguMjM1MyAzNS4yODc2IDE5LjAwOSAzMy44ODg2QzE5Ljc4MjYgMzIuNDg5NSAyMC4xNzE0IDMwLjgzNDMgMjAuMTcxNCAyOC45MjI5VjEyLjY0MjdIMTUuNDU0OVYyOS4wNjg4SDE1LjQ1ODhaIiBmaWxsPSIjRkNGMDVFIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjAuNjcyOTgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIvPgo8cGF0aCBkPSJNMTUuNDU4OCAyNS4xMjc3QzE1LjQ1ODggMjYuNjU2OCAxNS4wMjI5IDI3Ljg2NjYgMTQuMTU1IDI4Ljc0OTRDMTMuMjgzMiAyOS42MzYxIDEyLjAyNjYgMzAuMDc3NSAxMC4zODUgMzAuMDc3NUM4Ljc0MzQ5IDMwLjA3NzUgNy40ODI4OSAyOS42MzYxIDYuNjE1IDI4Ljc0OTRDNS43NDMxOCAyNy44NjY2IDUuMzExMiAyNi42NTY4IDUuMzExMiAyNS4xMjc3VjguNzAxNjRIMC41OTA4MlYyNC45ODE4QzAuNTkwODIgMjYuODkzMiAwLjk3OTYwNCAyOC41NDg0IDEuNzUzMjQgMjkuOTQ3NUMyLjUyNjg4IDMxLjM0NjUgMy42NDYxMSAzMi40MjI0IDUuMTEwOTIgMzMuMTc1MUM2LjU3NTczIDMzLjkyNzkgOC4zMzExNSAzNC4zMDYyIDEwLjM4MTEgMzQuMzA2MkMxMi40MzEgMzQuMzA2MiAxNC4xODY1IDMzLjkyNzkgMTUuNjUxMyAzMy4xNzUxQzE3LjExNjEgMzIuNDIyNCAxOC4yMzUzIDMxLjM0NjUgMTkuMDA5IDI5Ljk0NzVDMTkuNzgyNiAyOC41NDg0IDIwLjE3MTQgMjYuODkzMiAyMC4xNzE0IDI0Ljk4MThWOC43MDE2NEgxNS40NTQ5VjI1LjEyNzdIMTUuNDU4OFoiIGZpbGw9IiNCRUZBNjEiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMC42NzI5OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIi8+CjxwYXRoIGQ9Ik0xNS40NTg4IDIxLjE4NjhDMTUuNDU4OCAyMi43MTU5IDE1LjAyMjkgMjMuOTI1OCAxNC4xNTUgMjQuODA4NkMxMy4yODMyIDI1LjY5NTMgMTIuMDI2NiAyNi4xMzY3IDEwLjM4NSAyNi4xMzY3QzguNzQzNDkgMjYuMTM2NyA3LjQ4Mjg5IDI1LjY5NTMgNi42MTUgMjQuODA4NkM1Ljc0MzE4IDIzLjkyNTggNS4zMTEyIDIyLjcxNTkgNS4zMTEyIDIxLjE4NjhWNC43NjA3N0gwLjU5MDgyVjIxLjA0MUMwLjU5MDgyIDIyLjk1MjQgMC45Nzk2MDQgMjQuNjA3NiAxLjc1MzI0IDI2LjAwNjZDMi41MjY4OCAyNy40MDU3IDMuNjQ2MTEgMjguNDgxNSA1LjExMDkyIDI5LjIzNDNDNi41NzU3MyAyOS45ODcgOC4zMzExNSAzMC4zNjUzIDEwLjM4MTEgMzAuMzY1M0MxMi40MzEgMzAuMzY1MyAxNC4xODY1IDI5Ljk4NyAxNS42NTEzIDI5LjIzNDNDMTcuMTE2MSAyOC40ODE1IDE4LjIzNTMgMjcuNDA1NyAxOS4wMDkgMjYuMDA2NkMxOS43ODI2IDI0LjYwNzYgMjAuMTcxNCAyMi45NTI0IDIwLjE3MTQgMjEuMDQxVjQuNzYwNzdIMTUuNDU0OVYyMS4xODY4SDE1LjQ1ODhaIiBmaWxsPSIjNUJFQzdCIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjAuNjcyOTgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIvPgo8cGF0aCBkPSJNMTUuNDU4OCAxNy4yNDU3QzE1LjQ1ODggMTguNzc0OCAxNS4wMjI5IDE5Ljk4NDcgMTQuMTU1IDIwLjg2NzVDMTMuMjgzMiAyMS43NTQyIDEyLjAyNjYgMjIuMTk1NiAxMC4zODUgMjIuMTk1NkM4Ljc0MzQ5IDIyLjE5NTYgNy40ODI4OSAyMS43NTQyIDYuNjE1IDIwLjg2NzVDNS43NDMxOCAxOS45ODQ3IDUuMzExMiAxOC43NzQ4IDUuMzExMiAxNy4yNDU3VjAuODE5NjcySDAuNTkwODJWMTcuMDk5OUMwLjU5MDgyIDE5LjAxMTIgMC45Nzk2MDQgMjAuNjY2NSAxLjc1MzI0IDIyLjA2NTVDMi41MjY4OCAyMy40NjQ2IDMuNjQ2MTEgMjQuNTQwNCA1LjExMDkyIDI1LjI5MzJDNi41NzU3MyAyNi4wNDU5IDguMzMxMTUgMjYuNDI0MiAxMC4zODExIDI2LjQyNDJDMTIuNDMxIDI2LjQyNDIgMTQuMTg2NSAyNi4wNDU5IDE1LjY1MTMgMjUuMjkzMkMxNy4xMTYxIDI0LjU0MDQgMTguMjM1MyAyMy40NjQ2IDE5LjAwOSAyMi4wNjU1QzE5Ljc4MjYgMjAuNjY2NSAyMC4xNzE0IDE5LjAxMTIgMjAuMTcxNCAxNy4wOTk5VjAuODE5NjcySDE1LjQ1NDlWMTcuMjQ1N0gxNS40NTg4WiIgZmlsbD0id2hpdGUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMC42NzI5OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIi8+CjwvZz4KPC9zdmc+Cg==',
    async setup() {
      // Provider doesn't require setup
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return undefined
      }
      const anyWindow: any = window

      if ('unhosted' in window && anyWindow.unhosted?.bitcoin) {
        const provider = anyWindow.unhosted.bitcoin
        if (provider.isUnhosted) {
          return provider
        }
      }

      // Fallback to window.btc
      if ('btc' in window && anyWindow.btc) {
        const provider = anyWindow.btc
        if (provider.isUnhosted) {
          return provider
        }
      }

      // Fallback to window.BitcoinProvider
      if ('BitcoinProvider' in window && anyWindow.BitcoinProvider) {
        const provider = anyWindow.BitcoinProvider
        if (provider.isUnhosted) {
          return provider
        }
      }

      return undefined
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
      this: UnhostedBitcoinProvider,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, inputsToSign, finalize } = params as SignPsbtParameters
          const psbtBase64 = hexToBase64(psbt)

          const signInputs: Record<string, number[]> = {}
          for (const input of inputsToSign) {
            signInputs[input.address] = input.signingIndexes
          }

          try {
            const { result } = await this.signPsbt(psbtBase64, {
              signInputs,
              broadcast: Boolean(finalize),
            })
            if (!result.psbt) {
              throw new BaseError('Failed to sign PSBT')
            }
            return base64ToHex(result.psbt)
          } catch (err_) {
            const err = err_ as { code?: number; message?: string }
            if (err?.code === 4001) {
              throw new UserRejectedRequestError(
                'User rejected the signing request'
              )
            }
            if (err_ instanceof BaseError) {
              throw err_
            }
            throw new BaseError(err?.message || 'Unknown error', {
              cause: err_ as Error,
            })
          }
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
        await provider.wallet_connect()
      }

      const accounts = await this.getAccounts()

      const chainId = await this.getChainId()

      if (!handleAccountsChanged) {
        handleAccountsChanged = debounce(this.onAccountsChanged.bind(this), 100)
        provider.on('bitcoin:accountsChanged', handleAccountsChanged)
      }

      if (!handleChainChanged) {
        handleChainChanged = (network: Network) => {
          this.onChainChanged(UnhostedBitcoinChainIdMap[network.name])
        }
        provider.on('bitcoin:networkChanged', handleChainChanged)
      }

      if (!handleDisconnect) {
        handleDisconnect = this.onDisconnect.bind(this)
        provider.on('bitcoin:disconnect', handleDisconnect)
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

      if (handleAccountsChanged) {
        provider?.off?.('bitcoin:accountsChanged', handleAccountsChanged)
        handleAccountsChanged = undefined
      }

      if (handleChainChanged) {
        provider?.off?.('bitcoin:networkChanged', handleChainChanged)
        handleChainChanged = undefined
      }

      if (handleDisconnect) {
        provider?.off?.('bitcoin:disconnect', handleDisconnect)
        handleDisconnect = undefined
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

      const { result } = await provider.getAccounts()

      if (!result) {
        return []
      }

      return result.map((wallet) => {
        const { type, purpose } = getAddressInfo(wallet.address)
        return {
          address: wallet.address,
          addressType: type,
          publicKey: wallet.publicKey,
          purpose,
        }
      })
    },
    async getChainId() {
      if (chainId) {
        return chainId
      }

      const provider = await this.getInternalProvider()
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      const { result } = await provider.wallet_getNetwork()

      const bitcoinName = result.bitcoin.name
      const detectedChainId = UnhostedBitcoinChainIdMap[bitcoinName]

      if (detectedChainId === undefined) {
        throw new ConnectorChainIdDetectionError({ connector: this.name })
      }

      return detectedChainId
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
    async onAccountsChanged(accounts: WalletAccount[]) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        const newAccounts = await this.getAccounts()
        config.emitter.emit('change', {
          accounts: newAccounts,
        })
      }
    },
    onChainChanged(chainId: ChainId) {
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error?: Error) {
      config.emitter.emit('disconnect')
    },
  }))
}
