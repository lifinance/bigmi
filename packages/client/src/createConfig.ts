import { createConfig as createBigmiConfig } from './core/createConfig.js'
import { createStorage, noopStorage } from './core/createStorage.js'

export function createConfig(
  parameters: Parameters<typeof createBigmiConfig>[0]
) {
  return createBigmiConfig({
    storage: createStorage({
      key: 'bigmi',
      storage:
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : noopStorage,
    }),
    ...parameters,
  })
}
