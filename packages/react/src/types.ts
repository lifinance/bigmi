import type { Config } from '@bigmi/client'

// oxlint-disable-next-line typescript/no-empty-object-type -- part of the types
export type Register = {}
export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}
