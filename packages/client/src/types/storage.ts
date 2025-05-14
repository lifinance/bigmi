// key-values for loose autocomplete and typing
export type StorageItemMap = {
  recentConnectorId: string
}

export type Storage<
  itemMap extends Record<string, unknown> = Record<string, unknown>,
  ///
  storageItemMap extends StorageItemMap = StorageItemMap & itemMap,
> = {
  key: string
  getItem<
    key extends keyof storageItemMap,
    value extends storageItemMap[key],
    defaultValue extends value | null | undefined,
  >(
    key: key,
    defaultValue?: defaultValue | undefined
  ):
    | (defaultValue extends null ? value | null : value)
    | Promise<defaultValue extends null ? value | null : value>
  setItem<
    key extends keyof storageItemMap,
    value extends storageItemMap[key] | null,
  >(key: key, value: value): void | Promise<void>
  removeItem(key: keyof storageItemMap): void | Promise<void>
}
