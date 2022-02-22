import { AxiosRequestConfig } from 'axios';
import { IBox, ITimestampedBox } from './interfaces/explorer/IBox';
import { IAddressTokenAmounts } from './interfaces/IAddressTokenAmounts';
import { ITokenInfo } from './interfaces/ITokenInfo';
import { ITokenMarket } from './interfaces/ITokenMarket';
import { ITokenRate } from './interfaces/ITokenRate';
export declare const tokenSwapValueFromBox: (box: IBox, timestamp?: number) => ITokenRate;
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
    getTransactionTimestamp(transactionId: string, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<number | undefined>;
    getBoxesAtUri(uriForBoxes: string, numberToRetrieve?: number, initialOffset?: number, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<IBox[]>;
    makeChunkedRequests<T>(requestConfigs: AxiosRequestConfig<T>[], numberOfTimesToRetry?: number, retryWaitTime?: number, chunkSize?: number): Promise<T[]>;
    getTimestampsForBoxes(boxesWithoutCreationDates: IBox[]): Promise<ITimestampedBox[]>;
    getTokenRatesForTimestampedBoxes(boxesWithCreationDates: IBox[]): Promise<ITokenRate[]>;
    getTimestampedBoxesFromBoxes(boxesToTimestamp: IBox[], numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<ITimestampedBox[]>;
    getBalanceTimelineAtAddress(address: string, numberToRetrieve?: number, initialOffset?: number, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<any[]>;
    getHistoricalTokenRates(numberToRetrieve?: number, initialOffset?: number, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<ITokenRate[]>;
    getTokenRates(numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<ITokenRate[]>;
    multiplyFractions(amountA: number, decimalsA: number, amountB: number, decimalsB: number): any;
    decorateTokenAmountsWithValues(value: ITokenRate, tokenAmountsMap: IAddressTokenAmounts): void;
    getTokenBalanceByAddress(address: string, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<IAddressTokenAmounts | undefined>;
    getTokenInfoById(tokenId: string, numberOfTimesToRetry?: number, retryWaitTime?: number): Promise<ITokenInfo>;
    getSwappableTokens(): Promise<ITokenInfo[]>;
    getTokenRateFor(tokenIds: string[]): Promise<ITokenRate[]>;
}
