import type { UTXO } from '../../types/transaction.js'
import { urlWithParams } from '../../utils/url.js'
import type { RpcMethodHandler } from '../types.js'
import type {
  BlockChairDashboardAddressResponse,
  BlockchairAddressBalanceData,
  BlockchairResponse,
  BlockchairUTXO,
} from './blockchair.types.js'

const blockChairUTXOTransformer =
  (scriptHex: string) =>
  (data: BlockchairUTXO): UTXO => ({
    blockHeight: data.block_id,
    scriptHex,
    txId: data.transaction_hash,
    value: data.value,
    vout: data.index,
  })

export const getUTXOs: RpcMethodHandler<'getUTXOs'> = async (
  client,
  { baseUrl, apiKey },
  { address, minValue }
) => {
  async function isAddressUTXOEnough(minValue: number): Promise<boolean> {
    const apiUrl = urlWithParams(`${baseUrl}/addresses/balances`, {
      key: apiKey,
      addresses: address,
    })
    const response = (await client.request({
      url: apiUrl,
      fetchOptions: { method: 'GET' },
    })) as unknown as BlockchairResponse<BlockchairAddressBalanceData>

    if (response.context?.code !== 200) {
      throw new Error(response.context.error || 'Error fetching user balance')
    }

    const addressUTXOBalance = Number(response.data[address])

    return addressUTXOBalance > minValue
  }

  async function* fetchUTXOs() {
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const apiUrl = urlWithParams(
        `${baseUrl}/dashboards/addresses/${address}`,
        {
          key: apiKey,
          offset: `0,${offset}`,
        }
      )
      const response = (await client.request({
        url: apiUrl,
        fetchOptions: { method: 'GET' },
      })) as unknown as BlockchairResponse<BlockChairDashboardAddressResponse>

      if (response.context?.code !== 200) {
        throw new Error(`${response.context.code} : ${response.context?.error}`)
      }

      if (!response.data || response.data.utxo.length === 0) {
        hasMore = false
        continue
      }

      const { limit } = response.context
      const totalRows = response.data.addresses[address].unspent_output_count
      if (limit && totalRows) {
        const [, utxoLimit] = String(limit)
          .split(',')
          .map((val) => Number(val))
        hasMore = offset + utxoLimit < totalRows
        offset += utxoLimit
      } else {
        hasMore = false
        offset += 0
      }

      yield response.data
    }
  }

  try {
    if (minValue) {
      const _isAddressUTXOEnough = await isAddressUTXOEnough(minValue)
      if (!_isAddressUTXOEnough) {
        throw new Error(
          `Address: ${address} doesn't have enough utxo to spend ${minValue}`
        )
      }
    }
    const utxos: UTXO[] = []
    let valueCount = 0

    for await (const batch of fetchUTXOs()) {
      const addressScriptHex = batch.addresses[address].script_hex
      const utxoBatch = batch.utxo.map(
        blockChairUTXOTransformer(addressScriptHex)
      )
      utxos.push(...utxoBatch)

      if (minValue) {
        valueCount += utxoBatch.reduce((sum, utxo) => sum + utxo.value, 0)
        if (valueCount >= minValue) {
          break
        }
      }
    }

    return { result: utxos }
  } catch (error: any) {
    return {
      error: {
        code: error?.code || -1,
        message:
          error instanceof Error ? error.message : 'Failed to fetch UTXOs',
      },
    }
  }
}
