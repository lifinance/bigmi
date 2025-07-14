import type { Config } from '@bigmi/client'

// biome-ignore lint/complexity/noBannedTypes: part of the types
export type Register = {}
export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}
