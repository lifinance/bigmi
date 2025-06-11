import type { CreateConnectorFn } from '../types/connector.js'

export function createConnector<
  provider,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>,
  ///
  createConnectorFn extends CreateConnectorFn<
    provider,
    properties,
    storageItem
  > = CreateConnectorFn<provider, properties, storageItem>,
>(createConnectorFn: createConnectorFn) {
  return createConnectorFn
}
