import type { Chain, Compute, ExactPartial } from '@bigmi/core'
import type { Connection } from './connection.js'

export type State<
  chains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]],
> = {
  chainId: chains[number]['id']
  connections: Map<string, Connection>
  current: string | null
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
}

export type PartializedState = Compute<
  ExactPartial<Pick<State, 'chainId' | 'connections' | 'current' | 'status'>>
>
