import { AxiosRequestConfig } from 'axios';
import { IBox, ITimestampedBox } from './interfaces/explorer/IBox';
import { IAddressTokenAmounts } from './interfaces/IAddressTokenAmounts';
import { ITokenInfo } from './interfaces/ITokenInfo';
import { ITokenMarket } from './interfaces/ITokenMarket';
import { ITokenRate } from './interfaces/ITokenRate';
export declare const PoolSample = "1999030f0400040204020404040405feffffffffffffffff0105feffffffffffffffff01050004d00f040004000406050005000580dac409d819d601b2a5730000d602e4c6a70404d603db63087201d604db6308a7d605b27203730100d606b27204730200d607b27203730300d608b27204730400d6099973058c720602d60a999973068c7205027209d60bc17201d60cc1a7d60d99720b720cd60e91720d7307d60f8c720802d6107e720f06d6117e720d06d612998c720702720fd6137e720c06d6147308d6157e721206d6167e720a06d6177e720906d6189c72117217d6199c72157217d1ededededededed93c27201c2a793e4c672010404720293b27203730900b27204730a00938c7205018c720601938c7207018c72080193b17203730b9593720a730c95720e929c9c721072117e7202069c7ef07212069a9c72137e7214067e9c720d7e72020506929c9c721372157e7202069c7ef0720d069a9c72107e7214067e9c72127e7202050695ed720e917212730d907216a19d721872139d72197210ed9272189c721672139272199c7216721091720b730e";
export declare const tokenSwapValueFromBox: (box: ITimestampedBox) => ITokenRate;
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
