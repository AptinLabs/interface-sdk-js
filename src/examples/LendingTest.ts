import { LendingService, WalletType, LendingType } from "../index";


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



async function run() {

  console.log('start------------')
  const lend = new LendingService("0xc341c0b5b6fece90782ad16a617a8464353cb2d7090f6956805d4efc0ddc7bec")

  console.log("-----------------------------------------")
  const assets = await lend.getAssets(); 
  console.log(assets)

  console.log("-----------------------------------------")
  const payload = await lend.getPayload(LendingType.Withdraw, "0x1::aptos_coin::AptosCoin", 1.5);
  console.log(payload)

  console.log("-----------------------------------------")
  const supply =await lend.supply(WalletType.Martian,"0x1::aptos_coin::AptosCoin",1.5); 
  console.log(supply)


}

run();
