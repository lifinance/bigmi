---
description: "General coding standards for the bigmi library"
alwaysApply: true
---

## Import Pattern

When importing other files, always use `.js` file extension to adhere to the ESM/CJS compatibility pattern:

```typescript
// ✅ Correct
import { createConnector } from '../factories/createConnector.js'
import type { UTXOConnectorParameters } from './types.js'

// ❌ Incorrect
import { createConnector } from '../factories/createConnector'
import type { UTXOConnectorParameters } from './types'
```

## Package Imports

Import from `@bigmi/core` for core types and utilities, `@bigmi/client` for client-side functionality:

```typescript
import type { Account, SignPsbtParameters } from '@bigmi/core'
import { ChainId, ProviderNotFoundError } from '@bigmi/core'
```

## Documentation Comments

Use JSDoc/TSDoc format for function and type documentation. Keep comments concise and meaningful.

### When to Comment

- **Do comment:** Exported functions, complex logic, non-obvious behavior
- **Don't comment:** Self-explanatory code, obvious implementations, internal helpers

### Format

```typescript
// ✅ Good - Concise and useful
/**
 * Connects to a wallet using the specified connector.
 * @param config - The client configuration
 * @param parameters - Connection parameters including the connector
 * @returns The connected accounts and chain ID
 */
export async function connect(config: Config, parameters: ConnectParameters)

// ✅ Good - Documents non-obvious behavior
/**
 * Returns accounts filtered to payment purpose only.
 * Phantom returns multiple account types; we only use payment accounts.
 */
async getAccounts() { ... }

// ❌ Bad - States the obvious
/**
 * This function gets the chain ID.
 * @returns The chain ID
 */
async getChainId() { ... }

// ❌ Bad - Too verbose
/**
 * This method is responsible for establishing a connection
 * to the user's cryptocurrency wallet. It will attempt to
 * connect using the provided connector instance and will
 * return the resulting accounts and chain identifier upon
 * successful completion of the connection process.
 */
```

### Parameter Documentation

Only document parameters when they need clarification:

```typescript
// ✅ Good - Parameter needs explanation
/**
 * @param shimDisconnect - Simulates disconnect for wallets that don't support it natively
 */

// ❌ Bad - Parameter is self-explanatory
/**
 * @param accounts - The accounts
 */
```

## Error Throwing Rules

**CRITICAL:** Never throw generic `Error` objects. Always use custom error classes.

### When Throwing Errors

1. **Check for existing custom error** in this order:
   - `@bigmi/core` - Base errors, RPC errors, provider errors, address errors
   - `@bigmi/client` - Connector errors, config errors, connection errors
   - Package-specific error files
2. **If no appropriate error exists** - Suggest a new custom error to the user
3. **Create based on feedback** - Implement the new error class

### Error Location Guide

| Error Type | Package | Examples |
|------------|---------|----------|
| Base/utility errors | `@bigmi/core` | `BaseError`, `UserRejectedRequestError` |
| RPC errors | `@bigmi/core` | `MethodNotSupportedRpcError` |
| Provider errors | `@bigmi/core` | `ProviderNotFoundError` |
| Address errors | `@bigmi/core` | `InvalidAddressError` |
| Connector errors | `@bigmi/client` | `ConnectorNotFoundError`, `ConnectorAlreadyConnectedError` |
| Connection errors | `@bigmi/client` | `ConnectorChainMismatchError`, `ConnectorNotConnectedError` |
| Config errors | `@bigmi/client` | `ChainNotSupportedError` |

### Examples

```typescript
// ❌ WRONG - Generic errors
throw new Error('Provider not found')
throw new Error('Invalid address')

// ✅ CORRECT - Custom errors
throw new ProviderNotFoundError()
throw new InvalidAddressError({ address })
```

### When No Custom Error Exists

If you need to throw an error but no appropriate custom error exists, ask the user:

> "I need to throw an error for [situation], but there's no existing custom error for this.
> 
> I suggest creating `[ErrorName]Error` with these properties:
> - Message: "[proposed message]"
> - Parameters: `{ param1, param2 }`
> 
> Should I create this error class?"

Then create the error in the appropriate errors file based on user feedback.
