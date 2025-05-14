import { version } from '../version.js'

type ErrorConfig = {
  version?: string | undefined
}

let errorConfig: ErrorConfig = {
  version: `bigmi@${version}`,
}

export function setErrorConfig(config: ErrorConfig) {
  errorConfig = config
}

type BaseErrorParameters = {
  cause?: BaseError | Error | undefined
  details?: string | undefined
  docsSlug?: string | undefined
  metaMessages?: string[] | undefined
  name?: string | undefined
}

export type BaseErrorType = BaseError & { name: 'BaseError' }
export class BaseError extends Error {
  code?: number
  details: string
  docsPath?: string | undefined
  metaMessages?: string[] | undefined
  shortMessage: string
  version: string

  override name = 'BaseError'

  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    const details = (() => {
      if (args.cause instanceof BaseError) {
        return args.cause.details
      }
      if (args.cause?.message) {
        return args.cause.message
      }
      return args.details!
    })()

    const message = [
      shortMessage || 'An error occurred.',
      '',
      ...(args.metaMessages ? [...args.metaMessages, ''] : []),
      ...(details ? [`Details: ${details}`] : []),
      ...(errorConfig.version ? [`Version: ${errorConfig.version}`] : []),
    ].join('\n')

    super(message, args.cause ? { cause: args.cause } : undefined)

    this.details = details
    this.metaMessages = args.metaMessages
    this.name = args.name ?? this.name
    this.shortMessage = shortMessage
    this.version = version
  }

  walk(): Error
  walk(fn: (err: unknown) => boolean): Error | null
  walk(fn?: any): any {
    return walk(this, fn)
  }
}

function walk(
  err: unknown,
  fn?: ((err: unknown) => boolean) | undefined
): unknown {
  if (fn?.(err)) {
    return err
  }
  if (
    err &&
    typeof err === 'object' &&
    'cause' in err &&
    err.cause !== undefined
  ) {
    return walk(err.cause, fn)
  }
  return fn ? null : err
}
