import { describe, expect, it } from 'vitest'
import { getBalance } from '../actions/getBalance.js'
import { createClient, rpcSchema } from '../factories/createClient.js'
import { mempool } from '../transports/mempool/mempool.js'
import type { UTXOSchema } from '../transports/types.js'
import { bitcoinSignet } from './signet.js'

const shouldSkipIntegration = !process.env.ENABLE_INTEGRATION_TESTS

const TESTNET_ADDRESS =
  'tb1p0d22lal2kve68h278yyqdl99cntymc9p37qd8uaj4ym7233c2k5s57m4sa'

describe('Real Testnet Integration', () => {
  it.skipIf(shouldSkipIntegration)(
    'should fetch real balance from testnet',
    async () => {
      const realTestnetClient = createClient({
        chain: bitcoinSignet,
        rpcSchema: rpcSchema<UTXOSchema>(),
        transport: mempool({
          baseUrl: 'https://mempool.space/signet/api',
        }),
      })

      const balance = await getBalance(realTestnetClient, {
        address: TESTNET_ADDRESS,
      })

      expect(typeof balance).toBe('bigint')
      expect(balance).toBeGreaterThanOrEqual(BigInt(0))
    }
  )
})
