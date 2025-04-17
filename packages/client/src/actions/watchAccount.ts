import { type Config, deepEqual } from '@bigmi/core'
import { type GetAccountReturnType, getAccount } from './getAccount.js'

export type WatchAccountParameters<config extends Config = Config> = {
  onChange(
    account: GetAccountReturnType<config>,
    prevAccount: GetAccountReturnType<config>
  ): void
}

export type WatchAccountReturnType = () => void

/** https://wagmi.sh/core/api/actions/watchAccount */
export function watchAccount<C extends Config>(
  config: C,
  parameters: WatchAccountParameters<C>
): WatchAccountReturnType {
  const { onChange } = parameters

  return config.subscribe(() => getAccount(config), onChange, {
    equalityFn(a, b) {
      const { connector: aConnector, ...aRest } = a
      const { connector: bConnector, ...bRest } = b
      return (
        deepEqual(aRest, bRest) &&
        // check connector separately
        aConnector?.id === bConnector?.id &&
        aConnector?.uid === bConnector?.uid
      )
    },
  })
}
