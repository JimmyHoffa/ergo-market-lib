import { AxiosRequestConfig } from 'axios';
declare type ExplorerRequestHeaders = {
    [key: string]: string;
};
export interface IExplorerRequestConfiguration {
    explorerUri?: string;
    axiosInstanceConfig?: AxiosRequestConfig<any>;
    retryCount?: number;
    retryWaitTime?: number;
    throwOnError?: boolean;
    headers?: ExplorerRequestHeaders;
    timeout?: number;
}
export {};
