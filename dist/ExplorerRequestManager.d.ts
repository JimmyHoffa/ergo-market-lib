import { AxiosRequestConfig } from 'axios';
import { IExplorerRequestConfiguration } from './interfaces/IExplorerRequestConfiguration';
export declare class ExplorerRequestManager {
    private explorerRequestConfig;
    private JSONBI;
    private explorerHttpClient;
    defaultRequestConfig: IExplorerRequestConfiguration;
    constructor(explorerRequestConfig?: IExplorerRequestConfiguration);
    requestWithRetries<T>(config: AxiosRequestConfig<T>, retriesLeft?: number): Promise<T | undefined>;
}
