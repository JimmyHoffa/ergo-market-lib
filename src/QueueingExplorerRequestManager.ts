import { AxiosRequestConfig } from 'axios';

import { ExplorerRequestManager } from './ExplorerRequestManager';
import { ProducerConsumerActionQueue } from './ProducerConsumerActionQueue';
import { IExplorerRequestConfiguration } from './interfaces/IExplorerRequestConfiguration';

export class QueueingExplorerRequestManager {
  private requestManager: ExplorerRequestManager;

  constructor(
    private actionQueue: ProducerConsumerActionQueue = new ProducerConsumerActionQueue(),
    explorerRequestConfig?: IExplorerRequestConfiguration
  ) {
    this.requestManager = new ExplorerRequestManager(explorerRequestConfig);
  }

  async requestWithRetries<T>(config: AxiosRequestConfig<T>, retriesLeft?: number): Promise<T | undefined> {
    return this.actionQueue.push(async () => this.requestManager.requestWithRetries<T>(config, retriesLeft));
  }
}
