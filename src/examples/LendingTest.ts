import { LendingService } from "../index";
 
async function run() {

  console.log('start------------')
  const lend = new LendingService("0xc341c0b5b6fece90782ad16a617a8464353cb2d7090f6956805d4efc0ddc7bec")

  console.log("-----------------------------------------")
  const assets = await lend.getAssets(); 
  console.log(assets)
 

  console.log("-----------------------------------------")
  const supply =await lend.supply("0x1::aptos_coin::AptosCoin",1.5); 
  console.log(supply)

  console.log("-----------------------------------------")
  const withdraw =await lend.withdraw("0x1::aptos_coin::AptosCoin",1.5); 
  console.log(withdraw)

  console.log("-----------------------------------------")
  const borrow =await lend.borrow("0x1::aptos_coin::AptosCoin",1.5); 
  console.log(borrow)

  console.log("-----------------------------------------")
  const repay =await lend.repay("0x1::aptos_coin::AptosCoin",1.5); 
  console.log(repay)
}

run();
