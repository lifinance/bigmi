# React API Reference

This document provides a comprehensive reference for the `@bigmi/react` package, which contains React hooks and components for building Bitcoin applications.

## Provider

### `BigmiProvider`

The main provider component that enables Bigmi functionality in your React application.

```typescript
import { BigmiProvider, phantom, binance, okx } from '@bigmi/react'

function App() {
  return (
    <BigmiProvider
      config={{
        autoConnect: true,
        connectors: [phantom(), binance(), okx()],
      }}
    >
      <YourApp />
    </BigmiProvider>
  )
}
```

#### Props

- `config`: Configuration object
  - `autoConnect?`: Whether to automatically connect to the last used wallet
  - `connectors?`: Array of wallet connectors to use
  - `pollingInterval?`: How often to poll for updates

## Hooks

This packages comes with react hooks to make it easy to use in your application

- Explore the [react hooks](./hooks.md)

## Next Steps

- Check out the [Type Definitions](./types.md)
- Learn about the [Core API](../core/index.md)
