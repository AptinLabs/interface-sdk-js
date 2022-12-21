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

# Quickstart

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
 
