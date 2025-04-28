export type Address =
  // Legacy addresses (P2PKH)
  | `1${string}` // mainnet
  | `m${string}` // testnet
  | `n${string}` // testnet

  // P2SH addresses
  | `3${string}` // mainnet
  | `2${string}` // testnet

  // Native SegWit addresses (P2WPKH and P2WSH)
  | `bc1q${string}` // mainnet
  | `tb1q${string}` // testnet
  | `bcrt1q${string}` // regtest

  // Taproot addresses (P2TR)
  | `bc1p${string}` // mainnet
  | `tb1p${string}` // testnet
  | `bcrt1p${string}` // regtest

  // Stacks addresses
  | `SP${string}` // mainnet
  | `ST${string}` // testnet
