import {
  createConfig as createBigmiConfig,
  createStorage,
  noopStorage,
} from '@bigmi/core'

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
