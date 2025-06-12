# Core API Reference

This document provides a comprehensive reference for the `@bigmi/core` package, which contains the fundamental functionality for interacting with the Bitcoin network.

# Getting Started

## Client Creation

### `createClient`

Creates a new Bitcoin client instance.

```typescript
import { createClient, bitcoin } from '@bigmi/core'
import { blockchair } from '@bigmi/core'

const client = createClient({
  chain: bitcoin,
  transport: blockchair(),
})
```

#### Parameters

- `chain`: The Bitcoin chain configuration
- `transport`: The transport layer to use
- `pollingInterval?`: How often to poll for updates (default: 4000ms)
- `batchSize?`: Number of requests to batch (default: 10)
- `timeout?`: Request timeout in milliseconds (default: 30000ms)

#### Returns

A configured client instance.

## Configuration
[See All Configuration detail](./config.md)

## Actions

[See All Actions](./actions.md)

## Utility Functions

[See All Utils](./utils.md)

## Error Types

[See Core Errors reference](./errors.md)

## Type Definitions

[See Type Definitions](./types.md)

## Examples
- See [Examples](./examples.md)

## Next Steps

- Learn about the [React API](../react.md)
- Explore the [Client API](../client.md)
- Check out the [Type Definitions](../types.md) 