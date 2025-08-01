# Wallet Connectors

The client package provides a set of pre-built connectors for popular Bitcoin wallet extensions. Each connector implements a standard interface for wallet interaction.

## Supported Wallets

- Binance Wallet
- Xverse
- Phantom
- Bitget
- ctrl
- Leather
- OKX
- Onekey
- Oyl
- Xverse
- Unisat
- Magic Eden
- Dynamic (embedded wallet)

## Connector Configuration

Each wallet connector can be configured with specific options:

```typescript
import { bitcoin } from '@bigmi/core'

const connector = binance()
```

## Custom Connectors

You can create custom connectors by defining a function that returns a `createConnectorFn` with config properties and methods implemented.

```typescript
import { createConnector } from '@bigmi/client'

export function customConnector(parameters) {
    return createConnector((config) => ({
        id: 'connector_id', 
        name: 'custom connector', // name of the wallet
        type: 'UTXO', 
        icon: 'data:image/svg+xml', //data URI of image

        async setup() {
            // method called when the connector is instantiate to run setup logic
        },

        async getInternalProvider(){
            // method that returns the provider object from the wallet
            // usually obtained from the window object
        },

        async connect () {
            // method to call connect method of the provider 
            //  returns the connected account, and the chain
        },

        async request(params) {
            // method used to send rpc requests to the provider
        }
        async getAccounts() {
            // method to get accounts from the wallet
        }

    }))
}
```
