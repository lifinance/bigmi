/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEST_ADDRESS: string
  // more env variables...
}

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
interface ImportMeta {
  readonly env: ImportMetaEnv
}
