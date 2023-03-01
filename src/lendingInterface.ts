
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
    private poolAddress = "0xabaf41ed192141b481434b99227f2b28c313681bc76714dc88e5b2e26b24b84c";
    private configAddress = "0x735f07b59dc48411872c00f946996795e7f8aeb4b3bd8f2c315a511d026fd0de";
    private configAccount = "0x4eaae115c180955cca2c8e84c128176cd6484a11713304ed22c5737e93b8c25f";
    private coins: string[] | undefined;

    /**
     * Constructs a new Connection.
     *
     * @param _account Current User Wallet Address 
     * @param _endpoint Aptos Node API. Example:  https://fullnode.mainnet.aptoslabs.com
     */
    constructor(_account: string, _endpoint?: string) {
        this.account = _account
        this.endpoint = _endpoint ? _endpoint : "https://fullnode.mainnet.aptoslabs.com"
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

    protected async getCoins(): Promise<string[]> {
        if (!this.coins || this.coins.length == 0) {
            const lendPool = await this.getResource(this.poolAddress, this.protocolAddress + "::pool::LendProtocol")
            this.coins = lendPool.coins
        }
        return this.coins as string[]
    }

    protected async getCoinInfo(coinAddress: string) {
        if (coinAddress === '0x1') return { data: { decimals: 8, name: 'Aptos' } }
        const coinInfo = await this.getResource(coinAddress.split("::")[0], `0x1::coin::CoinInfo<${coinAddress}>`)
        return coinInfo
    }

    protected async getSingleBalance(coinAddress: string, table: string, params: any) {
        const coinInfo = await this.getCoinInfo(coinAddress)
        const tableData = await this.getTableData({ table, data: { ...params, key: coinAddress } })
        const singleBalance = { name: coinInfo.name, decimals: coinInfo.decimals, symbol: coinInfo.symbol, ...tableData }
        return singleBalance
    }

    protected async getPayload(lendingType: LendingType, coinAddress: string, amount: number): Promise<TransactionPayload> {
        const coinArray = await this.getCoins();
        if (coinArray.indexOf(coinAddress) > -1) {
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
        } else {
            throw new Error("this token is not supported")
        }

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
    * Get information on lending pools
    * @returns  pools supply and borrow data
    */
    async getPoolInfos(): Promise<any> {
        const balances: {
            name: string;
            symbol: string; decimals: number;
            address: string;
            borrow_pool: { total_value: string; apy: number; };
            supply_pool: { total_value: any; apy: number; };
        }[] = [];
        try {

            const configData = await this.getResource(this.configAccount, this.configAddress + "::interest_rate::Params")
            const lendPool = await this.getResource(this.poolAddress, this.protocolAddress + "::pool::LendProtocol")
            const coins = lendPool.coins
            const table = lendPool.pools.handle 

            const params = {
                key_type: '0x1::string::String',
                value_type: `${this.protocolAddress}::pool::Pool`,
            }
            const coinPools = await Promise.all(coins.map((i: string) => this.getTableData({ table, data: { ...params, key: i } })))
            const coinInfos = await Promise.all(coins.map((i: string) => this.getCoinInfo(i)))

            coinPools.forEach(async (data, i) => {

                const _rateVal = configData.vals.find((r: { ct: string; }) => r.ct == coins[i])
                const _bReserves = new BigNumber(_rateVal.reserves).div(1000).toNumber()
                const _remainSupply = new BigNumber(data.supply_pool.total_value).shiftedBy(-coinInfos[i].decimals).minus(_bReserves).toNumber() 
                const U_a = new BigNumber(data.borrow_pool.total_value).shiftedBy(-coinInfos[i].decimals).div(_remainSupply == 0 ? 1 : _remainSupply).toNumber()
 
                let _borrowRateAPR = 0
                if (U_a <= 0.8) {
                    const k = new BigNumber(_rateVal.k).div(100).toNumber()
                    const b = new BigNumber(_rateVal.b).shiftedBy(-6).toNumber()
                    _borrowRateAPR = (k * U_a + b)
                } else {
                    const a = new BigNumber(_rateVal.a).div(1).toNumber()
                    const c = new BigNumber(_rateVal.c).shiftedBy(-4).toNumber()
                    const d = new BigNumber(_rateVal.d).shiftedBy(-6).toNumber()
                    _borrowRateAPR = a * (U_a - c) * (U_a - c) + d
                }

                const dayAPR = new BigNumber(_borrowRateAPR).div(365).plus(1).toNumber()
                const _borrowAPY = Math.pow(dayAPR, 365) - 1

                const model = {
                    name: coinInfos[i].name,
                    symbol: coinInfos[i].symbol,
                    decimals: coinInfos[i].decimals,
                    address: coins[i],
                    borrow_pool: {
                        total_value: data.borrow_pool.total_value,
                        apy: _borrowAPY
                    },
                    supply_pool: {
                        total_value: data.supply_pool.total_value,
                        apy: _borrowAPY * U_a
                    }
                }
                balances.push(model)
            }) 

            return balances

        } catch (error) {
            return balances
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