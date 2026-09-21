import type { Account, SignPsbtParameters } from '@bigmi/core'
import {
  getAddressChainId,
  getAddressInfo,
  hexToUnit8Array,
  MethodNotSupportedRpcError,
  ProviderNotFoundError,
  retryUntil,
  UserRejectedRequestError,
} from '@bigmi/core'
import { getWallets } from '@wallet-standard/app'
import type { Wallet, WalletAccount } from '@wallet-standard/base'
import {
  ConnectorChainIdDetectionError,
  ConnectorNotConnectedError,
} from '../errors/connectors.js'
import { createConnector } from '../factories/createConnector.js'
import type { CreateConnectorFn } from '../types/connector.js'
import type {
  ProviderRequestParams,
  UTXOConnectorParameters,
  UTXOWalletProvider,
} from './types.js'

type BitcoinAddressPurpose = 'ordinals' | 'payment'

/** MetaMask's string SIGHASH flags (Bigmi uses numeric). */
type BitcoinSigHashFlag =
  | 'ALL'
  | 'NONE'
  | 'SINGLE'
  | 'ALL|ANYONECANPAY'
  | 'NONE|ANYONECANPAY'
  | 'SINGLE|ANYONECANPAY'

/** MetaMask Bitcoin Wallet Standard features, registered by the app via `@metamask/bitcoin-wallet-standard`. */
type MetaMaskBitcoinFeatures = {
  'bitcoin:connect': {
    connect(input: {
      purposes: BitcoinAddressPurpose[]
    }): Promise<{ accounts: readonly WalletAccount[] }>
  }
  'bitcoin:signTransaction': {
    signTransaction(
      ...inputs: {
        psbt: Uint8Array
        inputsToSign: {
          account: WalletAccount
          signingIndexes: number[]
          sigHash?: BitcoinSigHashFlag
        }[]
        chain?: string
      }[]
    ): Promise<readonly { signedPsbt: Uint8Array }[]>
  }
  'bitcoin:events': {
    on(
      event: 'change',
      listener: (properties: { accounts?: readonly WalletAccount[] }) => void
    ): () => void
  }
}

type MetaMaskBitcoinWallet = Wallet & { features: MetaMaskBitcoinFeatures }

export type MetaMaskBitcoinEventMap = {
  change(properties: { accounts?: readonly WalletAccount[] }): void
}

export type MetaMaskBitcoinEvents = {
  on(event: 'change', listener: MetaMaskBitcoinEventMap['change']): () => void
}

type MetaMaskConnectorProperties = {
  getAccounts(): Promise<readonly Account[]>
  onAccountsChanged(accounts: Account[]): void
  getInternalProvider(): Promise<MetaMaskBitcoinWallet | undefined>
} & UTXOWalletProvider

const METAMASK_WALLET_NAME = 'MetaMask'

/** Bigmi numeric SIGHASH → MetaMask string flag (undefined = wallet default). */
function toSigHashFlag(sigHash?: number): BitcoinSigHashFlag | undefined {
  switch (sigHash) {
    case 0x01:
      return 'ALL'
    case 0x02:
      return 'NONE'
    case 0x03:
      return 'SINGLE'
    case 0x81:
      return 'ALL|ANYONECANPAY'
    case 0x82:
      return 'NONE|ANYONECANPAY'
    case 0x83:
      return 'SINGLE|ANYONECANPAY'
    default:
      return undefined
  }
}

function toAccount(account: WalletAccount): Account {
  const { type, purpose } = getAddressInfo(account.address)
  const publicKey = Array.from(account.publicKey, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
  return {
    address: account.address,
    addressType: type,
    publicKey,
    purpose,
  }
}

export function metamask(
  parameters: UTXOConnectorParameters = {}
): CreateConnectorFn<
  UTXOWalletProvider | undefined,
  MetaMaskConnectorProperties
> {
  const { chainId, shimDisconnect = true } = parameters
  let unsubscribe: (() => void) | undefined
  return createConnector<
    UTXOWalletProvider | undefined,
    MetaMaskConnectorProperties
  >((config) => ({
    id: 'io.metamask.bitcoin',
    name: 'MetaMask',
    type: metamask.type,
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1MDAnIGhlaWdodD0nNTAwJyBmaWxsPSdub25lJz4gPGcgY2xpcC1wYXRoPSd1cmwoI2EpJz4gPHBhdGggZmlsbD0nI0ZGNUMxNicgZD0nTTQyMC40MiA0MjUuMzIgMzM2IDQwMC4xOGwtNjMuNjYgMzguMDYtNDQuNDItLjAyLTYzLjctMzguMDQtODQuMzkgMjUuMTQtMjUuNjYtODYuNjUgMjUuNjYtOTYuMTctMjUuNjYtODEuMzFMNzkuODMgNjAuNDJsMTMxLjg2IDc4Ljc3aDc2Ljg4bDEzMS44NS03OC43NyAyNS42NyAxMDAuNzctMjUuNjcgODEuMyAyNS42NyA5Ni4xOHonLz4gPHBhdGggZmlsbD0nI0ZGNUMxNicgZD0nbTc5Ljg1IDYwLjQyIDEzMS44NiA3OC44My01LjI1IDU0LjFMNzkuODcgNjAuNDJabTg0LjM5IDI3OC4yOCA1OC4wMSA0NC4yLTU4LjAxIDE3LjI4em01My4zOC03My4wNi0xMS4xNi03Mi4yNS03MS4zNyA0OS4xMy0uMDMtLjAydi4wM2wuMjIgNTAuNTcgMjguOTQtMjcuNDZ6bTIwMi44LTIwNS4yMi0xMzEuODYgNzguODMgNS4yMyA1NC4xek0zMzYuMDQgMzM4LjdsLTU4LjAyIDQ0LjIgNTguMDIgMTcuMjh6bTI5LjE2LTk2LjE3aC4wMnp2LS4wM2wtLjAyLjAxLTcxLjM3LTQ5LjEyLTExLjE1IDcyLjI1aDUzLjM4TDM2NSAyOTMuMXonLz4gPHBhdGggZmlsbD0nI0UzNDgwNycgZD0nTTE2NC4yMiA0MDAuMTggNzkuODMgNDI1LjNsLTI1LjY2LTg2LjZoMTEwLjA1djYxLjQ3Wm01My4zOC0xMzQuNTYgMTYuMTIgMTA0LjQ1LTIyLjM0LTU4LjA4LTc2LjE0LTE4Ljg5IDI4Ljk2LTI3LjQ4em0xMTguNDQgMTM0LjU2IDg0LjM4IDI1LjEzIDI1LjY3LTg2LjZIMzM2LjA0em0tNTMuMzgtMTM0LjU2LTE2LjEyIDEwNC40NSAyMi4zNC01OC4wOCA3Ni4xNC0xOC44OS0yOC45OC0yNy40OHonLz4gPHBhdGggZmlsbD0nI0ZGOEQ1RCcgZD0nbTU0LjE3IDMzOC42NiAyNS42Ni05Ni4xN2g1NS4ybC4yIDUwLjYgNzYuMTUgMTguODggMjIuMzMgNTguMDgtMTEuNDggMTIuNzktNTguMDEtNDQuMkg1NC4xN3ptMzkxLjkyIDAtMjUuNjctOTYuMTdoLTU1LjJsLS4yIDUwLjYtNzYuMTQgMTguODgtMjIuMzQgNTguMDggMTEuNDggMTIuNzkgNTguMDItNDQuMmgxMTAuMDV6TTI4OC41NiAxMzkuMkgyMTEuN2wtNS4yMyA1NC4xTDIzMy43MSAzNzBoMzIuODNsMjcuMjctMTc2Ljd6Jy8+IDxwYXRoIGZpbGw9JyM2NjE4MDAnIGQ9J003OS44MyA2MC40MiA1NC4xNyAxNjEuMTlsMjUuNjYgODEuM2g1NS4ybDcxLjQyLTQ5LjE0TDc5Ljg0IDYwLjQyWk0yMDEuNjQgMjg2LjZoLTI1bC0xMy42MiAxMy4zNCA0OC4zOCAxMi05Ljc2LTI1LjM2ek00MjAuNDIgNjAuNDJsMjUuNjcgMTAwLjc3LTI1LjY3IDgxLjNoLTU1LjJsLTcxLjQxLTQ5LjE0TDQyMC40IDYwLjQyWk0yOTguNjUgMjg2LjZoMjUuMDRsMTMuNjIgMTMuMzYtNDguNDMgMTIuMDIgOS43Ny0yNS40em0tMjYuMzMgMTE3LjE2IDUuNy0yMC44OC0xMS40OC0xMi44aC0zMi44NWwtMTEuNDggMTIuOCA1LjcgMjAuODgnLz4gPHBhdGggZmlsbD0nI0MwQzRDRCcgZD0nTTI3Mi4zMiA0MDMuNzZ2MzQuNWgtNDQuNHYtMzQuNXonLz4gPHBhdGggZmlsbD0nI0U3RUJGNicgZD0nbTE2NC4yNCA0MDAuMTQgNjMuNzIgMzguMXYtMzQuNWwtNS43LTIwLjg4em0xNzEuOCAwLTYzLjcyIDM4LjF2LTM0LjVsNS43LTIwLjg4eicvPiA8L2c+IDxkZWZzPiA8Y2xpcFBhdGggaWQ9J2EnPiA8cGF0aCBmaWxsPSd3aGl0ZScgZD0nTTAgMGg1MDB2NTAwSDB6Jy8+IDwvY2xpcFBhdGg+IDwvZGVmcz4gPC9zdmc+',
    async setup() {
      //
    },
    async getInternalProvider() {
      if (typeof window === 'undefined') {
        return
      }
      // Match the app-registered MetaMask wallet by name + `bitcoin:connect`.
      const { get } = getWallets()
      const wallet = get().find(
        (wallet) =>
          wallet.name === METAMASK_WALLET_NAME &&
          'bitcoin:connect' in wallet.features
      )
      return wallet as MetaMaskBitcoinWallet | undefined
    },
    async getProvider() {
      const wallet = await this.getInternalProvider()
      if (!wallet) {
        return
      }
      const provider = {
        request: this.request.bind(wallet),
      }
      return provider
    },
    async request(
      this: MetaMaskBitcoinWallet,
      { method, params }: ProviderRequestParams
    ): Promise<any> {
      switch (method) {
        case 'signPsbt': {
          const { psbt, inputsToSign } = params as SignPsbtParameters
          const signInputs = inputsToSign.map((input) => {
            const account = this.accounts.find(
              (account) => account.address === input.address
            )
            if (!account) {
              throw new Error(`Account with address ${input.address} not found`)
            }
            return {
              account,
              signingIndexes: input.signingIndexes,
              sigHash: toSigHashFlag(input.sigHash),
            }
          })
          const [result] = await this.features[
            'bitcoin:signTransaction'
          ].signTransaction({
            psbt: hexToUnit8Array(psbt),
            inputsToSign: signInputs,
          })
          return Array.from(result.signedPsbt, (byte) =>
            byte.toString(16).padStart(2, '0')
          ).join('')
        }
        default:
          throw new MethodNotSupportedRpcError(method)
      }
    },
    async connect({ isReconnecting } = {}) {
      const wallet = await this.getInternalProvider()
      if (!wallet) {
        throw new ProviderNotFoundError()
      }
      // `bitcoin:connect` opens MetaMask, and reconnect runs on app mount, so
      // it must only read the session the wallet already restored. The wallet
      // fills `accounts` from an un-awaited session lookup, so poll rather
      // than take the first snapshot.
      const restored = isReconnecting
        ? ((await retryUntil(
            async () => {
              // A half-initialized wallet can throw from the getter itself as
              // well as from a single account, and either would end the poll
              // this exists to survive.
              try {
                const payment = (wallet.accounts ?? []).flatMap((account) => {
                  try {
                    const parsed = toAccount(account as WalletAccount)
                    return parsed.purpose === 'payment' ? [parsed] : []
                  } catch {
                    return []
                  }
                })
                return payment.length > 0 ? payment : undefined
              } catch {
                return undefined
              }
            },
            // `reconnect` allows `connect` 5s, and the provider lookup before
            // it returns as soon as the wallet registers, so this is the only
            // meaningful wait. A stale shim pays it once per load.
            { timeout: 1500, interval: 50 }
          )) ?? [])
        : undefined

      // Outside the try: nothing was shown to the user, so this must not be
      // reported as a rejection.
      if (restored && restored.length === 0) {
        // The session is gone — revoked while the tab was closed, say — and
        // `reconnect` swallows this error, so clear the shim here or every
        // later load pays the poll again.
        if (shimDisconnect) {
          try {
            await config.storage?.removeItem(`${this.id}.connected`)
          } catch {}
        }
        throw new ConnectorNotConnectedError()
      }

      const accounts = restored ?? (await this.getAccounts())
      // [1] The interactive path can also come back empty, when the user holds
      // no Bitcoin account. Reading accounts[0] would throw a TypeError that
      // the catch below would relabel as a rejection.
      if (accounts.length === 0) {
        throw new ConnectorNotConnectedError()
      }

      try {
        const chainId = getAddressChainId(accounts[0].address)

        if (!unsubscribe) {
          const onAccountsChanged = this.onAccountsChanged.bind(this)
          unsubscribe = wallet.features['bitcoin:events'].on(
            'change',
            ({ accounts }) => {
              // A throw here escapes into MetaMask's emitter, so bigmi would
              // never learn the account changed. Skip what cannot be parsed.
              const reported = accounts ?? []
              const parsed = reported.flatMap((account) => {
                try {
                  return [toAccount(account as WalletAccount)]
                } catch {
                  return []
                }
              })
              // Nothing parsed out of a non-empty batch is the transient
              // half-initialized state, not a disconnect. Reporting it as one
              // would drop the session and the shim with it.
              if (reported.length > 0 && parsed.length === 0) {
                return
              }
              onAccountsChanged(parsed)
            }
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
        // Nothing is shown to the user while reconnecting, so a failure there
        // is not a rejection.
        if (isReconnecting) {
          throw error
        }
        throw new UserRejectedRequestError(error.message)
      }
    },
    async disconnect() {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
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
      const wallet = await this.getInternalProvider()
      if (!wallet) {
        throw new ProviderNotFoundError()
      }
      // MetaMask exposes SegWit (payment) addresses only; Taproot/ordinals planned.
      const { accounts } = await wallet.features['bitcoin:connect'].connect({
        purposes: ['payment'],
      })
      return accounts
        .map(toAccount)
        .filter((account) => account.purpose === 'payment')
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
        if (!isConnected) {
          return false
        }

        // Deliberately the shim alone. The wallet fills `accounts` from a
        // session lookup it does not await, so reading it here would race the
        // restore and report false on every reload, skipping reconnect
        // entirely. `connect({ isReconnecting: true })` waits for the session
        // and rejects if it never arrives.
        return Boolean(await this.getInternalProvider())
      } catch {
        return false
      }
    },
    async onAccountsChanged(accounts) {
      // MetaMask exposes payment addresses only. A selection that filters to
      // nothing — a Taproot-only account, say — would otherwise leave the
      // store connected with no usable address.
      const payment = accounts.filter(
        (account) => account.purpose === 'payment'
      )
      if (payment.length === 0) {
        this.onDisconnect()
      } else {
        config.emitter.emit('change', { accounts: payment })
      }
    },
    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error) {
      // Release the subscription, or a later connect sees a truthy
      // `unsubscribe`, skips reattaching, and stays bound to a wallet object
      // MetaMask has since replaced.
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
      }
      // `isAuthorized` gates on the connected shim, so leaving it would keep
      // reporting an authorized connector after the user revoked the site
      // inside MetaMask, and every load would retry a session that is gone.
      if (shimDisconnect) {
        // A blocked localStorage must not stop the disconnect being reported,
        // or the store stays connected with no usable address.
        try {
          await config.storage?.removeItem(`${this.id}.connected`)
        } catch {}
      }
      config.emitter.emit('disconnect')
    },
  }))
}
export declare namespace metamask {
  export var type: 'UTXO'
}
metamask.type = 'UTXO' as const
