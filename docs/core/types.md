# Type Definition

## `Client`

The main client type.

```typescript
interface Client {
  chain: Chain
  transport: Transport
  request: (params: RequestParams) => Promise<any>
}
```

## `Chain`

Chain configuration type.

```typescript
interface Chain {
  id: number
  name: string
  network: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: {
    [key: string]: string
  }
}
```

### `Transport`

Transport layer type.

```typescript
interface Transport {
  request: (params: RequestParams) => Promise<any>
}
```

[⬅️ back](./index.md)
