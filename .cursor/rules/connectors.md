---
description: "Patterns for creating wallet connectors"
globs: ["**/connectors/*.ts"]
---

## Before Creating a Connector

**IMPORTANT:** Before implementing a new connector, always ask the user for:

1. **Provider documentation URL** - The official documentation for the wallet's Bitcoin provider API
2. **PSBT format** - Whether the provider's `signPsbt` method accepts/returns **base64** or **hex** format

Example prompt:
> "To create this connector, I need:
> 1. The wallet's provider documentation (e.g., developer docs URL)
> 2. What format does their signPsbt use - base64 or hex?"

---

## PSBT Format Handling

**Critical:** Different wallet providers use different PSBT formats. Our connectors must:

1. **Accept hex** from our internal API
2. **Convert to provider's format** (base64 or hex) when calling the provider
3. **Always return hex** regardless of what the provider returns

```typescript
async request({ method, params }: ProviderRequestParams): Promise<any> {
  switch (method) {
    case 'signPsbt': {
      const { psbt, ...options } = params as SignPsbtParameters
      
      // Provider uses BASE64:
      const psbtBase64 = hexToBase64(psbt)  // Convert hex → base64
      const { result } = await provider.signPsbt(psbtBase64, options)
      return base64ToHex(result.psbt)       // Convert base64 → hex (ALWAYS return hex)
      
      // Provider uses HEX:
      const signedPsbt = await provider.signPsbt(psbt, options)
      return signedPsbt                      // Already hex, return as-is
      
      // Provider uses Uint8Array:
      const psbtBytes = hexToUint8Array(psbt)
      const signedBytes = await provider.signPSBT(psbtBytes, options)
      return uint8ArrayToHex(signedBytes)   // Convert to hex (ALWAYS return hex)
    }
  }
}
```

**Format conversion utilities from `@bigmi/core`:**
- `hexToBase64(hex)` - Convert hex string to base64
- `base64ToHex(base64)` - Convert base64 to hex string

---

## Connector Structure

All wallet connectors must follow this consistent structure:

### 1. Static Type Property

Assign the static `type` property before the function definition:

```typescript
connectorName.type = 'UTXO' as const
export function connectorName(parameters: UTXOConnectorParameters = {}) {
  // ...
}
```

### 2. Required Properties

Every connector must return an object with these properties:

```typescript
return createConnector<UTXOWalletProvider | undefined, ConnectorProperties>((config) => ({
  id: 'connector-id',           // Unique identifier
  name: 'Connector Name',       // Human-readable name
  type: connectorName.type,     // Reference the static type
  icon: 'data:image/...',       // Base64 encoded icon
  // ... methods
}))
```

### 3. Required Methods

Implement all standard connector methods:

```typescript
async setup() {
  // Initialization logic
},
async getInternalProvider() {
  // Return the raw wallet provider or undefined
},
async getProvider() {
  // Return wrapped provider with request method
},
async request({ method, params }: ProviderRequestParams): Promise<any> {
  // Handle RPC requests with switch statement
  // IMPORTANT: Always return hex from signPsbt, convert if provider uses base64
},
async connect({ isReconnecting } = {}) {
  // Connect to wallet, return { accounts, chainId }
},
async disconnect() {
  // Clean up event listeners and storage
},
async getAccounts() {
  // Return accounts from provider
},
async getChainId() {
  // Return current chain ID
},
async isAuthorized() {
  // Check if connector is authorized
},
```

### 4. Event Handlers

Implement event handlers for wallet state changes:

```typescript
async onAccountsChanged(accounts) {
  if (accounts.length === 0) {
    this.onDisconnect()
  } else {
    config.emitter.emit('change', { accounts })
  }
},
onChainChanged(chainId) {
  config.emitter.emit('change', { chainId })
},
async onDisconnect(_error) {
  config.emitter.emit('disconnect')
},
```

### 5. Provider Detection Pattern

Use multi-fallback detection for wallet providers:

```typescript
async getInternalProvider() {
  if (typeof window === 'undefined') {
    return undefined
  }
  
  // Primary check
  if ('walletName' in window && anyWindow.walletName?.bitcoin) {
    const provider = anyWindow.walletName.bitcoin
    if (provider.isWalletName) {
      return provider
    }
  }
  
  // Fallback checks...
  return undefined
}
```

### 6. Shim Disconnect Pattern

Use storage-based connection state management:

```typescript
const { shimDisconnect = true } = parameters

// On connect - remove disconnected shim
if (shimDisconnect) {
  await Promise.all([
    config.storage?.setItem(`${this.id}.connected`, true),
    config.storage?.removeItem(`${this.id}.disconnected`),
  ])
}

// On disconnect - add disconnected shim
if (shimDisconnect) {
  await Promise.all([
    config.storage?.setItem(`${this.id}.disconnected`, true),
    config.storage?.removeItem(`${this.id}.connected`),
  ])
}
```

### 7. Event Type Definitions

Define typed event maps for each connector:

```typescript
export type ConnectorBitcoinEventMap = {
  accountsChanged(accounts: Account[]): void
}

export type ConnectorBitcoinEvents = {
  on<TEvent extends keyof ConnectorBitcoinEventMap>(
    event: TEvent,
    listener: ConnectorBitcoinEventMap[TEvent]
  ): void
  removeListener<TEvent extends keyof ConnectorBitcoinEventMap>(
    event: TEvent,
    listener: ConnectorBitcoinEventMap[TEvent]
  ): void
}
```
