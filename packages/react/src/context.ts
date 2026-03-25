'use client'
import type { State } from '@bigmi/client'
import {
  type Context,
  createContext,
  createElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react'
import { Hydrate } from './hydrate.js'
import type { ResolvedRegister } from './types.js'

export const BigmiContext: Context<ResolvedRegister['config'] | undefined> =
  createContext<ResolvedRegister['config'] | undefined>(undefined)

export type BigmiProviderProps = {
  config: ResolvedRegister['config']
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function BigmiProvider(
  parameters: PropsWithChildren<BigmiProviderProps>
): ReactElement {
  const { children, config } = parameters

  const props = { value: config }
  return createElement(
    Hydrate,
    parameters,
    createElement(BigmiContext.Provider, props, children)
  )
}
