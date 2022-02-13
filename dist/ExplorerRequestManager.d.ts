import { AxiosRequestConfig } from 'axios';
export declare class ExplorerRequestManager {
    private explorerUri;
    private throwOnError;
    private JSONBI;
    private explorerHttpClient;
    constructor(explorerUri?: string, throwOnError?: boolean, axiosInstanceConfig?: AxiosRequestConfig);
    requestWithRetries<T>(config: AxiosRequestConfig<T>, retriesLeft?: number, retryWaitTime?: number, throwOnError?: boolean): Promise<T | undefined>;
}
