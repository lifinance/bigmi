'use client'
import type { State } from '@bigmi/client'
import { createContext, createElement, type PropsWithChildren } from 'react'
import { Hydrate } from './hydrate.js'
import type { ResolvedRegister } from './types.js'

export const BigmiContext = createContext<
  ResolvedRegister['config'] | undefined
>(undefined)

export type BigmiProviderProps = {
  config: ResolvedRegister['config']
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function BigmiProvider(
  parameters: PropsWithChildren<BigmiProviderProps>
) {
  const { children, config } = parameters

  const props = { value: config }
  return createElement(
    Hydrate,
    parameters,
    createElement(BigmiContext.Provider, props, children)
  )
}
