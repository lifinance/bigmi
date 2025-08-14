export function createBidirectionalMap<
  T extends string | number,
  U extends string | number,
>(
  mappings: readonly (readonly [T, U])[]
): {
  forward: Record<T, U>
  reverse: Partial<Record<U, T>>
} {
  const forward = Object.fromEntries(mappings) as Record<T, U>
  const reverse = Object.fromEntries(
    mappings.map(([key, value]) => [value, key])
  ) as Partial<Record<U, T>>

  return { forward, reverse }
}
