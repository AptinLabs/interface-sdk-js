
import axios from 'axios';
import { BigNumber } from 'bignumber.js';

declare global {
    interface Window {
        aptos: any;
        martian: any;
        pontem: any;
        fewcha: any;
        coin98: any;
        bitkeep: any;
        okxwallet: any;
        trustwallet: any;
        rise: any;
    }
}

type TableDataPro = {
    table: string;
    data: any;
};
export type LendingAssets = {
    supply: PoolData[],
    borrow: PoolData[],
};
export type PoolData = {
    name: string;
    decimals: number;
    symbol: string;
    amount: string;
    index_interest: string;
    interest: string;
    reward: string;
    last_update_time_interest: string;
    last_update_time_reward: string;
}

export enum WalletType {
    Martian = 'martian',
    Pontem = 'pontem',
    Fewcha = 'fewcha',
    Petra = 'petra',
    Coin98 = 'coin98',
    Bitkeep = 'bitkeep',
    Blocto = 'blocto',
    OKX = 'okx',
    TokenPocket = 'tokenpocket',
    Rise = 'rise',
    Trust = 'trust',
}

export enum LendingType {
    Supply = "supply",
    Borrow = "borrow",
    Withdraw = "withdraw",
    Repay = "repay"
}

export class LendingService {
    private endpoint: string;
    private account: string;
    private protocolAddress: string = "0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896";
    //private poolAddress: string = "0xabaf41ed192141b481434b99227f2b28c313681bc76714dc88e5b2e26b24b84c";

    /**
     * Constructs a new Connection.
     *
     * @param _account Current User Wallet Address 
     * @param _endpoint Aptos Node API. Example:  https://fullnode.mainnet.aptoslabs.com/v1
     */
    constructor(_account: string, _endpoint?: string) {
        this.account = _account
        this.endpoint = _endpoint ? _endpoint : "https://aptos-mainnet.pontem.network"
    }

    protected async get(url: string) {
        return (await axios.get(url)).data
    }

    protected async post(url: string, body: any) {
        return (await axios.post(url, body)).data
    }

    protected async getResource(account: string, key: string) {
        let url = `${this.endpoint}/v1/accounts/${account}/resource/${key}`
        const { data } = await this.get(url)
        return data
    }

    protected async getTableData({ table, data }: TableDataPro) {
        const response = await this.post(`${this.endpoint}/v1/tables/${table}/item`, data)
        return response
    }


    protected async getSingleBalance(coinAddress: string, table: string, params: any) {
        const coinInfo = await this.getResource(coinAddress.split("::")[0], `0x1::coin::CoinInfo<${coinAddress}>`)
        const tableData = await this.getTableData({ table, data: { ...params, key: coinAddress } })
        const singleBalance = { name: coinInfo.name, decimals: coinInfo.decimals, symbol: coinInfo.symbol, ...tableData }
        return singleBalance
    }


    protected async submitTransaction(walletType: WalletType, payload: any): Promise<string> {
        const options = {
            max_gas_amount: "500000",
            gas_unit_price: 100,
        };

        let hash = ''
        try {
            switch (walletType) {
                case WalletType.Martian:
                    {
                        const response = await window.martian.connect()
                        const sender = response.address
                        const transaction = await window.martian.generateTransaction(sender, payload, options)
                        hash = await window.martian.signAndSubmitTransaction(transaction)
                    }
                    break;
                case WalletType.Petra:
                    {
                        const txnHash = await window.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
                case WalletType.Pontem:
                    {
                        const txnHash = await window.pontem.signAndSubmit(payload, options)
                        hash = txnHash.result.hash
                    }
                    break;
                case WalletType.Fewcha:
                    {
                        const txnHash = await window.fewcha.generateTransaction(payload, options)
                        hash = txnHash.data
                    }
                    break;
                case WalletType.Coin98:
                    {
                        const txnHash = await window.coin98.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
                case WalletType.Bitkeep:
                    {
                        const txnHash = await window.bitkeep.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
                case WalletType.OKX:
                    {
                        const txnHash = await window.okxwallet.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
                case WalletType.Trust:
                    {
                        const txnHash = await window.trustwallet.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
                case WalletType.Rise:
                    {
                        const txnHash = await window.rise.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
                default:
                    {
                        const txnHash = await window.aptos.signAndSubmitTransaction(payload)
                        hash = txnHash.hash
                    }
                    break;
            }
        } catch (error) {
            console.log(error)
        }
        return hash
    }

    /**
     * Get debt data
     * @returns  user supply and borrow data
     */
    async getAssets(): Promise<LendingAssets> {
        try {

            const userData = await this.getResource(this.account, this.protocolAddress + "::pool::Positions")

            const paramsSupply = {
                key_type: "0x1::string::String",
                value_type: this.protocolAddress + "::pool::SupplyPosition",
            }
            const supplyList = await Promise.all(userData.supply_coins.map((i: string) => this.getSingleBalance(i, userData.supply_position.handle, paramsSupply)))

            const paramsBorrow = {
                key_type: "0x1::string::String",
                value_type: this.protocolAddress + "::pool::BorrowPosition",
            }
            const borrowList = await Promise.all(userData.borrow_coins.map((i: string) => this.getSingleBalance(i, userData.borrow_position.handle, paramsBorrow)))

            return {
                supply: supplyList,
                borrow: borrowList
            };

        } catch (error) {
            return {
                supply: [],
                borrow: []
            }
        }

    }

    /**
     * get payload
     * @param lendingType  Lending Type
     * @param coinAddress  token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount Example:10.66
     */
    async getPayload(lendingType: LendingType, coinAddress: string, amount: number) {
        const payload = {
            function: this.protocolAddress + "::lend::" + lendingType.toString(),
            type_arguments: [coinAddress],
        };

        const coinInfo = await this.getResource(coinAddress.split("::")[0], `0x1::coin::CoinInfo<${coinAddress}>`)
        const amount_Wei = new BigNumber(amount).shiftedBy(coinInfo.decimals).integerValue(BigNumber.ROUND_DOWN).toNumber();

        if (lendingType == LendingType.Supply)
            return { ...payload, arguments: [amount_Wei, true] }
        else if (lendingType == LendingType.Withdraw)
            return { ...payload, arguments: [amount_Wei, this.account] }
        else if (lendingType == LendingType.Borrow)
            return { ...payload, arguments: [amount_Wei] }
        else
            return { ...payload, arguments: [amount_Wei] }

    }

    /**
     * supply
     * @param walletType wallets used by current users. Example:petra\martian
     * @param coinAddress  token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount  supply amount. Example:10.66
     * @returns transaction Hash
     */
    async supply(walletType: WalletType, coinAddress: string, amount: number): Promise<string> {

        const payload = this.getPayload(LendingType.Supply, coinAddress, amount)
        const hash = await this.submitTransaction(walletType, payload)
        return hash

    }

    /**
     * withdraw
     * @param coinAddress token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount  withdraw amount. Example:10.66 
     * @returns transaction Hash 
     */
    async withdraw(walletType: WalletType, coinAddress: string, amount: number): Promise<string> {

        const payload = this.getPayload(LendingType.Withdraw, coinAddress, amount)
        const hash = await this.submitTransaction(walletType, payload)
        return hash
    }

    /**
     * borrow
     * @param coinAddress token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount  borrow amount. Example:10.66
     * @returns transaction Hash 
     */
    async borrow(walletType: WalletType, coinAddress: string, amount: number): Promise<string> {

        const payload = this.getPayload(LendingType.Borrow, coinAddress, amount)
        const hash = await this.submitTransaction(walletType, payload)
        return hash
    }

    /**
     * repay
     * @param coinAddress token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount repay amount. Example:10.66
     * @returns transaction Hash 
     */
    async repay(walletType: WalletType, coinAddress: string, amount: number): Promise<string> {

        const payload = this.getPayload(LendingType.Repay, coinAddress, amount)
        const hash = await this.submitTransaction(walletType, payload)
        return hash
    }

}