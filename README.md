# Aptin interface-sdk-js 

Aptin lending service interface on Aptos networks.

## Installation
 
```
npm i @aptin/interface-sdk-js
```

**or**

```
yarn add @aptin/interface-sdk-js
```

## Quickstart

 Here is a demo of the most important interface services

 
```typescript
import { LendingService } from '@aptin/interface-sdk-js'

//The first parameter is the user's wallet address
//It is better to use your own endpoints for the second parameter
const lend = new LendingService("0x3d231debf7a43e1334228c30955828226f91570f799a46cbda8bc6109dabc01c");
 
//Get the current user's lending data
//Return user supply and borrow data
const assets = await lend.getAssets(); 
```


## Submit and sign transaction

**Supply Transaction**
```typescript
//Get supply payload
//Parameters are token address and supply amount
//Return TransactionPayload
const supplyPayload =await lend.supply("0x1::aptos_coin::AptosCoin",1.5); 

//The project then calls the wallet directly to sign the transaction
//Official wallet for example:
const txnHash = await window.aptos.signAndSubmitTransaction(supplyPayload);
```

**Withdraw Transaction**
```typescript
const withdrawPayload =await lend.withdraw("0x1::aptos_coin::AptosCoin",1.5)
```

**Borrow Transaction**
```typescript
const borrowPayload =await lend.borrow("0x1::aptos_coin::AptosCoin",1.5) 
```


**Repay Transaction**
```typescript
const repayPayload =await lend.repay("0x1::aptos_coin::AptosCoin",1.5)
```
 

## Supported coin list
 
| name                    | symbol |                                      address                                      |
| ----------------------- | ------ | --------------------------------------------------------------------------------- |
| APTOS                   | APT    | `0x1::aptos_coin::AptosCoin`                                                      |
| Wrapped BTC(Wormhole)   | WBTC   | `0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T`     |
| Wrapped Ether(Wormhole) | WETH   | `0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T`     |
| USD Coin(Wormhole)      | USDC   | `0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T`     |
| Wrapped Ether(LayerZero)| zWETH  | `0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH` |
| USD Coin(LayerZero)     | zUSDC  | `0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC` |
| Tortuga Staked Aptos    | tAPT   | `0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin` |
