import { AxiosRequestConfig } from 'axios';
import { IBox } from './interfaces/explorer/IBox';
import { IAddressTokenAmounts } from './interfaces/IAddressTokenAmounts';
import { ITokenInfo } from './interfaces/ITokenInfo';
import { ITokenMarket } from './interfaces/ITokenMarket';
import { ITokenRate } from './interfaces/ITokenRate';
export declare const tokenSwapValueFromBox: (box: IBox) => ITokenRate;
export declare type ExplorerTokenMarketConfig = {
    explorerUri?: string;
    defaultRetryCount?: number;
    defaultRetryWaitMillis?: number;
    throwOnError?: boolean;
    axiosInstanceConfig?: AxiosRequestConfig;
};
export declare class ExplorerTokenMarket implements ITokenMarket {
    private explorerHttpClient;
    private explorerUri;
    private defaultRetryCount;
    private defaultRetryWaitMillis;
    private throwOnError;
    constructor({ explorerUri, defaultRetryCount, defaultRetryWaitMillis, throwOnError, axiosInstanceConfig, }?: ExplorerTokenMarketConfig);
    getTokenRates(numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<ITokenRate[]>;
    multiplyFractions(amountA: number, decimalsA: number, amountB: number, decimalsB: number): any;
    decorateTokenAmountsWithValues(value: ITokenRate, tokenAmountsMap: IAddressTokenAmounts): void;
    getTokenBalanceByAddress(address: string, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<IAddressTokenAmounts | undefined>;
    getTokenInfoById(tokenId: string, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<ITokenInfo>;
    getSwappableTokens(): Promise<ITokenInfo[]>;
    getTokenRateFor(tokenIds: string[]): Promise<ITokenRate[]>;
}
