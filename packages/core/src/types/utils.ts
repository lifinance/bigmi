/** Combines members of an intersection into a readable type. */
// https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg
export type Compute<type> = { [key in keyof type]: type[key] } & unknown

/**
 * Makes all properties of an object optional.
 *
 * Compatible with [`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes).
 */
export type ExactPartial<type> = {
  [key in keyof type]?: type[key] | undefined
}

/** Checks if {@link type} can be narrowed further than {@link type2} */
export type IsNarrowable<type, type2> = IsUnknown<type> extends true
  ? false
  : undefined extends type
    ? false
    : IsNever<
          (type extends type2 ? true : false) &
            (type2 extends type ? false : true)
        > extends true
      ? false
      : true

/**
 * @internal
 * Checks if {@link type} is `never`
 */
export type IsNever<type> = [type] extends [never] ? true : false

/**
 * @internal
 * Checks if {@link type} is `unknown`
 */
export type IsUnknown<type> = unknown extends type ? true : false

/** Merges two object types into new type  */
export type Merge<obj1, obj2> = Compute<
  LooseOmit<obj1, keyof obj2 extends infer key extends string ? key : never> &
    obj2
>

/** Removes `readonly` from all properties of an object. */
export type Mutable<type extends object> = {
  -readonly [key in keyof type]: type[key]
}

/** Strict version of built-in Omit type */
export type StrictOmit<type, keys extends keyof type> = Pick<
  type,
  Exclude<keyof type, keys>
>

/** Makes objects destructurable. */
export type OneOf<
  union extends object,
  ///
  keys extends KeyofUnion<union> = KeyofUnion<union>,
> = union extends infer Item
  ? Compute<Item & { [K in Exclude<keys, keyof Item>]?: undefined }>
  : never
type KeyofUnion<type> = type extends type ? keyof type : never

/** Makes {@link key} optional in {@link type} while preserving type inference. */
// s/o trpc (https://github.com/trpc/trpc/blob/main/packages/server/src/types.ts#L6)
export type PartialBy<type, key extends keyof type> = ExactPartial<
  Pick<type, key>
> &
  StrictOmit<type, key>

/* Removes `undefined` from object property */
export type RemoveUndefined<type> = {
  [key in keyof type]: NonNullable<type[key]>
}

///////////////////////////////////////////////////////////////////////////
// Loose types

/** Loose version of {@link StrictOmit} */
export type LooseOmit<type, keys extends string> = Pick<
  type,
  Exclude<keyof type, keys>
>

///////////////////////////////////////////////////////////////////////////
// Union types

export type UnionCompute<type> = type extends object ? Compute<type> : type

export type UnionLooseOmit<type, keys extends string> = type extends any
  ? LooseOmit<type, keys>
  : never

export type UnionStrictOmit<type, keys extends keyof type> = type extends any
  ? StrictOmit<type, keys>
  : never

export type UnionExactPartial<type> = type extends object
  ? ExactPartial<type>
  : type

/**
 * @description Combines members of an intersection into a readable type.
 *
 * @see {@link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg}
 * @example
 * Prettify<{ a: string } & { b: string } & { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

/**
 * @description Assigns the properties of U onto T.
 *
 * @example
 * Assign<{ a: string, b: number }, { a: undefined, c: boolean }>
 * => { a: undefined, b: number, c: boolean }
 */
export type Assign<T, U> = Assign_<T, U> & U
type Assign_<T, U> = {
  [K in keyof T as K extends keyof U
    ? U[K] extends void
      ? never
      : K
    : K]: K extends keyof U ? U[K] : T[K]
}

export type MaybePromise<T> = T | Promise<T>
