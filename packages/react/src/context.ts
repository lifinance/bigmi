'use client'
import { type PropsWithChildren, createContext, createElement } from 'react'
import type { ResolvedRegister, State } from 'wagmi'
import { Hydrate } from 'wagmi'

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
