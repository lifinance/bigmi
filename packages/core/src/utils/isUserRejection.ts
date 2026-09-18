// Wallets that decline a confirmation without a rejection code are common
// enough that a message check is the only signal left. MetaMask's Bitcoin
// confirmation is one: it throws with no `code`, and its own cause is a
// generic -32603. Anchored on "user" so a node or host refusal is not caught.
const userRejectionMessage =
  /(^|\W)user\W+(has\W+)?(rejected|denied|cancell?ed)|\b(rejected|denied|cancell?ed)\W+by\W+(the\W+)?user\b/i

export const isUserRejection = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false
  }
  return userRejectionMessage.test(error.message)
}
