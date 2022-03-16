import { AxiosRequestConfig } from 'axios';
import { ProducerConsumerActionQueue } from './ProducerConsumerActionQueue';
import { IExplorerRequestConfiguration } from './interfaces/IExplorerRequestConfiguration';
export declare class QueueingExplorerRequestManager {
    private actionQueue;
    private requestManager;
    constructor(actionQueue?: ProducerConsumerActionQueue, explorerRequestConfig?: IExplorerRequestConfiguration);
    requestWithRetries<T>(config: AxiosRequestConfig<T>, retriesLeft?: number): Promise<T | undefined>;
}
