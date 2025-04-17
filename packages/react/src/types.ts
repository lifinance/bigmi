import type { Config } from '@bigmi/core'

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Register = {}
export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}
