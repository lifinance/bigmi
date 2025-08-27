# React API Reference

This document provides a comprehensive reference for the `@bigmi/react` package, which contains React hooks and components for building Bitcoin applications.

## Provider

### `BigmiProvider`

The main provider component that enables Bigmi functionality in your React application.

```typescript
import { BigmiProvider } from '@bigmi/react'
import { createConfig, phantom, xverse, binance } from '@bigmi/client'
import { bitcoin } from '@bigmi/core'

const config = createConfig({
  chains: [bitcoin],
  connectors: [phantom(), binance(), okx()]
})

function App() {
  return (
    <BigmiProvider
      config={config}
    >
      <YourApp />
    </BigmiProvider>
  )
}
```

#### Props

- `config`: Configuration object
- `initialState`?: initial state object
- `reconnectOnMount`?: boolean 

## Hooks

This packages comes with react hooks to make it easy to use in your application

- Explore the [react hooks](./hooks.md)

## Next Steps

- Learn about the [Core API](../core/index.md)
