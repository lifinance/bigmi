'use client'
import type {
  Config,
  ResolvedRegister,
  UseAccountParameters,
  UseAccountReturnType,
} from 'wagmi'
import { getAccount, watchAccount } from 'wagmi/actions'
import { useConfig } from './useConfig.js'
import { useSyncExternalStoreWithTracked } from './useSyncExternalStoreWithTracked.js'

/** https://wagmi.sh/react/api/hooks/useAccount */
export function useAccount<C extends Config = ResolvedRegister['config']>(
  parameters: UseAccountParameters<C> = {}
): UseAccountReturnType<C> {
  const config = useConfig(parameters)

  return useSyncExternalStoreWithTracked(
    (onChange) => watchAccount(config, { onChange }),
    () => getAccount(config)
  )
}
