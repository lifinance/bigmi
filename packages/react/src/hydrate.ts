'use client'

import { type Config, reconnect, type State } from '@bigmi/client'

import { type ReactElement, useEffect, useRef } from 'react'

import type { ResolvedRegister } from './types.js'

export type HydrateProps = {
  config: ResolvedRegister['config']
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

type HydrateParameters = {
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function hydrate(config: Config, parameters: HydrateParameters) {
  const { initialState, reconnectOnMount } = parameters

  if (initialState && !config._internal.store.persist.hasHydrated()) {
    config.setState({
      ...initialState,
      chainId: config.chains.some((x) => x.id === initialState.chainId)
        ? initialState.chainId
        : config.chains[0].id,
      connections: reconnectOnMount ? initialState.connections : new Map(),
      status: reconnectOnMount ? 'reconnecting' : 'disconnected',
    })
  }

  return {
    async onMount() {
      if (config._internal.ssr) {
        await config._internal.store.persist.rehydrate()
      }

      if (reconnectOnMount) {
        reconnect(config)
      } else if (config.storage) {
        // Reset connections that may have been hydrated from storage.
        config.setState((x) => ({
          ...x,
          connections: new Map(),
        }))
      }
    },
  }
}

export function Hydrate(parameters: React.PropsWithChildren<HydrateProps>) {
  const { children, config, initialState, reconnectOnMount = true } = parameters

  const { onMount } = hydrate(config, {
    initialState,
    reconnectOnMount,
  })

  // Hydrate for non-SSR
  if (!config._internal.ssr) {
    onMount()
  }

  // Hydrate for SSR
  const active = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `queryKey` not required
  useEffect(() => {
    if (!active.current) {
      return
    }
    if (!config._internal.ssr) {
      return
    }
    onMount()
    return () => {
      active.current = false
    }
  }, [])

  return children as ReactElement
}
