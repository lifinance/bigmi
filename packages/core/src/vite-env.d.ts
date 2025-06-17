/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEST_ADDRESS: string
  readonly VITE_TEST_ANKR_KEY: string
  readonly VITE_TEST_BLOCKCHAIR_KEY: string
  readonly VITE_TEST_BLOCKCYPHER_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
