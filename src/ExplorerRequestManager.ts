import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import JSONBigInt from 'json-bigint';

import { IExplorerRequestConfiguration } from './interfaces/IExplorerRequestConfiguration';

export class ExplorerRequestManager {
  private JSONBI = JSONBigInt({ useNativeBigInt: true });

  private explorerHttpClient: AxiosInstance;

  defaultRequestConfig: IExplorerRequestConfiguration = {
    explorerUri: 'https://api.ergoplatform.com',
    throwOnError: true,
    axiosInstanceConfig: {},
    retryCount: 5,
    retryWaitTime: 2000,
    timeout: 5000,
    headers: {},
  };

  constructor(private explorerRequestConfig: IExplorerRequestConfiguration = {}) {
    this.explorerRequestConfig = {
      ...this.defaultRequestConfig,
      ...this.explorerRequestConfig,
    };

    const { timeout, explorerUri, axiosInstanceConfig, headers } = this.explorerRequestConfig;

    this.explorerHttpClient = axios.create({
      baseURL: explorerUri,
      timeout,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...axiosInstanceConfig,
    });
  }

  async requestWithRetries<T>(
    config: AxiosRequestConfig<T>,
    retriesLeft = this.explorerRequestConfig.retryCount as number
  ): Promise<T | undefined> {
    const { throwOnError, retryWaitTime } = this.explorerRequestConfig;
    try {
      const { data } = await this.explorerHttpClient.request<T, AxiosResponse<T>, T>(config);
      return data;
    } catch (ex) {
      if (retriesLeft < 1) {
        if (throwOnError) throw ex;
        return undefined;
      }
      /* eslint-disable-next-line no-console */
      console.log('EX occurred on axios request, retry...', (ex as any).message);
      return new Promise<T | undefined>((res) => {
        setTimeout(() => res(this.requestWithRetries<T>(config, retriesLeft - 1)), retryWaitTime);
      });
    }
  }
}
