
import axios from 'axios';
import { BigNumber } from 'bignumber.js';


type TableDataPro = {
    table: string;
    data: any;
};

enum LendingType {
    Supply = "supply",
    Borrow = "borrow",
    Withdraw = "withdraw",
    Repay = "repay"
}

export type LendingAssets = {
    supply: PoolData[];
    borrow: PoolData[];
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


export type TransactionPayload = {
    function: string;
    type_arguments: string[];
    arguments: any[];
}

export class LendingService {
    private endpoint: string;
    private account: string;
    private protocolAddress = "0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896";
    
    /**
     * Constructs a new Connection.
     *
     * @param _account Current User Wallet Address 
     * @param _endpoint Aptos Node API. Example:  https://fullnode.mainnet.aptoslabs.com
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
        const url = `${this.endpoint}/v1/accounts/${account}/resource/${key}`
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
 
    protected async getPayload(lendingType: LendingType, coinAddress: string, amount: number): Promise<TransactionPayload> {
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
     * supply 
     * @param coinAddress  token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount  supply amount. Example:10.66
     * @returns supply transactionPayload
     */
    async supply(coinAddress: string, amount: number): Promise<TransactionPayload> {

        return this.getPayload(LendingType.Supply, coinAddress, amount)
    }

    /**
     * withdraw
     * @param coinAddress token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount  withdraw amount. Example:10.66 
     * @returns withdraw transactionPayload
     */
    async withdraw(coinAddress: string, amount: number): Promise<TransactionPayload> {

        return this.getPayload(LendingType.Withdraw, coinAddress, amount)
    }

    /**
     * borrow
     * @param coinAddress token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount  borrow amount. Example:10.66
     * @returns borrow transactionPayload
     */
    async borrow(coinAddress: string, amount: number): Promise<TransactionPayload> {

        return this.getPayload(LendingType.Borrow, coinAddress, amount)
    }

    /**
     * repay
     * @param coinAddress token address. Example: 0x1::aptos_coin::AptosCoin
     * @param amount repay amount. Example:10.66
     * @returns repay transactionPayload
     */
    async repay(coinAddress: string, amount: number): Promise<TransactionPayload> {

        return this.getPayload(LendingType.Repay, coinAddress, amount)
    }

}