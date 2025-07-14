import type { QueryKey } from '@tanstack/query-core'

export function hashFn(queryKey: QueryKey): string {
  return JSON.stringify(queryKey, (_, value) => {
    if (isPlainObject(value)) {
      return Object.keys(value)
        .sort()
        .reduce((result, key) => {
          result[key] = value[key]
          return result
        }, {} as any)
    }
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  })
}

// biome-ignore lint/complexity/noBannedTypes: typeguard
function isPlainObject(value: any): value is Object {
  if (!hasObjectPrototype(value)) {
    return false
  }

  // If has modified constructor
  const ctor = value.constructor
  if (typeof ctor === 'undefined') {
    return true
  }

  // If has modified prototype
  const prot = ctor.prototype
  if (!hasObjectPrototype(prot)) {
    return false
  }

  // If constructor does not have an Object-specific method
  // biome-ignore lint/suspicious/noPrototypeBuiltins: part of the typeguard
  if (!prot.hasOwnProperty('isPrototypeOf')) {
    return false
  }

  // Most likely a plain Object
  return true
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}
